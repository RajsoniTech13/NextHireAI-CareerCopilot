import pandas as pd
import numpy as np
import re
from sklearn.feature_extraction.text import CountVectorizer
import random
import os

os.makedirs('../outputs', exist_ok=True)

print("Loading data...")

resumes_df = pd.read_csv('../data/resumes.csv')
print(f"Loaded {len(resumes_df)} resumes")

jobs_df = pd.read_csv(r"C:\Users\Luckyrajsinh Kathiya\Desktop\Project\job-assistant\ai-module\data\postings.csv")
print(f"Loaded {len(jobs_df)} job postings")

jobs_df = jobs_df.dropna(subset=['description'])
print(f"After cleaning: {len(jobs_df)} job postings with descriptions")

SKILL_KEYWORDS = [
    'python', 'java', 'javascript', 'sql', 'react', 'angular', 'node', 'django',
    'flask', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'aws',
    'azure', 'docker', 'kubernetes', 'git', 'jenkins', 'agile', 'scrum', 'jira',
    'html', 'css', 'mongodb', 'postgresql', 'mysql', 'rest api', 'graphql',
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science',
    'excel', 'tableau', 'power bi', 'salesforce', 'sap', 'oracle', 'linux',
    'communication', 'leadership', 'project management', 'teamwork', 'problem solving'
]

def extract_skills(text):
    """Extract skills from text"""
    if pd.isna(text):
        return []
    text = str(text).lower()
    found_skills = []
    for skill in SKILL_KEYWORDS:
        if skill in text:
            found_skills.append(skill)
    return list(set(found_skills))

print("\nCreating matching dataset...")

match_data = []
num_resumes_to_use = min(500, len(resumes_df))
num_jobs_to_use = min(1000, len(jobs_df))

resumes_sample = resumes_df.head(num_resumes_to_use)
jobs_sample = jobs_df.head(num_jobs_to_use)

print(f"Using {len(resumes_sample)} resumes and {len(jobs_sample)} jobs")

for idx, resume in resumes_sample.iterrows():
    if idx % 100 == 0:
        print(f"Processing resume {idx+1}/{len(resumes_sample)}...")
    
    resume_skills = extract_skills(resume['Resume_str'])
    resume_category = resume['Category']
    
    for job_idx, job in jobs_sample.iterrows():
        job_skills = extract_skills(job['description'])
        job_skills += extract_skills(job.get('skills_desc', ''))
        job_skills = list(set(job_skills))
        
        if len(job_skills) > 0:
            matching_skills = [s for s in job_skills if s in resume_skills]
            match_score = len(matching_skills) / len(job_skills)
        else:
            match_score = 0
        
        category_match = 1 if resume_category.lower() in str(job['title']).lower() else 0
        
        is_match = 1 if (match_score > 0.3 or category_match == 1) else 0
        
        match_data.append({
            'resume_id': idx,
            'resume_category': resume_category,
            'job_title': job['title'],
            'job_experience_level': job.get('formatted_experience_level', 'unknown'),
            'job_work_type': job.get('formatted_work_type', 'unknown'),
            'num_resume_skills': len(resume_skills),
            'num_job_skills': len(job_skills),
            'matching_skills_count': len([s for s in job_skills if s in resume_skills]),
            'match_score': match_score,
            'category_match': category_match,
            'is_match': is_match  #This is our target/label
        })

match_df = pd.DataFrame(match_data)
print(f"\nCreated {len(match_df)} resume-job pairs")

match_df.to_csv('../data/resume_job_matches.csv', index=False)
print(f"Saved to: ../data/resume_job_matches.csv")

print(f"\nMatch statistics:")
print(f"   Total pairs: {len(match_df)}")
print(f"   Good matches (is_match=1): {match_df['is_match'].sum()} ({match_df['is_match'].mean()*100:.1f}%)")
print(f"   Bad matches (is_match=0): {len(match_df) - match_df['is_match'].sum()} ({(1-match_df['is_match'].mean())*100:.1f}%)")

print(f"\nSample data:")
print(match_df.head(10))