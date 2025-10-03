# converting from json to parquet

- data needs to be converted from json to parquet before being fed into the sklearn pipeline

import pandas as pd

## Wrap your single sword observation in a list, so it's tabular
data = [{
    "value": 1673000,
    "material": ["silver", "gold", "steel"],
    "bladeLength": 33,
    "bladeType": "straight, single-edged presentation blade",
    "hiltMaterial": ["silver", "gold"],
    "condition": "Excellent",
    "restorationStatus": "Original",
    "completeness": "full sword in original fitted presentation case",
    "era": "American Civil War (1864)",
    "regionCulture": "American (United States)",
    "makerWorkshop": ["Henry Folsom (St. Louis silversmith & jeweler)"],
    "provenance": [
      "Ulysses S. Grant (presented by citizens of Kentucky, 1864–1885)",
      "Grant Family (1885–1960s)",
      "Jay Altmeyer (1960s–1989; sold in 1989 for then-world record price)",
      "Donald Tharpe (1989–present; Tharpe Collection of American Military History)"
    ],
    "rarity": "Unique",
    "scabbard": "unknown",
    "ornamentation": "elaborate: 26 mine-cut diamonds forming “U.S.G.” ..."
}]

## Load into a DataFrame
df = pd.DataFrame(data)

## Save as Parquet
df.to_parquet("sword_example.parquet", engine="pyarrow", index=False)

print(df.dtypes)
