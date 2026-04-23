from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import re
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

#Flask app
app = Flask(__name__)
CORS(app)

#Path for Model (where models are saved)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')

print("Loading AI Models...")

category_model = joblib.load(os.path.join(OUTPUTS_DIR, 'decision_tree_model.pkl'))
matcher_model = joblib.load(os.path.join(OUTPUTS_DIR, 'job_matcher_model.pkl'))
vectorizer = joblib.load(os.path.join(OUTPUTS_DIR, 'tfidf_vectorizer.pkl'))
label_encoder = joblib.load(os.path.join(OUTPUTS_DIR, 'label_encoder.pkl'))

SKILL_KEYWORDS = [
    'python', 'java', 'javascript', 'sql', 'react', 'angular', 'node', 'django',
    'flask', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'aws', 'azure',
    'docker', 'kubernetes', 'git', 'jenkins', 'agile', 'scrum', 'jira',
    'html', 'css', 'mongodb', 'postgresql', 'machine learning', 'data science',
    'excel', 'tableau', 'communication', 'leadership', 'project management'
]

def extract_skills(text):
    """Extract skills from text"""
    if not text or pd.isna(text):
        return []
    text = str(text).lower()
    return [s for s in SKILL_KEYWORDS if s in text]

def predict_category(resume_text):
    """Predict job category from resume text"""
    if not resume_text:
        return "Unknown"
    clean_text = ' '.join(str(resume_text).split())
    features = vectorizer.transform([clean_text]).toarray()
    pred = category_model.predict(features)[0]
    return label_encoder.inverse_transform([pred])[0]

def predict_match(resume_text, job_description, job_title=""):
    """Predict match score between resume and job"""
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)
    
    if len(job_skills) > 0:
        matching = len([s for s in job_skills if s in resume_skills])
        score = matching / len(job_skills)
    else:
        score = 0

    if score >= 0.5:
        level = "Excellent Match"
    elif score >= 0.3:
        level = "Good Match"
    elif score >= 0.1:
        level = "Fair Match"
    else:
        level = "Poor Match"
    
    return {
        'match_score': round(score * 100, 2),
        'match_level': level,
        'matching_skills': matching,
        'total_job_skills': len(job_skills),
        'resume_skills': resume_skills[:10],
        'job_skills': job_skills[:10]
    }

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AI Service Running', 'models_loaded': True})

@app.route('/predict/category', methods=['POST'])
def predict_category_api():
    """Predict job category from resume text"""
    data = request.get_json()
    resume_text = data.get('resume_text', '')
    
    if not resume_text:
        return jsonify({'error': 'No resume text provided'}), 400
    
    category = predict_category(resume_text)
    return jsonify({
        'predicted_category': category,
        'confidence': 'medium'
    })

@app.route('/predict/match', methods=['POST'])
def predict_match_api():
    """Predict match between resume and job"""
    data = request.get_json()
    resume_text = data.get('resume_text', '')
    job_description = data.get('job_description', '')
    job_title = data.get('job_title', '')
    
    if not resume_text or not job_description:
        return jsonify({'error': 'Missing resume or job description'}), 400
    
    result = predict_match(resume_text, job_description, job_title)
    return jsonify(result)

@app.route('/predict/batch', methods=['POST'])
def predict_batch_api():
    """Predict matches for multiple jobs against a resume"""
    data = request.get_json()
    resume_text = data.get('resume_text', '')
    jobs = data.get('jobs', [])  #List of {id, title, description}
    
    if not resume_text or not jobs:
        return jsonify({'error': 'Missing resume or jobs'}), 400
    
    results = []
    for job in jobs:
        match = predict_match(resume_text, job.get('description', ''), job.get('title', ''))
        results.append({
            'job_id': job.get('id'),
            'job_title': job.get('title'),
            'match_score': match['match_score'],
            'match_level': match['match_level'],
            'matching_skills_count': match['matching_skills']
        })
    
    #Sort by best match score
    results.sort(key=lambda x: x['match_score'], reverse=True)
    
    return jsonify({
        'resume_category': predict_category(resume_text),
        'recommendations': results[:20]
    })

if __name__ == '__main__':
    print("Starting AI Prediction API on port 5001...")
    print(f"Models loaded from: {OUTPUTS_DIR}")
    app.run(host='0.0.0.0', port=5001, debug=False)