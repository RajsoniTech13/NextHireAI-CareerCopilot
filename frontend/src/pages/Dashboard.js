// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const Dashboard = () => {
  const [userName, setUserName] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI States
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [resumeCategory, setResumeCategory] = useState(null);
  const AI_API_URL = 'http://localhost:5001';

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadUserData();
    loadApplications();
    loadAIRecommendations();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/user', {
        headers: { 'x-auth-token': token }
      });
      setUserName(response.data.name);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/applications', {
        headers: { 'x-auth-token': token }
      });
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
    setLoading(false);
  };

  const loadAIRecommendations = async () => {
    setAiLoading(true);
    try {
      let resumeText = '';
      
      // Try to get resume from backend first
      try {
        const response = await axios.get('http://localhost:5000/api/applications', {
          headers: { 'x-auth-token': token }
        });
        if (response.data && response.data.length > 0) {
          resumeText = response.data[0].resumeText || '';
        }
      } catch (err) {
        console.log('Backend fetch failed, trying localStorage');
      }
      
      if (!resumeText) {
        resumeText = localStorage.getItem('userResume') || '';
      }
      
      if (resumeText) {
        const categoryRes = await axios.post(`${AI_API_URL}/predict/category`, {
          resume_text: resumeText
        });
        setResumeCategory(categoryRes.data.predicted_category);
        
        const sampleJobs = [
          { title: 'Software Engineer', description: 'Python, Django, React, SQL, AWS' },
          { title: 'Data Scientist', description: 'Python, Machine Learning, SQL, Pandas' },
          { title: 'Full Stack Developer', description: 'React, Node.js, MongoDB, JavaScript' }
        ];
        
        const matches = [];
        for (const job of sampleJobs) {
          try {
            const matchRes = await axios.post(`${AI_API_URL}/predict/match`, {
              resume_text: resumeText,
              job_description: job.description,
              job_title: job.title
            });
            matches.push({
              title: job.title,
              score: matchRes.data.match_score,
              level: matchRes.data.match_level,
              matching_skills: matchRes.data.matching_skills,
              total_skills: matchRes.data.total_job_skills
            });
          } catch (err) {
            console.error(`Error matching ${job.title}:`, err);
          }
        }
        setAiRecommendations(matches.sort((a, b) => b.score - a.score));
      }
    } catch (error) {
      console.error('AI loading error:', error);
    }
    setAiLoading(false);
  };

  const getMatchColorClass = (score) => {
    if (score >= 70) return 'match-excellent';
    if (score >= 50) return 'match-good';
    if (score >= 30) return 'match-fair';
    return 'match-poor';
  };

  // Helper function to format date safely
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Date not set';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Helper function to get company name
  const getCompanyName = (app) => {
    return app.company || app.companyName || 'Unknown Company';
  };

  // Helper function to get job title
  const getJobTitle = (app) => {
    return app.position || app.jobTitle || 'Application';
  };

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p className="mb-20">Welcome back, <strong>{userName || 'User'}!</strong></p>

      {/* AI Recommendations Section */}
      <div className="ai-gradient-box">
        <h2>AI Job Recommendations</h2>
        
        {aiLoading ? (
          <p>Analyzing your resume...</p>
        ) : resumeCategory ? (
          <>
            <p>Based on your resume, you're a match for <strong>{resumeCategory}</strong> roles</p>
            <div className="ai-recommendation-list">
              {aiRecommendations.slice(0, 5).map((job, idx) => (
                <div key={idx} className="ai-recommendation-item">
                  <div>
                    <strong>{job.title}</strong>
                    {job.matching_skills > 0 && (
                      <div className="hint">{job.matching_skills}/{job.total_skills} skills match</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`score-number ${getMatchColorClass(job.score)}`}>
                      {job.score}%
                    </span>
                    <div className="hint">{job.level}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={loadAIRecommendations} className="mt-15">
              Refresh Recommendations
            </button>
          </>
        ) : (
          <div>
            <p>Upload a resume to get AI-powered job recommendations</p>
            <button onClick={() => window.location.href = '/upload-resume'} className="mt-10">
              Go to Upload Resume
            </button>
          </div>
        )}
      </div>

      {/* Your Applications Section */}
      <h2 className="mt-20">Your Applications</h2>
      {loading ? (
        <p>Loading...</p>
      ) : applications.length === 0 ? (
        <div className="no-results-placeholder">
          <p>No applications yet. Start by adding one!</p>
          <button onClick={() => window.location.href = '/applications'} className="mt-10">
            + Add Application
          </button>
        </div>
      ) : (
        <div className="stats">
          {applications.slice(0, 5).map((app, idx) => (
            <div key={idx} className="stat-box">
              <h3>{getJobTitle(app)}</h3>
              <p className="hint">{getCompanyName(app)} • <span className={`status status-${app.status || 'applied'}`}>{app.status || 'Applied'}</span></p>
              <p className="hint">Applied on: {formatDate(app.date || app.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;