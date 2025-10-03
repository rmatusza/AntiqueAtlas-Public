# Pipeline

## Purpose

Assemble a single sklearn Pipeline that:

- Preprocesses every column (numeric, single-label categorical, multi-label categorical) in a consistent, reusable way;
- Fits a regularized linear model on log1p(price);
- Can be saved/loaded as one artifact and used for prediction + later explanations.

## What it will produce

A function like build_pipeline(config) -> sklearn.Pipeline that returns:  
(ColumnTransformer: [numeric impute/scale, one-hot for single cats, our MultiLabelBinarizerTransformer for multi-cats])  
→ RidgeCV (or ElasticNetCV)

### Optional helpers

- `get_feature_names(pipeline, X_sample)` 
  - After fitting, this extracts the final feature names from the ColumnTransformer.
  - Essential later for explanations (coefficients.csv, per-item contributions).  
- `OPTIONAL - group_map_from_config(config)` to map columns → attribute families (Material, Condition, Maker, etc.) for importance & explanations.

## Inputs

A config object (dict or small dataclass) specifying which columns are:

DEFAULT_CONFIG = {
    "target_col": "price_usd",
    "numeric_cols": ["bladeLength"],
    "single_categorical_cols": ["condition", "restorationStatus", "completeness", "era", "regionCulture"],
    "multi_categorical_cols": {
        "material": {"top_k": 15},
        "makerWorkshop": {"top_k": 30},
        "provenance": {"top_k": 25}
    }
}

(Later) a small sample DataFrame or schema just to build the ColumnTransformer cleanly.

## Core tools & libraries

- scikit-learn: Pipeline, ColumnTransformer, SimpleImputer, StandardScaler, OneHotEncoder, RidgeCV (or ElasticNetCV), optionally TransformedTargetRegressor.
- Our transformer: MultiLabelBinarizerTransformer.
- numpy/pandas for glue code.

## Design choices (so it’s future-proof)

- `Log target:` Wrap the regressor in TransformedTargetRegressor with func=np.log1p, inverse_func=np.expm1 so the pipeline itself handles log transform.
- `Regularization:` Start with RidgeCV(alphas=[0.1,1.0,10.0,100.0]). You can later toggle to ElasticNetCV via a config flag.
- `Reference handling:` OneHotEncoder(handle_unknown="ignore") so unseen single-label categories at inference won’t crash.
- `Multi-label capping:` use your per-field top_k (and include_other=True) to keep dimensionality bounded.
- `Column naming:` keep family prefixes (e.g., material__gold) so contribution/importance grouping stays trivial.

## How it fits in the project

Train script (train.py): will call build_pipeline(config), fit it, and save artifact.

Evaluate script (evaluate.py): will load the artifact and compute metrics on test data.

Explain script (explain.py): will use the fitted pipeline + feature names to compute per-item contributions and global importance.

So pipeline.py is like the engine room: everything else (train/evaluate/explain) plugs into it.

## All Together

`1. build_pipeline(config)`
   - The main function that builds your end-to-end pipeline.
   - It does two big things:

`A. Preprocessing (ColumnTransformer)`
  - Numeric columns → impute (fill missing) + scale (normalize units).
  - Single categorical columns → one-hot encode (turn categories into 0/1).
  - Multi-label categorical columns → use our custom MultiLabelBinarizerTransformer.
  - All these outputs get concatenated into one feature matrix.

`B. Regression model`
  - A regularized linear regression (RidgeCV or ElasticNetCV), wrapped in TransformedTargetRegressor so:
  - Target (price) is log-transformed on training (log1p) → stabilizes skew.
  - Predictions are inverse-transformed (expm1) → you get back dollars.

## Sample code

- when it's all finished you will write some code that looks like the below example to run the pipeline:

---

from pipeline import build_pipeline, DEFAULT_CONFIG

pipe = build_pipeline(DEFAULT_CONFIG)

**Train on your dataset:**

pipe.fit(df_train.drop(columns=["price_usd"]), df_train["price_usd"])

**Predict on new data:**

y_pred = pipe.predict(df_val.drop(columns=["price_usd"]))

---