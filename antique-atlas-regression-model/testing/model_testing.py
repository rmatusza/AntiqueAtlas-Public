#%%
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import RidgeCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

#%%
# PROJECT_ROOT = Path.cwd().parent
# if str(PROJECT_ROOT) not in sys.path:
#     sys.path.insert(0, str(PROJECT_ROOT))
# from transformers.multilabel_binarizer import MultiLabelBinarizerTransformer

#%%
#! multi label binarizer 
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import MultiLabelBinarizer
from scipy.sparse import hstack, csr_matrix

def _to_lists(col):
    # Convert each cell to a list of strings; NaNs -> []
    out = []
    for v in col:
        if isinstance(v, (list, tuple, set)):
            out.append(list(v))
        elif v is None or (isinstance(v, float) and np.isnan(v)):
            out.append([])
        else:
            # If someone left a string like "steel, silver", split it:
            s = str(v).strip()
            out.append([p.strip() for p in s.split(",")] if "," in s else [s] if s else [])
    return out

class MultiLabelBinarizerTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, sparse_output=True, prefix=None, top_k=None, include_other=False):
        self.sparse_output = sparse_output
        self.prefix = prefix
        self.top_k = top_k
        self.include_other = include_other
        self._mlbs = []
        self._kept_labels = []
        self._feature_names = None

    def _freq_topk(self, lists):
        from collections import Counter
        c = Counter([lbl for row in lists for lbl in row])
        if self.top_k is None:
            return set(c.keys())
        return set([lbl for lbl, _ in c.most_common(self.top_k)])

    def fit(self, X, y=None):
        X = np.asarray(X, dtype=object)
        self._mlbs, self._kept_labels = [], []
        names = []
        for j in range(X.shape[1]):
            data = _to_lists(X[:, j])
            kept = self._freq_topk(data)
            if self.include_other and self.top_k is not None:
                data = [[lbl if lbl in kept else "__OTHER__" for lbl in row] for row in data]
                kept = kept.union({"__OTHER__"})
            mlb = MultiLabelBinarizer()
            mlb.fit(data)
            self._mlbs.append(mlb)
            self._kept_labels.append(sorted(list(kept)))
            col_prefix = self.prefix[j] if (self.prefix and j < len(self.prefix)) else f"col{j}"
            names += [f"{col_prefix}={c}" for c in mlb.classes_]
        self._feature_names = np.array(names)
        return self

    def transform(self, X):
        X = np.asarray(X, dtype=object)
        blocks = []
        for j, mlb in enumerate(self._mlbs):
            data = _to_lists(X[:, j])
            if self.include_other and self.top_k is not None:
                kept = set(self._kept_labels[j])
                data = [[lbl if lbl in kept else "__OTHER__" for lbl in row] for row in data]
            mat = mlb.transform(data)
            blocks.append(csr_matrix(mat) if self.sparse_output else mat)
        return hstack(blocks) if self.sparse_output else np.hstack(blocks)

    def get_feature_names_out(self, input_features=None):
        return self._feature_names


#%%
#! load dataset 
data = pd.read_parquet('cleaned-swords.parquet')
# data.head()

# %%
#! extract features and targets 
X = data.drop(['provenance', 'makerWorkshop', 'sellDate', 'price_usd'], axis=1)
X['bladeType'] = X['bladeType'].str.split(', ')
y = data['price_usd']
# X.head()

# %%
#! split into training and testing data 
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.33, random_state=42)

#%%
#! build preprocessor 
preproc_pipeline = ColumnTransformer([
    ("multicategorical", MultiLabelBinarizerTransformer(
        prefix=["material","bladeType","hiltMaterial","scabbard"],
        top_k=20, include_other=True  # tune these
    ), ["material","bladeType","hiltMaterial","scabbard"]),
    ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=True, min_frequency=2),
     ["condition","restorationStatus","completeness","era","regionCulture","rarity","ornamentation"]),
    ("num", Pipeline([("imputer", SimpleImputer(strategy="median")),
                      ("scaler", StandardScaler())]), ["bladeLength"]),
])

#%%
#! build base pipeline 
from sklearn.model_selection import GridSearchCV, KFold
from sklearn.linear_model import Ridge

base = Pipeline([("preprocess", preproc_pipeline), ("reg", Ridge())])
wrapped = TransformedTargetRegressor(regressor=base, func=np.log1p, inverse_func=np.expm1)

grid = GridSearchCV(
    estimator=wrapped,
    param_grid={"regressor__reg__alpha": np.logspace(-3, 3, 13)},
    cv=KFold(n_splits=5, shuffle=True, random_state=42),
    scoring="neg_root_mean_squared_error",
    n_jobs=-1
)

#%%
#! fit and test 
from sklearn.metrics import root_mean_squared_error
grid.fit(X_train, y_train)
print("Best alpha:", grid.best_params_["regressor__reg__alpha"])
print("CV RMSE:", -grid.best_score_)
print("Test RMSE:", root_mean_squared_error(y_test, grid.best_estimator_.predict(X_test)))

# %%
#! decision tree alternative 
from sklearn.tree import DecisionTreeRegressor
base_tree = Pipeline([("preprocess", preproc_pipeline),
                      ("reg", DecisionTreeRegressor(min_samples_leaf=4, random_state=42))])
wrapped_tree = TransformedTargetRegressor(regressor=base_tree, func=np.log1p, inverse_func=np.expm1)
wrapped_tree.fit(X_train, y_train)
print("Tree Test RMSE:", root_mean_squared_error(y_test, wrapped_tree.predict(X_test)))

# %%