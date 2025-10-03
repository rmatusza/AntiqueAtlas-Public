import pandas as pd 

df = pd.read_json("../data/swords-cleaned.json")
df.to_parquet("cleaned-swords.parquet", engine="pyarrow", index=False)