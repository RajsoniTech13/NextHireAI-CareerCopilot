// frontend/src/services/aiService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/ai';  // Your Node.js backend

// Get AI service status
export const checkAIHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('AI service offline:', error);
    return { status: 'offline' };
  }
};

// Predict job category from resume
export const predictCategory = async (resumeText, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/predict-category`,
      { resumeText },
      { headers: { 'x-auth-token': token } }
    );
    return response.data;
  } catch (error) {
    console.error('Category prediction failed:', error);
    return { predicted_category: 'Unknown', error: error.message };
  }
};

// Match resume with a single job
export const matchJob = async (resumeText, jobDescription, jobTitle, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/match-job`,
      { resumeText, jobDescription, jobTitle },
      { headers: { 'x-auth-token': token } }
    );
    return response.data;
  } catch (error) {
    console.error('Match prediction failed:', error);
    return { match_score: 0, match_level: 'Error' };
  }
};

// Get AI recommendations for user
export const getRecommendations = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/recommendations`, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Recommendations failed:', error);
    return { recommendations: [] };
  }
};