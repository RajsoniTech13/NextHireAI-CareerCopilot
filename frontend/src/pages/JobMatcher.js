// frontend/src/pages/JS JobMatcher.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const JobMatcher = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('checking');
  const [resumeCategory, setResumeCategory] = useState(null);

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
    try {
      let resumeTextFromStorage = '';
      
      // First try localStorage
      resumeTextFromStorage = localStorage.getItem('userResume') || '';
      
      // If not, try backend
      if (!resumeTextFromStorage) {
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
      }
      
      setResumeText(resumeTextFromStorage);
      
      if (resumeTextFromStorage) {
        predictResumeCategory(resumeTextFromStorage);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    }
  };

  const predictResumeCategory = async (text) => {
    try {
      const response = await axios.post(`${AI_API_URL}/predict/category`, {
        resume_text: text
      });
      setResumeCategory(response.data.predicted_category);
    } catch (error) {
      console.error('Category prediction failed:', error);
    }
  };

  const analyzeMatch = async () => {
    if (!jobDescription) {
      alert('Please paste a job description');
      return;
    }

    if (!resumeText) {
      alert('No resume found! Please upload your resume first.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${AI_API_URL}/predict/match`, {
        resume_text: resumeText,
        job_description: jobDescription,
        job_title: 'Job Position'
      });
      setMatchResult(response.data);
    } catch (error) {
      console.error('Match analysis failed:', error);
      alert('AI Service error. Make sure Python API is running on port 5001');
    }
    setLoading(false);
  };

  const getMatchColorClass = (score) => {
    if (score >= 70) return '#28a745';
    if (score >= 50) return '#17a2b8';
    if (score >= 30) return '#ffc107';
    return '#dc3545';
  };

  const getMatchText = (score) => {
    if (score >= 70) return 'Excellent Match!';
    if (score >= 50) return 'Good Match';
    if (score >= 30) return 'Fair Match';
    return 'Poor Match';
  };

  return (
    <div className="container">
      <h1>Job Match Analyzer</h1>

      {/* AI Status */}
      <div className={`ai-status-badge ${aiStatus}`}>
        {aiStatus === 'online' ? 'AI Service Connected' : 'AI Service Offline'}
      </div>

      {/* Resume Category */}
      {resumeCategory && (
        <div className="resume-category-card">
          <strong>Your Resume Category:</strong> 
          <span className="category-tag">{resumeCategory}</span>
          <p className="hint">AI predicts you're best suited for {resumeCategory} roles</p>
        </div>
      )}

      {/* Resume Warning */}
      {!resumeText && (
        <div className="warning" style={{ background: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          No resume found. Please go to <strong>Upload Resume</strong> page first.
        </div>
      )}

      <div className="matcher-layout">
        {/* Left Column */}
        <div>
          <label className="detail-label">Job Description</label>
          <textarea
            rows={15}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here...  
Example:
Looking for a Python Developer with 3+ years experience in Django, React, and SQL."
            className="job-description-input"
          />

          <button 
            onClick={analyzeMatch}
            disabled={loading || aiStatus === 'offline' || !resumeText}
            className="analyze-btn"
          >
            {loading ? 'Analyzing...' : 'Analyze Match'}
          </button>
        </div>

        {/* Right Column - Results */}
        <div>
          <h3>Match Results</h3>
          
          {matchResult ? (
            <div className="match-card">
              <div className="match-score-circle" style={{ borderColor: getMatchColorClass(matchResult.match_score) }}>
                <span className="score-number">{matchResult.match_score}%</span>
                <span className="score-label">Match</span>
              </div>

              <div className="match-level" style={{ color: getMatchColorClass(matchResult.match_score) }}>
                {getMatchText(matchResult.match_score)}
              </div>

              <div className="detail-item">
                <span className="detail-label">Matching Skills:</span>
                <span>{matchResult.matching_skills} / {matchResult.total_job_skills}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Your Top Skills:</span>
                <div className="skill-tags">
                  {(matchResult.resume_skills || []).map((skill, i) => (
                    <span key={i} className="skill-tag resume-skill">{skill}</span>
                  ))}
                  {(!matchResult.resume_skills || matchResult.resume_skills.length === 0) && (
                    <span className="no-skills">No skills detected</span>
                  )}
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Job Required Skills:</span>
                <div className="skill-tags">
                  {(matchResult.job_skills || []).map((skill, i) => (
                    <span key={i} className="skill-tag job-skill">{skill}</span>
                  ))}
                  {(!matchResult.job_skills || matchResult.job_skills.length === 0) && (
                    <span className="no-skills">No specific skills detected</span>
                  )}
                </div>
              </div>

              <div className="recommendation mt-15" style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                {matchResult.match_score >= 70 && (
                  <p>You're a great fit! Prepare for an interview.</p>
                )}
                {matchResult.match_score >= 50 && matchResult.match_score < 70 && (
                  <p>Good match! Highlight your matching skills in your application.</p>
                )}
                {matchResult.match_score >= 30 && matchResult.match_score < 50 && (
                  <p>Fair match. Consider upskilling in missing areas.</p>
                )}
                {matchResult.match_score < 30 && (
                  <p>Low match. Look for roles that better align with your skills.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="no-results-placeholder">
              <p>| Paste a job description and click "Analyze Match"</p>
              <p className="hint">AI will compare your resume with the job and show match score</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobMatcher;