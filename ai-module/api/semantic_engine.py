"""
SemanticEngine - Core AI engine for NextHireAI Career Copilot
Uses Sentence Transformers (all-MiniLM-L6-v2) for semantic similarity
Replaces TF-IDF + Decision Tree with embedding-based matching
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import os

class SemanticEngine:
    """Handles all semantic operations: embeddings, similarity, matching"""
    
    _instance = None
    _model = None
    
    @classmethod
    def get_instance(cls):
        """Singleton pattern to avoid loading model multiple times"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        print("[SemanticEngine] Loading Sentence Transformer model...")
        self._model = SentenceTransformer('all-MiniLM-L6-v2')
        print("[SemanticEngine] Model loaded successfully.")
    
    def encode(self, text):
        """Generate embedding for a single text"""
        if not text or not isinstance(text, str):
            return np.zeros(384)  # Model output dimension
        clean = self._clean_text(text)
        return self._model.encode(clean, show_progress_bar=False)
    
    def encode_batch(self, texts):
        """Generate embeddings for multiple texts"""
        cleaned = [self._clean_text(t) for t in texts]
        return self._model.encode(cleaned, show_progress_bar=False, batch_size=32)
    
    def similarity(self, text_a, text_b):
        """Calculate cosine similarity between two texts"""
        emb_a = self.encode(text_a).reshape(1, -1)
        emb_b = self.encode(text_b).reshape(1, -1)
        score = cosine_similarity(emb_a, emb_b)[0][0]
        return float(max(0, min(1, score)))
    
    def match_resume_to_job(self, resume_text, job_description, job_title=""):
        """
        Advanced resume-job matching with weighted scoring.
        Returns match score, level, explanation, and skill gap.
        """
        # Generate embeddings
        resume_emb = self.encode(resume_text).reshape(1, -1)
        
        # Create combined job context for better matching
        job_context = f"{job_title}. {job_description}" if job_title else job_description
        job_emb = self.encode(job_context).reshape(1, -1)
        
        # Overall semantic similarity
        overall_score = float(cosine_similarity(resume_emb, job_emb)[0][0])
        
        # Section-based matching for deeper analysis
        resume_sections = self._extract_sections(resume_text)
        
        # Skills match
        skills_score = self.similarity(
            resume_sections.get('skills', resume_text),
            job_description
        )
        
        # Experience match
        experience_score = self.similarity(
            resume_sections.get('experience', resume_text),
            job_description
        )
        
        # Weighted final score
        final_score = (
            overall_score * 0.40 +
            skills_score * 0.35 +
            experience_score * 0.25
        )
        
        # Normalize to 0-100
        match_percentage = round(min(final_score * 130, 100), 1)  # Scale up slightly since cosine rarely hits 1.0
        
        # Determine match level
        if match_percentage >= 75:
            level = "Excellent Match"
            recommendation = "You're a strong fit for this role. Tailor your resume to highlight the most relevant experience and apply with confidence."
        elif match_percentage >= 55:
            level = "Good Match"
            recommendation = "Solid alignment with this role. Focus on bridging minor skill gaps in your cover letter."
        elif match_percentage >= 35:
            level = "Fair Match"
            recommendation = "Some relevant experience detected. Consider upskilling in the areas where you fall short before applying."
        else:
            level = "Low Match"
            recommendation = "This role may not align well with your current profile. Consider roles that better match your skillset."
        
        # Generate match explanation
        explanation = self._generate_match_explanation(
            resume_sections, job_description, job_title, 
            overall_score, skills_score, experience_score
        )
        
        return {
            'match_score': match_percentage,
            'match_level': level,
            'recommendation': recommendation,
            'breakdown': {
                'overall_similarity': round(overall_score * 100, 1),
                'skills_match': round(skills_score * 100, 1),
                'experience_match': round(experience_score * 100, 1)
            },
            'explanation': explanation
        }
    
    def match_resume_to_jobs_batch(self, resume_text, jobs):
        """Match resume against multiple jobs efficiently"""
        resume_emb = self.encode(resume_text).reshape(1, -1)
        
        # Batch encode all job descriptions
        job_texts = [
            f"{job.get('title', '')}. {job.get('description', '')}"
            for job in jobs
        ]
        job_embeddings = self.encode_batch(job_texts)
        
        results = []
        for i, job in enumerate(jobs):
            job_emb = job_embeddings[i].reshape(1, -1)
            score = float(cosine_similarity(resume_emb, job_emb)[0][0])
            match_pct = round(min(score * 130, 100), 1)
            
            if match_pct >= 75:
                level = "Excellent Match"
            elif match_pct >= 55:
                level = "Good Match"
            elif match_pct >= 35:
                level = "Fair Match"
            else:
                level = "Low Match"
            
            results.append({
                'job_id': job.get('id', i),
                'job_title': job.get('title', 'Unknown'),
                'match_score': match_pct,
                'match_level': level,
                'company': job.get('company', ''),
                'location': job.get('location', '')
            })
        
        results.sort(key=lambda x: x['match_score'], reverse=True)
        return results
    
    def predict_career_category(self, resume_text):
        """Predict career category using semantic similarity to role descriptions"""
        career_categories = {
            'Software Engineering': 'software development programming coding web applications APIs backend frontend full stack developer engineer',
            'Data Science': 'data science machine learning analytics statistics modeling python pandas numpy tensorflow deep learning',
            'DevOps & Cloud': 'devops cloud infrastructure AWS Azure GCP Docker Kubernetes CI/CD deployment automation',
            'Product Management': 'product management roadmap stakeholders user stories agile product strategy metrics',
            'UI/UX Design': 'user experience design interface wireframes prototyping figma sketch user research',
            'Marketing': 'digital marketing SEO SEM content marketing social media campaign analytics branding',
            'Sales': 'sales business development account management CRM pipeline revenue targets negotiation',
            'Finance': 'finance accounting financial analysis budgeting forecasting reporting compliance audit',
            'Human Resources': 'human resources recruitment talent acquisition employee relations training development',
            'Project Management': 'project management PMP scrum agile timeline budget risk management stakeholders'
        }
        
        resume_emb = self.encode(resume_text).reshape(1, -1)
        
        categories = list(career_categories.keys())
        descriptions = list(career_categories.values())
        desc_embeddings = self.encode_batch(descriptions)
        
        scores = cosine_similarity(resume_emb, desc_embeddings)[0]
        
        results = sorted(
            zip(categories, scores),
            key=lambda x: x[1],
            reverse=True
        )
        
        return {
            'primary_category': results[0][0],
            'confidence': round(float(results[0][1]) * 100, 1),
            'top_categories': [
                {'category': cat, 'score': round(float(score) * 100, 1)}
                for cat, score in results[:5]
            ]
        }
    
    def suggest_career_paths(self, resume_text, current_role=""):
        """Suggest career growth paths based on resume analysis"""
        category_result = self.predict_career_category(resume_text)
        primary = category_result['primary_category']
        
        career_paths = {
            'Software Engineering': [
                'Senior Software Engineer',
                'Tech Lead',
                'Engineering Manager',
                'Software Architect',
                'CTO'
            ],
            'Data Science': [
                'Senior Data Scientist',
                'ML Engineer',
                'Data Engineering Lead',
                'Head of Analytics',
                'Chief Data Officer'
            ],
            'DevOps & Cloud': [
                'Senior DevOps Engineer',
                'Site Reliability Engineer',
                'Cloud Architect',
                'Platform Engineering Lead',
                'VP of Infrastructure'
            ],
            'Product Management': [
                'Senior Product Manager',
                'Group Product Manager',
                'Director of Product',
                'VP of Product',
                'Chief Product Officer'
            ],
            'UI/UX Design': [
                'Senior UX Designer',
                'Design Lead',
                'UX Research Manager',
                'Head of Design',
                'Chief Design Officer'
            ],
        }
        
        paths = career_paths.get(primary, [
            f'Senior {primary} Specialist',
            f'{primary} Lead',
            f'{primary} Manager',
            f'Director of {primary}',
            f'VP of {primary}'
        ])
        
        return {
            'current_domain': primary,
            'suggested_paths': paths,
            'skills_to_develop': self._suggest_skills(primary),
            'confidence': category_result['confidence']
        }
    
    # ───────── Internal Helpers ─────────
    
    def _clean_text(self, text):
        """Clean text for embedding"""
        if not text:
            return ""
        text = str(text)
        text = re.sub(r'http\S+', '', text)
        text = re.sub(r'[^\w\s.,;:\-/()@+#]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:8000]  # Limit for model
    
    def _extract_sections(self, resume_text):
        """Extract common resume sections"""
        sections = {}
        text = resume_text.lower()
        
        section_patterns = {
            'skills': r'(?:skills|technical skills|technologies|tools|competencies)(.*?)(?=\n\n|\nexperience|\nwork|\neducation|\nprojects|\ncertif|\n[A-Z]|$)',
            'experience': r'(?:experience|work history|employment|professional experience)(.*?)(?=\n\n|\nskills|\neducation|\nprojects|\ncertif|\n[A-Z]|$)',
            'education': r'(?:education|academic|qualifications|degree)(.*?)(?=\n\n|\nskills|\nexperience|\nprojects|\ncertif|\n[A-Z]|$)',
            'summary': r'(?:summary|objective|profile|about)(.*?)(?=\n\n|\nskills|\nexperience|\neducation|\n[A-Z]|$)',
        }
        
        for section_name, pattern in section_patterns.items():
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                sections[section_name] = match.group(1).strip()
        
        return sections
    
    def _generate_match_explanation(self, resume_sections, job_desc, job_title,
                                     overall, skills, experience):
        """Generate human-readable explanation for the match"""
        explanations = []
        
        if overall >= 0.6:
            explanations.append(f"Your overall profile strongly aligns with the {job_title or 'role'} requirements.")
        elif overall >= 0.4:
            explanations.append(f"Your profile shows moderate alignment with the {job_title or 'role'}.")
        else:
            explanations.append(f"Your profile has limited alignment with the {job_title or 'role'}.")
        
        if skills >= 0.6:
            explanations.append("Your technical skills are a strong match for this position.")
        elif skills >= 0.4:
            explanations.append("Your skills partially match. Consider highlighting transferable skills.")
        else:
            explanations.append("There is a notable skill gap. Upskilling may be beneficial.")
        
        if experience >= 0.6:
            explanations.append("Your work experience is highly relevant to this role.")
        elif experience >= 0.4:
            explanations.append("Some of your experience is applicable to this position.")
        else:
            explanations.append("Your experience may not directly translate. Focus on transferable achievements.")
        
        return explanations
    
    def _suggest_skills(self, domain):
        """Suggest skills to learn based on career domain"""
        skill_map = {
            'Software Engineering': ['System Design', 'Microservices', 'GraphQL', 'TypeScript', 'Kubernetes'],
            'Data Science': ['Deep Learning', 'MLOps', 'A/B Testing', 'Feature Engineering', 'Spark'],
            'DevOps & Cloud': ['Terraform', 'Service Mesh', 'Observability', 'GitOps', 'Security'],
            'Product Management': ['Data-Driven Decisions', 'OKRs', 'User Research', 'A/B Testing', 'SQL'],
            'UI/UX Design': ['Design Systems', 'Accessibility', 'Motion Design', 'User Testing', 'Figma Advanced'],
        }
        return skill_map.get(domain, ['Leadership', 'Communication', 'Strategic Thinking', 'Data Analysis', 'Project Management'])
