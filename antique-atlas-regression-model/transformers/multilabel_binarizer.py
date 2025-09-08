from __future__ import annotations
from dataclasses import dataclass
from typing import Callable, Iterable, List, Optional, Sequence, Set, Tuple

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_is_fitted

try:
    from scipy import sparse as sp
except Exception:  # pragma: no cover - scipy optional at runtime
    sp = None  # type: ignore


# ------------------------------
# Utility helpers
# ------------------------------

def _default_normalizer(token: str) -> str:
    return token.strip().lower()

# data cleaning / normalization utility
# - Turns messy input into a consistent set of string tokens.
# - Handles missing values (None, NaN).
# - Works for single values and lists.
# - Removes duplicates automatically.
# - Supports pluggable normalization (lowercasing, stemming, etc.).
def _as_token_set(value: object, normalizer: Optional[Callable[[str], str]]) -> Set[str]:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return set()

    if isinstance(value, str):
        token = value if normalizer is None else normalizer(value)
        return {token} if token else set()

    # Iterables (lists/tuples/sets etc.)
    try:
        iter(value)  # type: ignore[arg-type]
    except TypeError:
        return set()

    tokens: Set[str] = set()
    for v in value:  # type: ignore[assignment]
        if v is None:
            continue
        if not isinstance(v, str):
            # Try a string conversion for safety
            v = str(v)
        tok = v if normalizer is None else normalizer(v)
        if tok:
            tokens.add(tok)
    return tokens


@dataclass
class _VocabConfig:
    vocabulary_: Tuple[str, ...]
    include_other: bool
    feature_name: str
    dtype: np.dtype

