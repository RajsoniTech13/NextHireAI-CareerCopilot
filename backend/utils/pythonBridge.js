// backend/utils/pythonBridge.js
const axios = require('axios');

// Python AI API URL
const AI_API_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

class PythonAIBridge {
  
  // Check if AI service is running
  static async healthCheck() {
    try {
      const response = await axios.get(`${AI_API_URL}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.error('AI Service not reachable:', error.message);
      return { status: 'offline', error: error.message };
    }
  }

  // Full resume analysis (ATS score, skills, suggestions)
  static async analyzeResume(resumeText, jobDescription = '') {
    try {
      const response = await axios.post(`${AI_API_URL}/analyze/resume`, {
        resume_text: resumeText,
        job_description: jobDescription
      }, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error('Resume analysis failed:', error.message);
      // Fallback to legacy endpoint
      try {
        const legacyRes = await axios.post(`${AI_API_URL}/predict/category`, {
          resume_text: resumeText
        }, { timeout: 10000 });
        return {
          predicted_category: legacyRes.data.predicted_category,
          ats_score: 0,
          strengths: [],
          weaknesses: [],
          suggestions: [],
          skills: { technical: [], soft: [], all: [] }
        };
      } catch (fallbackErr) {
        return { ats_score: 0, predicted_category: 'Unknown', error: error.message };
      }
    }
  }

  // Semantic job matching
  static async semanticMatch(resumeText, jobDescription, jobTitle = '') {
    try {
      const response = await axios.post(`${AI_API_URL}/match/semantic`, {
        resume_text: resumeText,
        job_description: jobDescription,
        job_title: jobTitle
      }, { timeout: 15000 });
      return response.data;
    } catch (error) {
      console.error('Semantic match failed:', error.message);
      return { match_score: 0, match_level: 'Error', error: error.message };
    }
  }

  // Predict job category from resume text
  static async predictCategory(resumeText) {
    try {
      const response = await axios.post(`${AI_API_URL}/career/category`, {
        resume_text: resumeText
      }, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('Category prediction failed:', error.message);
      return { primary_category: 'Unknown', error: error.message };
    }
  }

  // Predict match between resume and single job (legacy compatible)
  static async predictMatch(resumeText, jobDescription, jobTitle = '') {
    try {
      const response = await axios.post(`${AI_API_URL}/predict/match`, {
        resume_text: resumeText,
        job_description: jobDescription,
        job_title: jobTitle
      }, { timeout: 15000 });
      return response.data;
    } catch (error) {
      console.error('Match prediction failed:', error.message);
      return { match_score: 0, match_level: 'Error', error: error.message };
    }
  }

  // Predict matches for multiple jobs
  static async predictBatch(resumeText, jobs) {
    try {
      const response = await axios.post(`${AI_API_URL}/match/batch`, {
        resume_text: resumeText,
        jobs: jobs.map(job => ({
          id: job._id || job.id,
          title: job.title,
          description: job.description,
          company: job.company || '',
          location: job.location || ''
        }))
      }, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error('Batch prediction failed:', error.message);
      return { recommendations: [], error: error.message };
    }
  }

  // Career path suggestions
  static async suggestCareerPaths(resumeText, currentRole = '') {
    try {
      const response = await axios.post(`${AI_API_URL}/career/paths`, {
        resume_text: resumeText,
        current_role: currentRole
      }, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('Career paths failed:', error.message);
      return { suggested_paths: [], error: error.message };
    }
  }
}

module.exports = PythonAIBridge;