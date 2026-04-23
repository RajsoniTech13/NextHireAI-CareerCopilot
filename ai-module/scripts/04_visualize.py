import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from wordcloud import WordCloud
import joblib
import os

os.makedirs('../outputs', exist_ok=True)

df = pd.read_csv('../data/resumes.csv')

#1. Category Distribution
plt.figure(figsize=(12, 6))
category_counts = df['Category'].value_counts()
sns.barplot(x=category_counts.values, y=category_counts.index, palette='viridis')
plt.title('Number of Resumes per Job Category', fontsize=16)
plt.xlabel('Count', fontsize=12)
plt.ylabel('Category', fontsize=12)
plt.tight_layout()
plt.savefig('../outputs/category_distribution.png', dpi=300, bbox_inches='tight')
plt.close()
print("Category distribution chart saved")

#2. Word Cloud of All Resumes
all_text = ' '.join(df['Resume_str'].fillna('').astype(str))
wordcloud = WordCloud(width=1200, height=600, background_color='white', 
                      max_words=100, colormap='viridis').generate(all_text)
plt.figure(figsize=(15, 8))
plt.imshow(wordcloud, interpolation='bilinear')
plt.axis('off')
plt.title('Word Cloud - Most Common Words in Resumes', fontsize=16)
plt.savefig('../outputs/wordcloud_all_resumes.png', dpi=300, bbox_inches='tight')
plt.close()
print("Word cloud saved")

#3. Resume Length Distribution
df['resume_length'] = df['Resume_str'].fillna('').astype(str).str.len()
plt.figure(figsize=(10, 6))
sns.histplot(df['resume_length'], bins=50, kde=True, color='blue')
plt.title('Distribution of Resume Lengths', fontsize=14)
plt.xlabel('Number of Characters', fontsize=12)
plt.ylabel('Frequency', fontsize=12)
plt.tight_layout()
plt.savefig('../outputs/resume_length_distribution.png', dpi=300, bbox_inches='tight')
plt.close()
print("Resume length distribution saved")

print("\nAll visualizations saved to outputs/ folder")