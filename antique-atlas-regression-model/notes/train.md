# 📄 File: `src/train.py`

## 🎯 Purpose
Train the **swords valuation pipeline** and persist artifacts for later use.

- Loads training and (optionally) validation data.
- Builds the preprocessing + regression pipeline from `pipeline.py`.
- Fits the pipeline on training data.
- Evaluates performance (MAE, RMSE, R²).
- Saves the trained pipeline and metrics to `artifacts/`.

---

## 🔑 Key Responsibilities
1. **Data loading**
   - Reads `.parquet` or `.csv` into Pandas DataFrames.
   - Supports both explicit validation files (`--val`) and automatic splits (`--val-split`).

2. **Pipeline construction**
   - Uses `build_pipeline(config)` from `pipeline.py`.
   - Configuration defined by `DEFAULT_CONFIG`.

3. **Training**
   - Fits the pipeline on training features `X_tr` and target `y_tr`.

4. **Evaluation**
   - Predicts on validation set (or train set if no val provided).
   - Computes metrics:
     - MAE (Mean Absolute Error)
     - RMSE (Root Mean Squared Error)
     - R² (Coefficient of Determination)

5. **Artifact persistence**
   - Saves trained pipeline with `joblib` → `artifacts/pipeline.joblib`.
   - Writes metrics to JSON → `artifacts/metrics.json`.

---

## ⚙️ Command-line Usage
```bash
python -m src.train \
  --train data/swords_train.parquet \
  --val data/swords_val.parquet \
  --out artifacts/pipeline.joblib \
  --metrics artifacts/metrics.json
```

## 📂 Outputs
- Model artifact → artifacts/pipeline.joblib
  - Serialized sklearn Pipeline (preprocessing + model).
- Metrics JSON → artifacts/metrics.json
  - Example:

---

{
  "train_artifact": "/absolute/path/to/pipeline.joblib",
  "metrics": {
    "MAE": 2500.0,
    "RMSE": 4000.0,
    "R2": 0.82
  },
  "n_train": 1200,
  "n_val": 300,
  "config": {
    "numeric_cols": ["bladeLength"],
    "single_categorical_cols": ["condition", "restorationStatus", ...],
    "multi_categorical_cols": {
      "material": {"top_k": 15, "include_other": true},
      "makerWorkshop": {"top_k": 30, "include_other": true},
      "provenance": {"top_k": 25, "include_other": true}
    },
    "model": {"type": "ridge", "alphas": [0.1, 1.0, 10.0, 100.0]}
  }
}

---

## ✅ Takeaway
- train.py is your entry point for model training:
  - Centralizes data loading, fitting, evaluation, and persistence.
  - Produces artifacts (pipeline.joblib, metrics.json) that other scripts (evaluate.py, explain.py) will consume.