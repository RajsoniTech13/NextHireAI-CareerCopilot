# AI Module Deep Dive: Job Assistant

This document provides a technical deep dive into the `ai-module`, explaining the data processing pipeline, model architectures, and prediction logic.

---

## 1. Data Pipeline

The AI module processes two main types of data: **Resumes** and **Job Postings**.

### 1.1 Datasets (`ai-module/data/`)
-   `resumes.csv`: Contains thousands of resumes categorized by job title.
-   `postings.csv`: A large dataset (LinkedIn) of job postings including descriptions, requirements, and titles.
-   `processed_resumes.csv`: The output of `scripts/02_prepare_data.py`, cleaned and ready for training.

### 1.2 Text Preprocessing
The preprocessing logic is implemented in `scripts/02_prepare_data.py` and replicated in `api/predict_api.py`.
-   **Regex Cleaning**: Removes URLs, hashtags, mentions, special characters, and extra whitespaces.
-   **Normalization**: Converts all text to lowercase.
-   **Tokenization**: (Implicitly handled by TF-IDF) Breaking text into individual words.

---

## 2. Model Architectures

### 2.1 Category Classifier
-   **Algorithm**: Decision Tree Classifier.
-   **Input**: TF-IDF features of the resume text.
-   **Output**: A predicted category (e.g., "Data Science", "Web Designing", "Health and Fitness").
-   **Why Decision Tree?**: It provides high interpretability and handles non-linear relationships in text features well for broad category classification.

### 2.2 Job Matcher
-   **Method**: Hybrid Rule-based + Vector Similarity.
-   **Logic**:
    1.  **Skill Extraction**: Uses a set of `SKILL_KEYWORDS` (Python, React, AWS, etc.) to extract skill tokens from both the resume and the job description.
    2.  **Jaccard-like Similarity**: Calculates the ratio of matching skills to the total required skills in the job description.
    3.  **Scoring**:
        -   `>= 50%`: Excellent Match
        -   `30% - 50%`: Good Match
        -   `10% - 30%`: Fair Match
        -   `< 10%`: Poor Match

---

## 3. Training Scripts (`ai-module/scripts/`)

| Script | Purpose |
| :--- | :--- |
| `01_check_data.py` | Validates CSV structures and checks for missing values. |
| `02_prepare_data.py` | Performs NLP cleaning and saves a processed dataset. |
| `03_train_model.py` | Fits the TF-IDF Vectorizer and Decision Tree, then saves `.pkl` files to `outputs/`. |
| `04_visualize.py` | Generates WordClouds and category distribution plots. |
| `06_create_match_data.py` | Synthesizes a matching dataset for training the matcher. |
| `07_train_matcher.py` | Trains the specific matcher model for scoring compatibility. |

---

## 4. Model Artifacts (`ai-module/outputs/`)

These files are generated during training and loaded by the Flask API:
-   `tfidf_vectorizer.pkl`: The vocabulary and IDF weights (Size: ~10MB+).
-   `decision_tree_model.pkl`: The serialized Decision Tree nodes.
-   `label_encoder.pkl`: The mapping from integers (0, 1, 2...) to category names.

---

## 5. API Logic (`api/predict_api.py`)

The Flask API acts as a wrapper around the loaded models.

### Key Internal Functions:
-   `extract_skills(text)`: Scans text for predefined technical keywords.
-   `predict_category(resume_text)`: Transforms text via TF-IDF and predicts using the Decision Tree.
-   `predict_match(resume, jd)`: Computes the skill-based match score.

### Example AI Bridge Response (Batch):
```json
{
  "resume_category": "Data Science",
  "recommendations": [
    {
      "job_id": "123",
      "job_title": "Junior Data Scientist",
      "match_score": 85.0,
      "match_level": "Excellent Match",
      "matching_skills_count": 5
    }
  ]
}
```

---

## 6. Optimization Suggestions
1.  **N-grams**: Currently, TF-IDF might be using unigrams. Using bigrams (e.g., "Machine Learning", "Data Science") would improve accuracy.
2.  **Stopwords**: Ensure a comprehensive list of English stopwords is removed to reduce noise in the TF-IDF vector.
3.  **Named Entity Recognition (NER)**: Use libraries like Spacy to extract specific entities like "Companies Worked For" or "Education Level".
