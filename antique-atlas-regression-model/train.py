"""
train.py — Train the swords valuation pipeline and persist artifacts.

What it does
------------
- Loads training and (optionally) validation data from /data.
- Builds the preprocessing+regression pipeline from pipeline.py.
- Fits on train; evaluates on val (or a split from train if val not supplied).
- Saves the fitted pipeline to /artifacts/pipeline.joblib.
- Writes basic metrics (MAE, RMSE, R^2) to /artifacts/metrics.json.

Usage
-----
python -m src.train \
  --train data/swords_train.parquet \
  --val data/swords_val.parquet \
  --out artifacts/pipeline.joblib \
  --metrics artifacts/metrics.json

Notes
-----
- Target is expected to be raw price in dollars; the pipeline handles log transform internally.
- If you only have a single dataset, omit --val and pass --val-split 0.2 to split off validation.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

# from .pipeline import DEFAULT_CONFIG, build_pipeline
from .pipeline import DEFAULT_CONFIG, build_pipeline


def _read_table(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    if path.suffix.lower() in {".parquet"}:
        return pd.read_parquet(path)
    if path.suffix.lower() in {".csv"}:
        return pd.read_csv(path)
    raise ValueError(f"Unsupported file extension for {path}. Use .parquet or .csv")


def _split_train_val(df: pd.DataFrame, target_col: str, val_size: float, random_state: int) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    X = df.drop(columns=[target_col])
    y = df[target_col]
    X_tr, X_va, y_tr, y_va = train_test_split(
        X, y, test_size=val_size, random_state=random_state
    )
    return X_tr, y_tr, X_va, y_va


def _eval_metrics(y_true: pd.Series, y_pred: np.ndarray) -> Dict[str, float]:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    return {"MAE": mae, "RMSE": rmse, "R2": r2}


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Train swords valuation pipeline")
    parser.add_argument("--train", type=str, default="data/swords_train.parquet", help="Path to training data (.parquet or .csv)")
    parser.add_argument("--val", type=str, default=None, help="Optional path to validation data (.parquet or .csv)")
    parser.add_argument("--val-split", type=float, default=0.0, help="If >0 and --val not provided, split this fraction from train for validation")
    parser.add_argument("--random-state", type=int, default=42, help="Random seed for splitting")
    parser.add_argument("--out", type=str, default="artifacts/pipeline.joblib", help="Output path for trained pipeline artifact")
    parser.add_argument("--metrics", type=str, default="artifacts/metrics.json", help="Output path for metrics JSON")
    args = parser.parse_args(argv)

    cfg: Dict[str, Any] = DEFAULT_CONFIG
    target_col = cfg["target_col"]

    # Ensure output directory exists
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.metrics).parent.mkdir(parents=True, exist_ok=True)

    # Load data
    df_train = _read_table(args.train)

    if args.val:
        df_val = _read_table(args.val)
        X_tr = df_train.drop(columns=[target_col])
        y_tr = df_train[target_col]
        X_va = df_val.drop(columns=[target_col])
        y_va = df_val[target_col]
    else:
        val_split = float(args.val_split)
        if val_split <= 0:
            # Use all for training; compute metrics on train as a sanity check only
            X_tr = df_train.drop(columns=[target_col])
            y_tr = df_train[target_col]
            X_va, y_va = X_tr, y_tr
            print("[train.py] No validation set provided; evaluating on training data (sanity check only).")
        else:
            X_tr, y_tr, X_va, y_va = _split_train_val(df_train, target_col, val_split, args.random_state)

    # Build pipeline
    pipe = build_pipeline(cfg)

    # Fit
    pipe.fit(X_tr, y_tr)

    # Evaluate
    y_pred = pipe.predict(X_va)
    metrics = _eval_metrics(y_va, y_pred)

    # Persist
    joblib.dump(pipe, args.out)

    # Read any existing metrics and merge (optional behavior)
    existing: Dict[str, Any] = {}
    if Path(args.metrics).exists():
        try:
            with open(args.metrics, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = {}

    payload = {
        **existing,
        "train_artifact": os.path.abspath(args.out),
        "metrics": metrics,
        "n_train": int(len(X_tr)),
        "n_val": int(len(X_va)),
        "config": {
            "numeric_cols": cfg.get("numeric_cols", []),
            "single_categorical_cols": cfg.get("single_categorical_cols", []),
            "multi_categorical_cols": {k: {kk: vv for kk, vv in v.items()} for k, v in cfg.get("multi_categorical_cols", {}).items()},
            "model": cfg.get("model", {}),
        },
    }

    with open(args.metrics, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print("[train.py] Saved pipeline to:", args.out)
    print("[train.py] Metrics:", json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()


# USE THIS COMMAND FROM THE PARENT FOLDER:
# python -m antique-finder-regression-model.train --train antique-finder-regression-model/swords.parquet --val-split 0.1