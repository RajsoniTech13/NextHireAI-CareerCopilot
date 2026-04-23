"""
NextHireAI - Career Copilot API
Production-grade Flask API with Sentence Transformers + Semantic Matching
Replaces the old TF-IDF + Decision Tree approach
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
import traceback
import tempfile

# Add parent to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from semantic_engine import SemanticEngine
from resume_parser import ResumeParser

# ─── Flask App ───
app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'nexthire_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# ─── Load AI Engine ───
print("=" * 60)
print("  NextHireAI - Career Copilot API")
print("  Loading Semantic Engine...")
print("=" * 60)

engine = SemanticEngine.get_instance()
print("[API] All models loaded successfully.\n")


# ═══════════════════════════════════════════
#  HEALTH & STATUS
# ═══════════════════════════════════════════

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'AI Service Running',
        'version': '2.0.0',
        'engine': 'Sentence Transformers (all-MiniLM-L6-v2)',
        'models_loaded': True,
        'features': [
            'Semantic Resume Matching',
            'Career Category Prediction',
            'ATS Score Analysis',
            'PDF/DOCX Resume Parsing',
            'Career Path Suggestions',
            'Batch Job Matching'
        ]
    })


# ═══════════════════════════════════════════
#  RESUME ANALYSIS
# ═══════════════════════════════════════════

@app.route('/analyze/resume', methods=['POST'])
def analyze_resume():
    """
    Analyze a resume (text or file upload).
    Returns: ATS score, strengths, weaknesses, skills, suggestions
    """
    try:
        resume_text = None
        job_description = None
        
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
                file.save(filepath)
                try:
                    resume_text = ResumeParser.parse_file(filepath)
                finally:
                    # Clean up uploaded file
                    if os.path.exists(filepath):
                        os.remove(filepath)
        
        # Handle JSON body
        if not resume_text:
            data = request.get_json(silent=True) or {}
            resume_text = data.get('resume_text', '')
            job_description = data.get('job_description', '')
        
        if not resume_text:
            return jsonify({'error': 'No resume text or file provided'}), 400
        
        # Parse resume
        parsed = ResumeParser.parse_text(resume_text)
        
        # Analyze with ATS scoring
        analysis = ResumeParser.analyze_resume(parsed, job_description)
        
        # Get AI career prediction
        category = engine.predict_career_category(resume_text)
        
        return jsonify({
            'ats_score': analysis['ats_score'],
            'predicted_category': category['primary_category'],
            'category_confidence': category['confidence'],
            'top_categories': category['top_categories'],
            'strengths': analysis['strengths'],
            'weaknesses': analysis['weaknesses'],
            'suggestions': analysis['suggestions'],
            'section_scores': analysis['section_scores'],
            'skills': parsed['skills'],
            'contact': parsed['contact'],
            'word_count': parsed['word_count'],
            'keyword_density': analysis.get('keyword_density', 0),
            'missing_keywords': analysis.get('missing_keywords', [])
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/analyze/resume-file', methods=['POST'])
def analyze_resume_file():
    """
    Upload and analyze a resume file (PDF/DOCX/TXT).
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if not file.filename:
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        allowed = {'.pdf', '.docx', '.doc', '.txt'}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed:
            return jsonify({'error': f'Unsupported file type: {ext}. Allowed: {", ".join(allowed)}'}), 400
        
        # Save and parse
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        try:
            resume_text = ResumeParser.parse_file(filepath)
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
        
        job_description = request.form.get('job_description', '')
        
        # Full analysis pipeline
        parsed = ResumeParser.parse_text(resume_text)
        analysis = ResumeParser.analyze_resume(parsed, job_description)
        category = engine.predict_career_category(resume_text)
        
        return jsonify({
            'raw_text': resume_text,
            'ats_score': analysis['ats_score'],
            'predicted_category': category['primary_category'],
            'category_confidence': category['confidence'],
            'top_categories': category['top_categories'],
            'strengths': analysis['strengths'],
            'weaknesses': analysis['weaknesses'],
            'suggestions': analysis['suggestions'],
            'section_scores': analysis['section_scores'],
            'skills': parsed['skills'],
            'contact': parsed['contact'],
            'word_count': parsed['word_count'],
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════
#  SEMANTIC JOB MATCHING
# ═══════════════════════════════════════════

@app.route('/match/semantic', methods=['POST'])
def semantic_match():
    """
    Advanced semantic matching between resume and job description.
    Uses Sentence Transformer embeddings + cosine similarity.
    """
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        job_description = data.get('job_description', '')
        job_title = data.get('job_title', '')
        
        if not resume_text or not job_description:
            return jsonify({'error': 'Both resume_text and job_description are required'}), 400
        
        result = engine.match_resume_to_job(resume_text, job_description, job_title)
        
        # Also extract skills for comparison
        resume_parsed = ResumeParser.parse_text(resume_text)
        job_parsed = ResumeParser.parse_text(job_description)
        
        resume_skills = set(s.lower() for s in resume_parsed['skills']['technical'])
        job_skills = set(s.lower() for s in job_parsed['skills']['technical'])
        
        matching_skills = list(resume_skills & job_skills)
        missing_skills = list(job_skills - resume_skills)
        extra_skills = list(resume_skills - job_skills)
        
        result['skill_analysis'] = {
            'matching_skills': [s.title() for s in matching_skills],
            'missing_skills': [s.title() for s in missing_skills],
            'extra_skills': [s.title() for s in extra_skills[:10]],
            'skills_match_count': len(matching_skills),
            'skills_required_count': len(job_skills),
        }
        
        return jsonify(result)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/match/batch', methods=['POST'])
def batch_match():
    """
    Match resume against multiple jobs efficiently.
    Uses batch encoding for performance.
    """
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        jobs = data.get('jobs', [])
        
        if not resume_text or not jobs:
            return jsonify({'error': 'resume_text and jobs array are required'}), 400
        
        # Get career category
        category = engine.predict_career_category(resume_text)
        
        # Batch match
        results = engine.match_resume_to_jobs_batch(resume_text, jobs)
        
        return jsonify({
            'resume_category': category['primary_category'],
            'category_confidence': category['confidence'],
            'total_jobs': len(jobs),
            'recommendations': results[:20]
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════
#  CAREER INTELLIGENCE
# ═══════════════════════════════════════════

@app.route('/career/category', methods=['POST'])
def predict_category():
    """Predict career category from resume text"""
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        
        if not resume_text:
            return jsonify({'error': 'No resume text provided'}), 400
        
        result = engine.predict_career_category(resume_text)
        return jsonify(result)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/career/paths', methods=['POST'])
def suggest_paths():
    """Suggest career growth paths based on resume"""
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        current_role = data.get('current_role', '')
        
        if not resume_text:
            return jsonify({'error': 'No resume text provided'}), 400
        
        result = engine.suggest_career_paths(resume_text, current_role)
        return jsonify(result)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════
#  BACKWARD COMPATIBILITY (Legacy endpoints)
# ═══════════════════════════════════════════

@app.route('/predict/category', methods=['POST'])
def legacy_predict_category():
    """Legacy endpoint - redirects to new career/category"""
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        
        if not resume_text:
            return jsonify({'error': 'No resume text provided'}), 400
        
        result = engine.predict_career_category(resume_text)
        return jsonify({
            'predicted_category': result['primary_category'],
            'confidence': result['confidence']
        })
        
    except Exception as e:
        return jsonify({'predicted_category': 'Unknown', 'error': str(e)})


@app.route('/predict/match', methods=['POST'])
def legacy_predict_match():
    """Legacy endpoint - uses new semantic matching"""
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        job_description = data.get('job_description', '')
        job_title = data.get('job_title', '')
        
        if not resume_text or not job_description:
            return jsonify({'error': 'Missing resume or job description'}), 400
        
        result = engine.match_resume_to_job(resume_text, job_description, job_title)
        
        # Legacy response format compatibility
        resume_parsed = ResumeParser.parse_text(resume_text)
        job_parsed = ResumeParser.parse_text(job_description)
        
        return jsonify({
            'match_score': result['match_score'],
            'match_level': result['match_level'],
            'recommendation': result['recommendation'],
            'breakdown': result['breakdown'],
            'explanation': result['explanation'],
            'resume_skills': resume_parsed['skills']['technical'][:10],
            'job_skills': job_parsed['skills']['technical'][:10],
            'matching_skills': len(set(s.lower() for s in resume_parsed['skills']['technical']) & 
                                  set(s.lower() for s in job_parsed['skills']['technical'])),
            'total_job_skills': len(job_parsed['skills']['technical'])
        })
        
    except Exception as e:
        return jsonify({'match_score': 0, 'match_level': 'Error', 'error': str(e)})


@app.route('/predict/batch', methods=['POST'])
def legacy_predict_batch():
    """Legacy endpoint - uses new batch matching"""
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        jobs = data.get('jobs', [])
        
        if not resume_text or not jobs:
            return jsonify({'error': 'Missing resume or jobs'}), 400
        
        category = engine.predict_career_category(resume_text)
        results = engine.match_resume_to_jobs_batch(resume_text, jobs)
        
        return jsonify({
            'resume_category': category['primary_category'],
            'recommendations': results[:20]
        })
        
    except Exception as e:
        return jsonify({'recommendations': [], 'error': str(e)})


# ═══════════════════════════════════════════
#  START SERVER
# ═══════════════════════════════════════════

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("  NextHireAI Career Copilot API")
    print("  Port: 5001")
    print("  Engine: Sentence Transformers (Semantic)")
    print("  Endpoints:")
    print("    POST /analyze/resume         - Full resume analysis")
    print("    POST /analyze/resume-file    - Upload & analyze file")
    print("    POST /match/semantic         - Semantic job matching")
    print("    POST /match/batch            - Batch job matching")
    print("    POST /career/category        - Career prediction")
    print("    POST /career/paths           - Career path suggestions")
    print("    GET  /health                 - Service status")
    print("  Legacy (backward compatible):")
    print("    POST /predict/category")
    print("    POST /predict/match")
    print("    POST /predict/batch")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=False)