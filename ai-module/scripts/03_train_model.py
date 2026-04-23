import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os

os.makedirs('../outputs', exist_ok=True)

df = pd.read_csv('../data/processed_resumes.csv')
X = df.iloc[:, :-1].values
y = df['category'].values

le = joblib.load('../outputs/label_encoder.pkl')
category_names = le.classes_

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")
print(f"Categories: {len(category_names)}")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"\nTraining samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

#Train Decision Tree(with pruning to avoid overfitting)
model = DecisionTreeClassifier(
    max_depth=15,           #To prevent overfitting
    min_samples_split=5,    #Minimum samples to split a node
    min_samples_leaf=2,     #Minimum samples in leaf node
    random_state=42,
    criterion='gini'
)

model.fit(X_train, y_train)

#Cross-validation to check overfitting
cv_scores = cross_val_score(model, X, y, cv=5)
print(f"\nCross-validation scores: {cv_scores}")
print(f"Mean CV score: {cv_scores.mean():.4f}") #avg accuracy
print(f"Std CV score: {cv_scores.std():.4f}") #stability of model

# Predict on test set
y_pred = model.predict(X_test)

# Calculate metrics
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted')
recall = recall_score(y_test, y_pred, average='weighted')
f1 = f1_score(y_test, y_pred, average='weighted')

print("\n" + "="*50)
print("MODEL EVALUATION METRICS")
print("="*50)
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1-Score:  {f1:.4f}")
print("="*50)

#Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(14, 12))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=category_names, 
            yticklabels=category_names)
plt.title('Confusion Matrix - Resume Category Classification')
plt.xlabel('Predicted Category')
plt.ylabel('Actual Category')
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()
plt.savefig('../outputs/confusion_matrix.png', dpi=300, bbox_inches='tight')
plt.close()
print("Confusion matrix saved")

#Plot Decision Tree (limited to depth 3 for readability)
plt.figure(figsize=(20, 12))
plot_tree(model, max_depth=3, feature_names=[f'feature_{i}' for i in range(X.shape[1])], 
          class_names=category_names, filled=True, rounded=True, fontsize=8)
plt.title('Decision Tree (First 3 Levels)')
plt.savefig('../outputs/decision_tree.png', dpi=300, bbox_inches='tight')
plt.close()
print("Decision tree visualization saved")

#Feature importance
feature_importance = pd.DataFrame({
    'feature': [f'word_{i}' for i in range(X.shape[1])],
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False).head(20)

plt.figure(figsize=(10, 8))
plt.barh(feature_importance['feature'], feature_importance['importance'], color='skyblue')
plt.xlabel('Importance Score')
plt.title('Top 20 Most Important Features')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig('../outputs/feature_importance.png', dpi=300, bbox_inches='tight')
plt.close()
print("Feature importance chart saved")

#Save metrics to file
metrics = {
    'accuracy': float(accuracy),
    'precision': float(precision),
    'recall': float(recall),
    'f1_score': float(f1),
    'cv_mean': float(cv_scores.mean()),
    'cv_std': float(cv_scores.std())
}

import json
with open('../outputs/model_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=4)

#Save the model
joblib.dump(model, '../outputs/decision_tree_model.pkl')
print("Model saved to outputs/decision_tree_model.pkl")

#Print classification report
print("\nDetailed Classification Report:")
print(classification_report(y_test, y_pred, target_names=category_names))

print("\nTraining complete!")