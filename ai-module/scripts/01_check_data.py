import pandas as pd

df = pd.read_csv('../data/resumes.csv')

print(f"Loaded {len(df)} resumes")
print(f"Columns: {list(df.columns)}")
print(f"Unique Categories: {df['Category'].unique()}")
print(f"\nFirst 2 rows:")
print(df[['ID', 'Category']].head(2))