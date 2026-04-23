// backend/utils/pythonBridge.js
const axios = require('axios');

// Python AI API URL
const AI_API_URL = 'http://localhost:5001';

class PythonAIBridge {
  
  // Check if AI service is running
  static async healthCheck() {
    try {
      const response = await axios.get(`${AI_API_URL}/health`, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.error('AI Service not reachable:', error.message);
      return { status: 'offline', error: error.message };
    }
  }

  // Predict job category from resume text
  static async predictCategory(resumeText) {
    try {
      const response = await axios.post(`${AI_API_URL}/predict/category`, {
        resume_text: resumeText
      });
      return response.data;
    } catch (error) {
      console.error('Category prediction failed:', error.message);
      return { predicted_category: 'Unknown', error: error.message };
    }
  }

  // Predict match between resume and single job
  static async predictMatch(resumeText, jobDescription, jobTitle = '') {
    try {
      const response = await axios.post(`${AI_API_URL}/predict/match`, {
        resume_text: resumeText,
        job_description: jobDescription,
        job_title: jobTitle
      });
      return response.data;
    } catch (error) {
      console.error('Match prediction failed:', error.message);
      return { match_score: 0, match_level: 'Error', error: error.message };
    }
  }

  // Predict matches for multiple jobs
  static async predictBatch(resumeText, jobs) {
    try {
      const response = await axios.post(`${AI_API_URL}/predict/batch`, {
        resume_text: resumeText,
        jobs: jobs.map(job => ({
          id: job._id || job.id,
          title: job.title,
          description: job.description
        }))
      });
      return response.data;
    } catch (error) {
      console.error('Batch prediction failed:', error.message);
      return { recommendations: [], error: error.message };
    }
  }
}

module.exports = PythonAIBridge;