"""
evaluate.py — Evaluate a trained pipeline on a held-out test set.

What it does
------------
- Loads a serialized sklearn Pipeline artifact (preprocess + model).
- Loads a test dataset (Parquet/CSV), separates features/target.
- Produces evaluation metrics (MAE, RMSE, R^2) on the test set.
- Optionally saves per-row errors and simple diagnostic summaries.
- Merges results into artifacts/metrics.json (or a provided path).

Usage
-----
python -m src.evaluate \
  --model artifacts/pipeline.joblib \
  --test data/swords_test.parquet \
  --metrics artifacts/metrics.json \
  --errors artifacts/test_errors.csv
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from .pipeline import DEFAULT_CONFIG


def _read_table(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    if path.suffix.lower() in {".parquet"}:
        return pd.read_parquet(path)
    if path.suffix.lower() in {".csv"}:
        return pd.read_csv(path)
    raise ValueError(f"Unsupported file extension for {path}. Use .parquet or .csv")


def _eval_metrics(y_true: pd.Series, y_pred: np.ndarray) -> Dict[str, float]:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred, squared=False))
    r2 = float(r2_score(y_true, y_pred))
    return {"MAE": mae, "RMSE": rmse, "R2": r2}


def _summarize_errors(y_true: pd.Series, y_pred: np.ndarray) -> Dict[str, Any]:
    err = y_pred - y_true.to_numpy()
    ae = np.abs(err)
    pct = ae / np.maximum(1e-9, y_true.to_numpy())
    return {
        "abs_error_quantiles": {q: float(np.quantile(ae, q)) for q in [0.5, 0.75, 0.9, 0.95]},
        "pct_error_quantiles": {q: float(np.quantile(pct, q)) for q in [0.5, 0.75, 0.9, 0.95]},
        "mean_abs_error": float(np.mean(ae)),
        "mean_pct_error": float(np.mean(pct)),
    }


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Evaluate trained pipeline on test set")
    parser.add_argument("--model", type=str, default="artifacts/pipeline.joblib", help="Path to trained pipeline artifact")
    parser.add_argument("--test", type=str, default="data/swords_test.parquet", help="Path to test data (.parquet or .csv)")
    parser.add_argument("--metrics", type=str, default="artifacts/metrics.json", help="Path to metrics JSON (will be created or updated)")
    parser.add_argument("--errors", type=str, default=None, help="Optional path to write per-row errors CSV")
    args = parser.parse_args(argv)

    cfg = DEFAULT_CONFIG
    target_col = cfg["target_col"]

    # Load model
    pipe = joblib.load(args.model)

    # Load test data
    df_test = _read_table(args.test)
    X_te = df_test.drop(columns=[target_col])
    y_te = df_test[target_col]

    # Predict & evaluate
    y_pred = pipe.predict(X_te)
    metrics = _eval_metrics(y_te, y_pred)
    diag = _summarize_errors(y_te, y_pred)

    # Optionally persist per-row errors for later inspection
    if args.errors:
        Path(args.errors).parent.mkdir(parents=True, exist_ok=True)
        out = df_test.copy()
        out["predicted_price"] = y_pred
        out["error"] = out["predicted_price"] - out[target_col]
        out["abs_error"] = out["error"].abs()
        out.to_csv(args.errors, index=False)

    # Merge metrics into JSON
    Path(args.metrics).parent.mkdir(parents=True, exist_ok=True)
    existing: Dict[str, Any] = {}
    if Path(args.metrics).exists():
        try:
            with open(args.metrics, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = {}

    payload = {
        **existing,
        "test": {
            "metrics": metrics,
            "diagnostics": diag,
            "n_test": int(len(X_te)),
        },
    }

    with open(args.metrics, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print("[evaluate.py] Test metrics:", json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()