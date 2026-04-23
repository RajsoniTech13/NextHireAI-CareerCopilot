// frontend/src/pages/JS AIDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const AIDashboard = () => {
  const [resumeText, setResumeText] = useState('');
  const [resumeCategory, setResumeCategory] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('checking');
  
  const token = localStorage.getItem('token');
  const BACKEND_URL = 'http://localhost:5000';
  const AI_API_URL = 'http://localhost:5001';

  useEffect(() => {
    checkAIStatus();
    loadUserResume();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await axios.get(`${AI_API_URL}/health`);
      setAiStatus(response.data.status === 'AI Service Running' ? 'online' : 'offline');
    } catch (error) {
      setAiStatus('offline');
    }
  };

  const loadUserResume = async () => {
    setLoading(true);
    try {
      let resumeTextFromStorage = '';
      
      // Try to get from backend first
      try {
        const response = await axios.get(`${BACKEND_URL}/api/applications`, {
          headers: { 'x-auth-token': token }
        });
        if (response.data && response.data.length > 0) {
          resumeTextFromStorage = response.data[0].resumeText || '';
        }
      } catch (err) {
        console.log('Backend fetch failed');
      }
      
      // Fallback to localStorage
      if (!resumeTextFromStorage) {
        resumeTextFromStorage = localStorage.getItem('userResume') || '';
      }
      
      setResumeText(resumeTextFromStorage);
      
      if (resumeTextFromStorage) {
        await analyzeResume(resumeTextFromStorage);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    }
    setLoading(false);
  };

  const analyzeResume = async (text) => {
    setLoading(true);
    try {
      // Get category prediction
      const categoryRes = await axios.post(`${AI_API_URL}/predict/category`, {
        resume_text: text
      });
      setResumeCategory(categoryRes.data.predicted_category);

      // Job recommendations
      const jobs = [
        { id: 1, title: 'Software Engineer', description: 'Python, Django, React, SQL, AWS, JavaScript' },
        { id: 2, title: 'Data Scientist', description: 'Python, Machine Learning, SQL, Pandas, NumPy' },
        { id: 3, title: 'Full Stack Developer', description: 'React, Node.js, MongoDB, JavaScript' },
        { id: 4, title: 'DevOps Engineer', description: 'AWS, Docker, Kubernetes, Jenkins, Linux' },
        { id: 5, title: 'Backend Developer', description: 'Python, Django, Flask, PostgreSQL, REST APIs' }
      ];

      const matches = [];
      for (const job of jobs) {
        try {
          const matchRes = await axios.post(`${AI_API_URL}/predict/match`, {
            resume_text: text,
            job_description: job.description,
            job_title: job.title
          });
          matches.push({
            ...job,
            match_score: matchRes.data.match_score,
            match_level: matchRes.data.match_level,
            matching_skills: matchRes.data.matching_skills || 0,
            total_skills: matchRes.data.total_job_skills || 0
          });
        } catch (err) {
          console.error(`Error matching ${job.title}:`, err);
        }
      }
      setRecommendations(matches.sort((a, b) => b.match_score - a.match_score));
    } catch (error) {
      console.error('Analysis failed:', error);
    }
    setLoading(false);
  };

  const getMatchColorClass = (score) => {
    if (score >= 70) return 'match-excellent';
    if (score >= 50) return 'match-good';
    if (score >= 30) return 'match-fair';
    return 'match-poor';
  };

  const getMatchText = (score) => {
    if (score >= 70) return 'Excellent Match';
    if (score >= 50) return 'Good Match';
    if (score >= 30) return 'Fair Match';
    return 'Poor Match';
  };

  return (
    <div className="container">
      <h1>AI Career Dashboard</h1>

      {/* AI Status */}
      <div className={`ai-status-badge ${aiStatus}`}>
        {aiStatus === 'online' ? 'AI Service Connected' : 'AI Service Offline'}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center" style={{ padding: '50px' }}>
          <p>AI is analyzing your resume...</p>
        </div>
      )}

      {/* Resume Category */}
      {!loading && resumeCategory && (
        <div className="ai-gradient-box text-center">
          <h2>Your Predicted Career Path</h2>
          <div className="score-number">{resumeCategory}</div>
          <p className="mt-10">Based on your resume, AI predicts you're best suited for {resumeCategory} roles</p>
        </div>
      )}

      {/* Job Recommendations */}
      <h2 className="mt-20">Recommended Jobs For You</h2>
      
      {!loading && !resumeCategory && (
        <div className="no-results-placeholder">
          <p>No resume found. Please upload a resume first!</p>
          <button onClick={() => window.location.href = '/upload-resume'} className="mt-10">
            Go to Upload Resume
          </button>
        </div>
      )}

      {!loading && recommendations.length > 0 ? (
        <div className="stats">
          {recommendations.map((job) => (
            <div key={job.id} className="job-card">
              <div className="flex-between">
                <h3>{job.title}</h3>
                <div className="text-right">
                  <div className={`score-number ${getMatchColorClass(job.match_score)}`}>
                    {job.match_score}%
                  </div>
                  <div className="hint">Match Score</div>
                </div>
              </div>
              
              <div className="mt-10">
                <span className={`skill-tag ${getMatchColorClass(job.match_score)}`}>
                  {getMatchText(job.match_score)}
                </span>
                {job.matching_skills > 0 && (
                  <span className="hint ml-10">
                    {job.matching_skills}/{job.total_skills} skills match
                  </span>
                )}
              </div>
              
              <p className="hint mt-10">{job.description}</p>
            </div>
          ))}
        </div>
      ) : !loading && resumeCategory && recommendations.length === 0 ? (
        <div className="text-center" style={{ padding: '50px' }}>
          <p>Loading recommendations...</p>
        </div>
      ) : null}

      {/* Refresh Button */}
      {resumeCategory && (
        <button 
          onClick={() => resumeText && analyzeResume(resumeText)}
          disabled={loading}
          className="mt-20"
        >
          {loading ? 'Analyzing...' : 'Refresh Recommendations'}
        </button>
      )}
    </div>
  );
};

export default AIDashboard;