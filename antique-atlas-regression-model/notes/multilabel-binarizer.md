# multi label binarizer

## purpose
- turn multi-valued categorical fields like material, maker/workshop, provenance in to a stable compact set of 0/1 features that a regression model can use
- Unlike single-choice categories (handled well by OneHotEncoder), these fields can contain lists per item (e.g., ["gold","silver"]). We need a transformer that:
  - Learns a fixed vocabulary of allowed values from the training set (so val/test don’t change feature columns)
  - Caps rare values: keep only the top-K most frequent tokens and bucket the rest into "Other" (to avoid dimension blow-ups).
  - Produces binary columns with clear names like material__gold, material__silver, …, plus optional material__Other.
  - Handles missing/empty gracefully (all zeros).
  - Is sklearn-compatible (fit/transform), so it slots into a Pipeline / ColumnTransformer and gets saved with the model.
- the stability, interpretability, and performance of this model hinge on getting consistent, capped multi-label features.

## tools
- pandas (input as Series/DataFrame, output DataFrame with named columns)
- numpy
- scikit-learn: implement BaseEstimator, TransformerMixin so it works in Pipelines

## parameters
- feature_name: str — prefix for column names, e.g., "material".
- top_k: int | None — keep N most frequent tokens; if None, keep all.
- min_freq: int | None — alternative to top_k: keep tokens with count ≥ min_freq.
- include_other: bool — whether to add a single "Other" column for everything not kept.
- drop_empty: bool — if a row is null/empty, output all zeros (default) or raise.
- sparse_output: bool — return a sparse matrix or a pandas DataFrame (default DataFrame for readability).
- dtype — output dtype (e.g., np.uint8).

- (We’ll enforce either top_k or min_freq or neither; if both set, top_k wins.)

## edge cases
- Nulls / non-lists: treat as empty set.
- Duplicates inside a row: count once per token for that row.
- Unseen tokens at transform time: route to "Other" if enabled; otherwise ignore.
- All rows empty: still emit columns (with zeros) so the schema is stable.
- Mixed case / whitespace: optional normalizer hook (we can add a simple str.strip().lower() option).

## importance
- Interpretability: clean, named binary features like material__gold, easy to aggregate by family (“Material”, “Maker”, “Provenance”) for global importance and item-level breakdowns.
- Generalization: rare/unseen tokens don’t explode your dimensionality; they roll into Other.
- Reproducibility: fixed vocabulary learned on train only, preserved via Pipeline serialization.

# Some Scikit learn concepts

## estimators
- `estimator:` any object that learns from data via the `.fit()` method
  - the `BaseEstimator` class is the base ( parent ) class for all estimators

## parameters and hyperparameters
- `parameters` in the scikit world are values that are learned from data
  - ex. regression coefficients in a linear regression
- `hyperparameters` user speified knobs you set before training 

## transformers
- special kind of estimator
- both `learns` from data ( fit ) and `modifies` data ( transform )
- `TransformerMixin` - helper that gives the common pattern: .fit() + .tranform() -> .fit_transform()

## pipelines
- this is a chain of transformers + a final estimator
- BaseEstimator makes sure each step exposes its hyperparameters for tuning
- TransformerMixin makes sure transformers behave consistently with .fit_transform()

## mixin
- class that isn't meant to stand alone but instead provide extra behavior when inherited

# notes on the code  
- `MultiLabelBinarizerTransformer class`
  - transformer automatically:
    - Normalizes messy string inputs.
    - Handles missing/rare/unseen values.
    - Keeps feature space under control (top_k / min_freq).
    - Produces a clean indicator matrix - aka binary matrix / one-hot or multi-hot encoding / dummy variables ( in statistics )
      - numeric table (matrix) where:
        - Rows = your samples (observations).
        - Columns = possible categories/tokens/features.
        - Each entry is a binary indicator:
          - 1 if that row has the category/token.
          - 0 if it does not.

- `_as_token_set`
  -  data cleaning / normalization utility
     - Turns messy input into a consistent set of string tokens.
     - Handles missing values (None, NaN).
     - Works for single values and lists.
     - Removes duplicates automatically.
     - Supports pluggable normalization (lowercasing, stemming, etc.).

- `fit method`
  - Learns the vocabulary:
  1. Flatten tokens across all rows.
    - sample input: pd.Series(['Steel', 'steel', 'Brass', 'Ivory'])
    - Row 0 → {"steel"}; Row 1 → {"steel"}; Row 2 → {"brass"}; Row 3 → {"ivory"}
    - Flattening means treating all rows’ tokens together: {"steel"} + {"steel"} + {"brass"} + {"ivory"}
    - results in following global token counts: steel → 2; brass → 1; ivory → 1
    - flattening is necessary because during fit(), the transformer needs to build a vocabulary (the list of columns it will output later).
    - allows you to: Count frequencies globally., Apply rules like top_k or min_freq.; Decide which tokens to keep in the feature set.
  2. Count how often each token appears.
  3. Apply filtering (top_k or min_freq).
  4. Save kept tokens as self.vocabulary_.
  5. Build output column names like material__gold, material__silver, etc.
  6. Optionally add material__Other.

- `transform method`
  - Builds the actual indicator matrix:
    - For each row:
      - Get its token set (_as_token_set).
      - If token is in the vocabulary, set its column to 1.
      - If not in vocabulary and include_other=True, set Other to 1.
    - Returns either:
      - Sparse CSR matrix (if sparse_output=True).
      - pandas DataFrame with column names (default).

- `sparse module`
  - provides **sparse matrix data structures**
  - Sparse matrices are memory-efficient structures for binary/indicator data
  - a sparse CSR (Compressed Sparse Row) matrix only stores the nonzero entries and their positions.
  - used here to avoid building huge dense indicator arrays when the vocabulary is large.

- `@dataclass`
  - Python decorator (introduced in 3.7) that automatically generates boilerplate code for simple classes used mainly to store data
  - you just declare the fields, and @dataclass auto-generates __init__, __repr__, __eq__, etc.
  - So _VocabConfig is just a neat container for config metadata that the transformer caches after fit()