# transformer automatically:
#   Normalizes messy string inputs.
#   Handles missing/rare/unseen values.
#   Keeps feature space under control (top_k / min_freq).
#   Produces a clean indicator matrix - aka binary matrix / one-hot or multi-hot encoding / dummy variables ( in statistics )
#       - numeric table (matrix) where:
#           Rows = your samples (observations).
#           Columns = possible categories/tokens/features.
#           Each entry is a binary indicator:
#               1 if that row has the category/token.
#               0 if it does not.
class MultiLabelBinarizerTransformer(BaseEstimator, TransformerMixin):
    
    def __init__(
        self,
        feature_name: str,
        *,
        top_k: Optional[int] = None,
        min_freq: Optional[int] = None,
        include_other: bool = True,
        normalizer: Optional[Callable[[str], str]] = _default_normalizer,
        sparse_output: bool = False,
        dtype=np.uint8,
    ) -> None:
        self.feature_name = feature_name
        self.top_k = top_k
        self.min_freq = min_freq
        self.include_other = include_other
        self.normalizer = normalizer
        self.sparse_output = sparse_output
        self.dtype = dtype

    # ------------------------------
    # sklearn API
    # ------------------------------
    # Learns the vocabulary:
    # 1. Flatten tokens across all rows.
    #    - sample input: pd.Series(['Steel', 'steel', 'Brass', 'Ivory'])
    #    - Row 0 → {"steel"}; Row 1 → {"steel"}; Row 2 → {"brass"}; Row 3 → {"ivory"}
    #    - Flattening means treating all rows’ tokens together: {"steel"} + {"steel"} + {"brass"} + {"ivory"}
    #    - results in following global token counts: steel → 2; brass → 1; ivory → 1
    #    - flattening is necessary because during fit(), the transformer needs to build a vocabulary (the list of columns it will output later).
    #    - allows you to: Count frequencies globally., Apply rules like top_k or min_freq.; Decide which tokens to keep in the feature set.
    # 2. Count how often each token appears.
    # 3. Apply filtering (top_k or min_freq).
    # 4. Save kept tokens as self.vocabulary_.
    # 5. Build output column names like material__gold, material__silver, etc.
    # 6. Optionally add material__Other.
    def fit(self, X: Sequence[object], y: Optional[Sequence] = None):
       
        # Flatten tokens across rows, count frequencies
        token_counts: dict[str, int] = {}
        for value in X:
            tokens = _as_token_set(value, self.normalizer)
            for t in tokens:
                token_counts[t] = token_counts.get(t, 0) + 1

        # Decide which tokens to keep
        if self.top_k is not None:
            # Sort by frequency desc, then lexicographically for stability
            sorted_tokens = sorted(token_counts.items(), key=lambda kv: (-kv[1], kv[0]))
            kept = [t for t, _ in sorted_tokens[: max(0, self.top_k)]]
        elif self.min_freq is not None:
            kept = [t for t, c in token_counts.items() if c >= self.min_freq]
            kept.sort()
        else:
            kept = sorted(token_counts.keys())

        self.vocabulary_ = tuple(kept)

        # Build feature names (kept tokens + optional Other)
        names = [f"{self.feature_name}__{tok}" for tok in self.vocabulary_]
        if self.include_other:
            names.append(f"{self.feature_name}__Other")
        self.feature_names_out_ = tuple(names)

        # Cache simple config for validation in transform
        self._cfg = _VocabConfig(
            vocabulary_=self.vocabulary_,
            include_other=self.include_other,
            feature_name=self.feature_name,
            dtype=np.dtype(self.dtype),
        )

        return self

    # Builds the actual indicator matrix:
    #   For each row:
    #       Get its token set (_as_token_set).
    #       If token is in the vocabulary, set its column to 1.
    #       If not in vocabulary and include_other=True, set Other to 1.
    #   Returns either:
    #       Sparse CSR matrix (if sparse_output=True).
    #       pandas DataFrame with column names (default).
    def transform(self, X: Sequence[object]):
        
        check_is_fitted(self, attributes=["vocabulary_", "feature_names_out_", "_cfg"])

        vocab_index = {t: i for i, t in enumerate(self._cfg.vocabulary_)}
        n_samples = len(X)
        n_features = len(self._cfg.vocabulary_) + (1 if self._cfg.include_other else 0)
        dtype = self._cfg.dtype

        if self.sparse_output and sp is not None:
            indptr = [0]
            indices: List[int] = []
            data: List[int] = []
            other_idx = len(self._cfg.vocabulary_) if self._cfg.include_other else None

            for value in X:
                tokens = _as_token_set(value, self.normalizer)
                row_indices: Set[int] = set()
                for t in tokens:
                    j = vocab_index.get(t)
                    if j is not None:
                        row_indices.add(j)
                    elif other_idx is not None:
                        row_indices.add(other_idx)
                # Append sorted to preserve column order
                row_sorted = sorted(row_indices)
                indices.extend(row_sorted)
                data.extend([1] * len(row_sorted))
                indptr.append(len(indices))

            mat = sp.csr_matrix((np.array(data, dtype=dtype), np.array(indices), np.array(indptr)),
                                 shape=(n_samples, n_features))
            return mat

        # Dense DataFrame path
        arr = np.zeros((n_samples, n_features), dtype=dtype)
        # print(arr)
        other_idx = len(self._cfg.vocabulary_) if self._cfg.include_other else None
        # print(vocab_index)
        for i, value in enumerate(X):
            tokens = _as_token_set(value, self.normalizer)
            # print(tokens)
            other_flag = 0
            for t in tokens:
                j = vocab_index.get(t)
                if j is not None:
                    arr[i, j] = 1
                elif other_idx is not None:
                    other_flag = 1
            if other_idx is not None and other_flag:
                arr[i, other_idx] = 1
        # print(arr)
        return pd.DataFrame(arr, columns=self.feature_names_out_)

    # ------------------------------
    # Introspection helpers
    # ------------------------------
    def get_feature_names_out(self, input_features: Optional[Iterable[str]] = None) -> np.ndarray:
        check_is_fitted(self, attributes=["feature_names_out_"])
        return np.array(self.feature_names_out_, dtype=object)

    # For nicer reprs in notebooks/logs
    def __repr__(self) -> str:  # pragma: no cover - cosmetic
        params = [
            f"feature_name='{self.feature_name}'",
            f"top_k={self.top_k}",
            f"min_freq={self.min_freq}",
            f"include_other={self.include_other}",
            f"sparse_output={self.sparse_output}",
            f"dtype={getattr(self.dtype, 'name', self.dtype)}",
        ]
        return f"MultiLabelBinarizerTransformer({', '.join(params)})"

# materials = pd.Series(['Steel', 'steel', 'Brass', 'Ivory'])
# c = MultiLabelBinarizerTransformer('materials')
# fitted = c.fit(materials)
# print(f'fitted vocabulary: {fitted.vocabulary_}')
# print(f'feature names: {fitted.feature_names_out_}')
# print(f'configuration: {fitted._cfg}')
# transformed = c.transform(materials)
# print(transformed)