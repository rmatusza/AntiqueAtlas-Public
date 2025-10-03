"""
explain.py — Generate human-readable explanations from a trained pipeline.

What it does
------------
- Loads a serialized sklearn Pipeline (preprocess + TransformedTargetRegressor).
- Extracts linear coefficients (in log-price space) aligned to final feature names.
- Computes global importances by attribute family (|coef| * std(feature)).
- Optionally emits per-item contribution breakdowns (log-space exact; dollar-space via toggling groups).
- Saves:
    - artifacts/coefficients.csv      (feature, family, coef)
    - artifacts/importances.csv       (family, importance, percent)
    - artifacts/item_explanations.csv (optional; baseline, contributions, prediction)

Usage
-----
python -m src.explain \
  --model artifacts/pipeline.joblib \
  --data data/swords_test.parquet \
  --coefs artifacts/coefficients.csv \
  --importances artifacts/importances.csv \
  --items artifacts/item_explanations.csv \
  --max-items 200

Notes
-----
- Coefficients live in **log(price)** space due to TransformedTargetRegressor (func=log1p).
- Global importances use the **standard deviation of transformed features** computed on the provided data.
- Per-item dollar contributions are computed by **group toggling** (baseline vs baseline+group) for interpretability.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

from .pipeline import DEFAULT_CONFIG, get_feature_names


# ------------------------------
# Helpers
# ------------------------------

def _family_for_feature(name: str, config: Dict[str, Any]) -> str:
    """Map a feature name to an attribute family using config heuristics.

    Rules:
    - Multi-label: names like "material__gold" → family "material" (text before "__").
    - OneHot single-cats: names like "condition_Excellent" → family "condition" (text before first "_").
    - Numeric: exact column names (e.g., "bladeLength") → family equals column name.
    """
    if "__" in name:
        return name.split("__", 1)[0]
    if "_" in name:
        return name.split("_", 1)[0]
    return name


def _linear_bits(pipeline: Pipeline) -> Tuple[np.ndarray, float]:
    """Return (coef_vector, intercept) from TransformedTargetRegressor's inner regressor.

    Coefficients are in **log-price** space.
    """
    # Pipeline: ('preprocess', ColumnTransformer) -> ('model', TransformedTargetRegressor)
    ttr = pipeline.named_steps["model"]
    reg = ttr.regressor_
    coef = getattr(reg, "coef_", None)
    intercept = getattr(reg, "intercept_", 0.0)
    if coef is None:
        raise RuntimeError("Inner regressor has no coef_. Ensure a linear model was used.")
    coef = np.asarray(coef, dtype=float).ravel()
    return coef, float(intercept)


def _transform_features(pipeline: Pipeline, X: pd.DataFrame) -> np.ndarray:
    """Apply the fitted ColumnTransformer to X and return the final feature matrix."""
    ct: ColumnTransformer = pipeline.named_steps["preprocess"]
    return ct.transform(X)


def _std_by_feature(pipeline: Pipeline, X: pd.DataFrame, feature_names: List[str]) -> pd.Series:
    Z = _transform_features(pipeline, X)
    # Ensure dense array
    if hasattr(Z, "toarray"):
        Z = Z.toarray()
    std = np.std(Z, axis=0, ddof=0)
    return pd.Series(std, index=feature_names)


def _group_map(feature_names: List[str], config: Dict[str, Any]) -> Dict[str, List[int]]:
    fam_to_idx: Dict[str, List[int]] = {}
    for idx, name in enumerate(feature_names):
        fam = _family_for_feature(name, config)
        fam_to_idx.setdefault(fam, []).append(idx)
    return fam_to_idx


def _coef_table(coef: np.ndarray, feature_names: List[str], config: Dict[str, Any]) -> pd.DataFrame:
    df = pd.DataFrame({
        "feature": feature_names,
        "coef_log": coef,
    })
    df["family"] = [ _family_for_feature(n, config) for n in feature_names ]
    df["abs_coef_log"] = df["coef_log"].abs()
    return df.sort_values("abs_coef_log", ascending=False).reset_index(drop=True)


def _importance_table(coefs: pd.Series, stds: pd.Series, families: List[str]) -> pd.DataFrame:
    # importance_j = |coef_j| * std_j  (all in log space)
    imp = (coefs.abs() * stds).rename("importance")
    fam_series = pd.Series(families, index=coefs.index, name="family")

    df = pd.concat([imp, fam_series], axis=1)
    family_imp = df.groupby("family")["importance"].sum().sort_values(ascending=False)
    total = float(family_imp.sum()) or 1.0
    out = family_imp.reset_index()
    out["percent"] = out["importance"] / total
    return out


def _predict_dollars(pipeline: Pipeline, X: pd.DataFrame) -> np.ndarray:
    return pipeline.predict(X)


def _toggle_group_delta(pipeline: Pipeline, row: pd.Series, family: str, feature_names: List[str], config: Dict[str, Any]) -> float:
    """Dollar-space delta for one family:
    - Predict baseline with the family's features turned OFF for this row.
    - Predict with family's features ON (original values).
    - Return difference (dollars).
    Note: Only works for additive-on/off style features cleanly (dummies & scaled numerics). For numerics, we set to 0 baseline.
    """
    # Build a one-row DataFrame
    X0 = row.to_frame().T.copy()
    X1 = row.to_frame().T.copy()

    # Heuristic: if family is a numeric column, set baseline to 0 (post-scaling this isn't exact, but gives a consistent neutral toggle).
    # For single-cat/multi-cat, we zero out dummy activation by setting empty/None or a rarely-used reference.
    if family in config.get("numeric_cols", []):
        X0[family] = 0
    elif family in config.get("single_categorical_cols", []):
        # Set to NaN; SimpleImputer+OneHot will impute most_frequent (approx baseline)
        X0[family] = np.nan
    else:
        # multi-label families use list-like; set to empty list to turn off
        if family in row.index:
            X0[family] = [[]]

    # Predict
    p0 = float(_predict_dollars(pipeline, X0)[0])
    p1 = float(_predict_dollars(pipeline, X1)[0])
    return p1 - p0


def per_item_explanations(
    pipeline: Pipeline,
    X: pd.DataFrame,
    config: Dict[str, Any],
    feature_names: List[str],
    max_items: int = 100,
) -> pd.DataFrame:
    """Produce a per-item breakdown in dollars by toggling families one at a time.

    Columns: [predicted_price, family:delta, ... , baseline (approx), id (optional if present)]
    """
    fam_map = _group_map(feature_names, config)
    families = sorted(fam_map.keys())

    rows: List[Dict[str, Any]] = []
    n = min(max_items, len(X))
    for i in range(n):
        row = X.iloc[i]
        pred = float(_predict_dollars(pipeline, row.to_frame().T)[0])
        rec: Dict[str, Any] = {"row_index": int(i), "predicted_price": pred}
        baseline_approx = pred
        # accumulate deltas
        for fam in families:
            try:
                d = _toggle_group_delta(pipeline, row, fam, feature_names, config)
            except Exception:
                d = np.nan
            rec[f"delta__{fam}"] = d
            if pd.notnull(d):
                baseline_approx -= d
        rec["baseline_approx"] = baseline_approx
        rows.append(rec)

    return pd.DataFrame(rows)


# ------------------------------
# CLI
# ------------------------------

def main(argv: List[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Explain a trained valuation pipeline")
    parser.add_argument("--model", type=str, default="artifacts/pipeline.joblib", help="Path to trained pipeline artifact")
    parser.add_argument("--data", type=str, default="data/swords_test.parquet", help="Path to a dataset for computing stds & (optional) per-item explanations")
    parser.add_argument("--coefs", type=str, default="artifacts/coefficients.csv", help="Where to write the per-feature coefficient table")
    parser.add_argument("--importances", type=str, default="artifacts/importances.csv", help="Where to write the per-family importance table")
    parser.add_argument("--items", type=str, default=None, help="Optional path to write per-item contribution breakdowns (CSV)")
    parser.add_argument("--max-items", type=int, default=200, help="Limit per-item explanations for speed")
    args = parser.parse_args(argv)

    cfg = DEFAULT_CONFIG
    target_col = cfg["target_col"]

    # Load pipeline & data
    pipe: Pipeline = joblib.load(args.model)

    if args.data:
        if args.data.endswith(".parquet"):
            df = pd.read_parquet(args.data)
        elif args.data.endswith(".csv"):
            df = pd.read_csv(args.data)
        else:
            raise ValueError("--data must be a .parquet or .csv file")
    else:
        raise ValueError("--data is required for feature stds and (optional) item explanations")

    X = df.drop(columns=[target_col])

    # Feature names & linear bits
    fnames = get_feature_names(pipe, X.head(1))
    coef_vec, intercept = _linear_bits(pipe)

    if len(coef_vec) != len(fnames):
        raise RuntimeError(f"Coefficient vector length {len(coef_vec)} != features {len(fnames)}. Check pipeline.")

    # Per-feature table (log-space coefs)
    coef_df = _coef_table(coef_vec, fnames, cfg)

    # Feature stds on this dataset (post-transform)
    stds = _std_by_feature(pipe, X, fnames)

    # Global importances aggregated by family
    imp_df = _importance_table(coef_df.set_index("feature")["coef_log"], stds, coef_df.set_index("feature")["family"].tolist())

    # Persist outputs
    Path(args.coefs).parent.mkdir(parents=True, exist_ok=True)
    coef_df.to_csv(args.coefs, index=False)

    Path(args.importances).parent.mkdir(parents=True, exist_ok=True)
    imp_df.to_csv(args.importances, index=False)

    print(f"[explain.py] Wrote coefficients → {args.coefs} (n={len(coef_df)})")
    print(f"[explain.py] Wrote importances → {args.importances} (n={len(imp_df)})")

    # Optional per-item breakdowns
    if args.items:
        items_df = per_item_explanations(pipe, X, cfg, fnames, max_items=args.max_items)
        Path(args.items).parent.mkdir(parents=True, exist_ok=True)
        items_df.to_csv(args.items, index=False)
        print(f"[explain.py] Wrote per-item explanations → {args.items} (n={len(items_df)})")


if __name__ == "__main__":
    main()