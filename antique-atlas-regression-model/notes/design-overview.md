`src/transformers/multilabel_binarizer.py`
- Foundation for multi-label fields.
- Unblocks the pipeline.

`src/pipeline.py`
- Build a single sklearn Pipeline:
  - **ColumnTransformer** (numeric impute/scale, one-hot for single-cats, our multi-label binarizer).
  - **TransformedTargetRegressor** wrapping **RidgeCV** (log1p target → expm1 inverse).
- Deliverable: a callable **build_pipeline(config)** that returns a ready-to-fit pipeline.

`src/train.py`
- Load **data/swords_train.parquet** (+ optional val split from train if you don’t have a separate file).
- Fit the pipeline and persist it to **artifacts/pipeline.joblib.**
- Save basic metrics on a held-out set to **artifacts/metrics.json.**
- Deliverable: a reproducible training run that outputs a model artifact + metrics.

`src/evaluate.py`
- Given **artifacts/pipeline.joblib**, evaluate on **data/swords_test.parquet.**
- Compute MAE/RMSE/R², error histogram bins, maybe quantiles.
- Append/overwrite **artifacts/metrics.json.**
- Deliverable: clean, repeatable test-set evaluation separate from training.

`src/explain.py`
- Load the fitted pipeline.
- Expose utilities to:
  - Get final feature names from the **ColumnTransformer**.
  - Compute per-item contributions (log space exact, and/or dollar deltas by toggling groups).
  - Aggregate global importance by attribute family (e.g., sum |coef|·std over a family).
- Export reports:
  - **artifacts/coefficients.csv** (feature, coef, family).
  - **artifacts/importances.csv** (family, percent).
  - Deliverable: human-readable CSVs + JSON per-item explanations you can render in your UI.

`(Optional) src/transformers/topk_category_capper.py`
- If you also want a generic single-label “cap to top-K then ‘Other’” transformer (useful for huge cardinality makers).
- Note: you might not need this if OneHotEncoder + pre-capping in data or your multi-label transformer already covers your high-card columns.