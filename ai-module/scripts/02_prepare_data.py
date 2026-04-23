import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import re
import os
import joblib

os.makedirs('../outputs', exist_ok=True)

df = pd.read_csv('../data/resumes.csv')
print(f"Loaded {len(df)} resumes")
print(f"Categories: {df['Category'].unique()}")
print(f"\nCategory counts:")
print(df['Category'].value_counts())

def clean_text(text):
    if pd.isna(text):
        return ""
    text = re.sub(r'<.*?>', '', str(text))
    #Remove extra spaces and newlines
    text = ' '.join(text.split())
    return text

df['clean_resume'] = df['Resume_str'].apply(clean_text)

#Convert categories to numbers(for Decision Tree)
le = LabelEncoder()
df['category_encoded'] = le.fit_transform(df['Category'])

print(f"\nCategories encoded:")
for i, cat in enumerate(le.classes_):
    print(f"   {i} = {cat}")

#Extract features from text (TF-IDF)
vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
X = vectorizer.fit_transform(df['clean_resume']).toarray()
y = df['category_encoded']

print(f"\nFeature matrix shape: {X.shape}")
print(f"Target vector shape: {y.shape}")

#Save processed data for training
joblib.dump(vectorizer, '../outputs/tfidf_vectorizer.pkl')
joblib.dump(le, '../outputs/label_encoder.pkl')

#Also save the processed data as CSV for later use
processed_df = pd.DataFrame(X)
processed_df['category'] = y
processed_df.to_csv('../data/processed_resumes.csv', index=False)

print("\nProcessed data saved to:")
print("   - ../outputs/tfidf_vectorizer.pkl")
print("   - ../outputs/label_encoder.pkl")
print("   - ../data/processed_resumes.csv")