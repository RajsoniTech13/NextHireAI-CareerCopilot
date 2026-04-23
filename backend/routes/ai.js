// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const PythonAIBridge = require('../utils/pythonBridge');
const Application = require('../models/Application');
const User = require('../models/User');

// Middleware to verify token
const auth = require('../middleware/auth');

// GET /api/ai/health - Check AI service status
router.get('/health', async (req, res) => {
  const status = await PythonAIBridge.healthCheck();
  res.json(status);
});

// POST /api/ai/predict-category - Predict category from resume
router.post('/predict-category', auth, async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }
    
    const result = await PythonAIBridge.predictCategory(resumeText);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/ai/match-job - Match resume with a specific job
router.post('/match-job', auth, async (req, res) => {
  try {
    const { resumeText, jobDescription, jobTitle } = req.body;
    
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Resume text and job description required' });
    }
    
    const result = await PythonAIBridge.predictMatch(resumeText, jobDescription, jobTitle);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/ai/match-jobs-batch - Match resume with multiple jobs
router.post('/match-jobs-batch', auth, async (req, res) => {
  try {
    const { resumeText, jobs } = req.body;
    
    if (!resumeText || !jobs || !jobs.length) {
      return res.status(400).json({ error: 'Resume text and jobs array required' });
    }
    
    const result = await PythonAIBridge.predictBatch(resumeText, jobs);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ai/recommendations - Get AI job recommendations for user
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's latest application/resume
    const user = await User.findById(userId);
    const applications = await Application.find({ userId }).sort({ createdAt: -1 }).limit(10);
    
    if (!applications.length) {
      return res.json({ recommendations: [], message: 'No applications found' });
    }
    
    // Extract resume text from applications
    const resumeText = applications.map(app => app.resumeText || '').join(' ');
    
    if (!resumeText) {
      return res.json({ recommendations: [], message: 'No resume text found' });
    }
    
    // Get jobs from your database or use sample jobs
    // You can fetch from LinkedIn dataset or your job collection
    const sampleJobs = [
      {
        id: 1,
        title: 'Software Engineer',
        description: 'Looking for Python developer with React and SQL experience'
      },
      {
        id: 2,
        title: 'Data Scientist',
        description: 'Need expert in Python, Machine Learning, and SQL'
      },
      {
        id: 3,
        title: 'HR Manager',
        description: 'HR professional with employee relations and recruitment experience'
      }
    ];
    
    const result = await PythonAIBridge.predictBatch(resumeText, sampleJobs);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;