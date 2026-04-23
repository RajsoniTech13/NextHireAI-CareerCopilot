import pandas as pd
import os

postings_path = r"C:\Users\Luckyrajsinh Kathiya\Desktop\Project\job-assistant\ai-module\data\postings.csv"

print("="*50)
print("EXPLORING LINKEDIN JOB POSTINGS")
print("="*50)

df = pd.read_csv(postings_path)

print(f"\nTotal job postings: {len(df)}")
print(f"\nColumns in the dataset:")
for i, col in enumerate(df.columns):
    print(f"   {i+1}. {col}")

print(f"\nFirst 2 rows preview:")
print(df.head(2))

print(f"\nData types:")
print(df.dtypes)

print(f"\nMissing values count:")
for col in df.columns:
    missing = df[col].isna().sum()
    if missing > 0:
        print(f"   {col}: {missing} missing")

important_cols = ['title', 'description', 'formatted_experience_level', 'formatted_work_type']
for col in important_cols:
    if col in df.columns:
        print(f"\nUnique values in '{col}':")
        print(f"   {df[col].nunique()} unique values")
        if df[col].nunique() <= 10:
            print(f"   Values: {df[col].unique()}")