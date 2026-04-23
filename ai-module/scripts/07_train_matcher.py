import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import json
import os

os.makedirs('../outputs', exist_ok=True)

df = pd.read_csv('../data/resume_job_matches.csv')
print(f"Loaded {len(df)} resume-job pairs")

feature_cols = [
    'num_resume_skills',     #How many skills in resume
    'num_job_skills',        #How many skills in job
    'category_match'         #Does category match job title?
]

#Add encoded categorical features
df['job_experience_encoded'] = LabelEncoder().fit_transform(df['job_experience_level'].fillna('unknown'))
df['job_work_type_encoded'] = LabelEncoder().fit_transform(df['job_work_type'].fillna('unknown'))

feature_cols.append('job_experience_encoded')
feature_cols.append('job_work_type_encoded')

X = df[feature_cols].copy()
y = df['is_match'].values

print(f"\nFeatures (NO LEAKAGE): {feature_cols}")
print(f"Target: is_match (1=good match, 0=bad match)")
print(f"Class distribution:")
print(f"   Good matches (1): {sum(y)} ({sum(y)/len(y)*100:.1f}%)")
print(f"   Bad matches (0): {len(y)-sum(y)} ({(len(y)-sum(y))/len(y)*100:.1f}%)")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"\nTraining samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

#Train Decision Tree with proper pruning
model = DecisionTreeClassifier(
    max_depth=5,
    min_samples_split=20,     #Minimum samples to split
    min_samples_leaf=10,      #Minimum samples in leaf
    random_state=42,
    criterion='gini'
)

model.fit(X_train, y_train) #To train model

cv_scores = cross_val_score(model, X, y, cv=5)
print(f"\nCross-validation scores: {cv_scores}")
print(f"Mean CV score: {cv_scores.mean():.4f}")
print(f"Std CV score: {cv_scores.std():.4f}")

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\n" + "="*50)
print("MODEL EVALUATION METRICS (CORRECTED)")
print("="*50)
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1-Score:  {f1:.4f}")
print("="*50)

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Bad Match', 'Good Match'], 
            yticklabels=['Bad Match', 'Good Match'])
plt.title('Confusion Matrix - Resume-Job Matching')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig('../outputs/matching_confusion_matrix.png', dpi=300, bbox_inches='tight')
plt.close()
print("Confusion matrix saved")

plt.figure(figsize=(14, 10))
plot_tree(model, feature_names=feature_cols, 
          class_names=['Bad Match', 'Good Match'], 
          filled=True, rounded=True, fontsize=10)
plt.title('Decision Tree for Resume-Job Matching (Corrected)')
plt.tight_layout()
plt.savefig('../outputs/matching_decision_tree.png', dpi=300, bbox_inches='tight')
plt.close()
print("Decision tree saved")

feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

plt.figure(figsize=(8, 5))
plt.barh(feature_importance['feature'], feature_importance['importance'], color='skyblue')
plt.xlabel('Importance Score')
plt.title('Feature Importance for Resume-Job Matching')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig('../outputs/matching_feature_importance.png', dpi=300, bbox_inches='tight')
plt.close()
print("Feature importance saved")

# feature_names = vectorizer.get_feature_names_out()
# print(feature_names[6])
# print(feature_names[37])

joblib.dump(model, '../outputs/job_matcher_model.pkl')

metrics = {
    'accuracy': float(accuracy),
    'precision': float(precision),
    'recall': float(recall),
    'f1_score': float(f1),
    'cv_mean': float(cv_scores.mean()),
    'cv_std': float(cv_scores.std())
}
with open('../outputs/matcher_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=4)

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Bad Match', 'Good Match']))

print("\nMatcher model training complete!")
print("\nMetrics saved to: ../outputs/matcher_metrics.json")