from __future__ import annotations

from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import RidgeCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, FunctionTransformer

# Import our custom multi-label transformer
from transformers.multilabel_binarizer import MultiLabelBinarizerTransformer


# ------------------------------
# Configuration scaffold
# ------------------------------
DEFAULT_CONFIG: Dict[str, Any] = {
    "target_col": "price_usd",
    "numeric_cols": ["bladeLength"],
    "single_categorical_cols": [
        "condition",
        "restorationStatus",
        "completeness",
        "era",
        "regionCulture",
    ],
    "multi_categorical_cols": {
        # field_name: transformer options
        "material": {"top_k": 15, "include_other": True},
        "makerWorkshop": {"top_k": 30, "include_other": True},
        "provenance": {"top_k": 25, "include_other": True},
    },
    "model": {
        "type": "ridge",  # or "elasticnet" in the future
        "alphas": [0.1, 1.0, 10.0, 100.0],
    },
}


# ------------------------------
# Internal helpers
# ------------------------------

def _make_numeric_pipeline() -> Pipeline:
    """Numeric branch: impute -> scale."""
    return Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )


def _make_single_cat_pipeline() -> Pipeline:
    """Single-categorical branch: impute -> one-hot (safe to unseen)."""
    return Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "onehot",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            ),
        ]
    )


def _series_selector(col_name: str) -> FunctionTransformer:
    def _select(X: pd.DataFrame | np.ndarray):
        # If we got a DataFrame (usual with ColumnTransformer), select by name
        if isinstance(X, pd.DataFrame):
            # X typically has only `col_name` in columns here
            if col_name in X.columns:
                return X[col_name]
            # fallback: first column
            return X.iloc[:, 0]
        # If we got a numpy array of shape (n,1), squeeze to 1D
        if isinstance(X, np.ndarray):
            if X.ndim == 2 and X.shape[1] == 1:
                return pd.Series(X[:, 0], index=pd.RangeIndex(len(X)))
            # Already 1D
            return pd.Series(X, index=pd.RangeIndex(len(X)))
        # Last resort: try to wrap as Series
        return pd.Series(X)

    return FunctionTransformer(_select, validate=False, feature_names_out="one-to-one")


def _make_multilabel_pipeline(field_name: str, **opts) -> Pipeline:
    return Pipeline(
        steps=[
            ("select", _series_selector(field_name)),
            (
                "mlb",
                MultiLabelBinarizerTransformer(
                    feature_name=field_name,
                    **opts,
                ),
            ),
        ]
    )


def _make_column_transformer(config: Dict[str, Any]) -> ColumnTransformer:
    transformers: List[Tuple[str, Pipeline, List[str] | str]] = []

    numeric_cols: List[str] = config.get("numeric_cols", [])
    single_cat_cols: List[str] = config.get("single_categorical_cols", [])
    multi_cat_conf: Dict[str, Dict[str, Any]] = config.get("multi_categorical_cols", {})

    if numeric_cols:
        transformers.append(("num", _make_numeric_pipeline(), numeric_cols))

    if single_cat_cols:
        transformers.append(("cat", _make_single_cat_pipeline(), single_cat_cols))

    # Add one multi-label pipeline per field, each bound to its single column
    for field, opts in multi_cat_conf.items():
        transformers.append((f"ml_{field}", _make_multilabel_pipeline(field, **opts), [field]))

    # verbose_feature_names_out=False keeps names from sub-transformers as-is
    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",
        sparse_threshold=0.0,  # force dense ndarray output from CT (our mlb returns dense by default)
        verbose_feature_names_out=False,
    )


def _make_regressor(config: Dict[str, Any]) -> TransformedTargetRegressor:
    model_conf = config.get("model", {})
    model_type = model_conf.get("type", "ridge").lower()

    if model_type == "ridge":
        alphas = model_conf.get("alphas", [0.1, 1.0, 10.0, 100.0])
        base = RidgeCV(alphas=alphas)
    else:
        # Fallback to Ridge if unknown type; you can add ElasticNetCV later.
        base = RidgeCV(alphas=[0.1, 1.0, 10.0, 100.0])

    return TransformedTargetRegressor(
        regressor=base,
        func=np.log1p,
        inverse_func=np.expm1,
        check_inverse=False,
    )


# ------------------------------
# Public API
# ------------------------------

def build_pipeline(config: Dict[str, Any] = DEFAULT_CONFIG) -> Pipeline:
    ct = _make_column_transformer(config)
    reg = _make_regressor(config)
    pipe = Pipeline(steps=[
        ("preprocess", ct),
        ("model", reg),
    ])
    return pipe


def get_feature_names(pipeline: Pipeline, X_sample: pd.DataFrame) -> List[str]:
    # Access the fitted ColumnTransformer
    ct: ColumnTransformer = pipeline.named_steps["preprocess"]
    # get_feature_names_out requires either fitted transformers or an X sample
    try:
        names = ct.get_feature_names_out()
    except Exception:
        names = ct.get_feature_names_out(X_sample)

    # Ensure plain Python list[str]
    return [str(n) for n in names]


if __name__ == "__main__":  # Optional smoke test (no real training here)
    # Tiny sanity check to verify wiring; replace with proper train.py in production
    df = pd.DataFrame({
        "bladeLength": [30, 33, np.nan, 40],
        "condition": ["Good", "Excellent", "Good", None],
        "restorationStatus": ["Original", "Original", "Restored", "Original"],
        "completeness": ["with scabbard", "full set", "blade only", "full set"],
        "era": ["1860s", "1860s", "1850s", "1860s"],
        "regionCulture": ["American", "American", "French", "American"],
        "material": [["gold", "steel"], ["steel"], None, ["gold", "silver"]],
        "makerWorkshop": [["henry folsom"], ["henry folsom"], ["unknown"], None],
        "provenance": [["ulysses s. grant"], None, None, ["ulysses s. grant"]],
        "price_usd": [12000, 25000, 8000, 40000],
    })

    cfg = DEFAULT_CONFIG
    pipe = build_pipeline(cfg)

    X = df.drop(columns=[cfg["target_col"]])
    y = df[cfg["target_col"]]

    pipe.fit(X, y)
    preds = pipe.predict(X)

    print("Preds:", preds)
    print("Feature names (n=)", len(get_feature_names(pipe, X)), "→", get_feature_names(pipe, X)[:10], "...")
