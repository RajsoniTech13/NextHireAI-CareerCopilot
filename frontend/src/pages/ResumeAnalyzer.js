import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5002';
const AI_API = 'http://localhost:5001';

const ScoreRing = ({ score, size = 160, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#6366f1' : score >= 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="score-ring">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e4e4e7" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-bold" style={{ color }}>{score}</div>
        <div className="text-sm text-surface-400">ATS Score</div>
      </div>
    </div>
  );
};

const SAMPLE_RESUME = `John Doe
Software Engineer

SUMMARY
Experienced Python Developer with 5+ years of experience in full-stack development.
Strong background in building scalable web applications and RESTful APIs.

TECHNICAL SKILLS
- Programming Languages: Python, JavaScript, Java, SQL
- Frameworks: Django, Flask, React, Node.js
- Databases: PostgreSQL, MongoDB, MySQL
- Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Git, Jenkins

WORK EXPERIENCE
Senior Software Engineer | Tech Corp | 2020-Present
- Developed REST APIs using Django and Django REST Framework
- Built React frontend components serving 50K+ users
- Implemented CI/CD pipeline reducing deployment time by 40%

Junior Developer | StartupXYZ | 2018-2020
- Built microservices using Flask and PostgreSQL
- Improved system performance by 30% through query optimization

EDUCATION
Bachelor of Technology in Computer Science
University of Technology | 2014-2018`;

const ResumeAnalyzer = () => {
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [existingResume, setExistingResume] = useState(null);
  const token = localStorage.getItem('token');
  const headers = { 'x-auth-token': token };

  useEffect(() => { loadExisting(); }, []);

  const loadExisting = async () => {
    try {
      const res = await axios.get(`${API}/api/resume`, { headers });
      if (res.data?.rawText || res.data?.resume?.rawText) {
        const r = res.data.resume || res.data;
        setExistingResume(r);
        setResumeText(r.rawText);
        if (r.analysis?.atsScore) setAnalysis(r.analysis);
      } else {
        const local = localStorage.getItem('userResume');
        if (local) setResumeText(local);
      }
    } catch (e) {
      const local = localStorage.getItem('userResume');
      if (local) setResumeText(local);
    }
  };

  const analyzeResume = async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      setMessage({ type: 'error', text: 'Please paste at least 50 characters of resume text.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${AI_API}/analyze/resume`, { resume_text: resumeText });
      setAnalysis(res.data);
      setMessage({ type: 'success', text: 'Resume analyzed successfully!' });
    } catch (e) {
      // Fallback to legacy
      try {
        const catRes = await axios.post(`${AI_API}/predict/category`, { resume_text: resumeText });
        setAnalysis({ atsScore: 0, predictedCategory: catRes.data.predicted_category, strengths: [], weaknesses: [], suggestions: ['AI analysis service loading. Try again.'] });
      } catch (e2) {
        setMessage({ type: 'error', text: 'AI service unavailable. Make sure Python API is running on port 5001.' });
      }
    }
    setLoading(false);
  };

  const saveResume = async () => {
    if (!resumeText) return;
    setUploading(true);
    localStorage.setItem('userResume', resumeText);
    try {
      await axios.post(`${API}/api/resume/upload`, { resumeText }, { headers });
      setMessage({ type: 'success', text: 'Resume saved to database!' });
    } catch (e) {
      setMessage({ type: 'success', text: 'Resume saved locally. AI features will work.' });
    }
    setUploading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Resume Analyzer</h1>
        <p className="text-surface-500 mt-1">Get your ATS score, AI insights, and improvement suggestions</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm animate-slide-down ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>{message.text}</div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <label className="block text-sm font-medium text-surface-700 mb-2">Paste your resume text</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content here..."
              rows={16}
              className="input-field font-mono text-xs leading-relaxed resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={analyzeResume} disabled={loading} className="btn-primary flex-1">
                {loading ? '⏳ Analyzing...' : '🔍 Analyze Resume'}
              </button>
              <button onClick={saveResume} disabled={uploading} className="btn-secondary">
                {uploading ? '...' : '💾 Save'}
              </button>
            </div>
            <button onClick={() => setResumeText(SAMPLE_RESUME)} className="btn-ghost w-full mt-2 text-xs">
              📝 Use Sample Resume
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-3 space-y-4">
          {analysis ? (
            <>
              {/* Score + Category */}
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ScoreRing score={analysis.atsScore || analysis.ats_score || 0} />
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-lg font-semibold text-surface-900">
                      {(analysis.atsScore || analysis.ats_score || 0) >= 70 ? '🎉 Great Resume!' :
                       (analysis.atsScore || analysis.ats_score || 0) >= 50 ? '👍 Good, can improve' : '⚠️ Needs improvement'}
                    </h3>
                    {(analysis.predictedCategory || analysis.predicted_category) && (
                      <div className="mt-2">
                        <span className="text-sm text-surface-500">Predicted Career: </span>
                        <span className="badge-purple">{analysis.predictedCategory || analysis.predicted_category}</span>
                      </div>
                    )}
                    {analysis.word_count && <p className="text-xs text-surface-400 mt-2">{analysis.word_count} words</p>}
                  </div>
                </div>
              </div>

              {/* Skills */}
              {(analysis.skills?.technical?.length > 0 || analysis.parsedData?.skills?.technical?.length > 0) && (
                <div className="card p-5">
                  <h4 className="font-semibold text-surface-900 mb-3">🛠️ Detected Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.skills?.technical || analysis.parsedData?.skills?.technical || []).map((s, i) => (
                      <span key={i} className="badge-blue">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid sm:grid-cols-2 gap-4">
                {(analysis.strengths?.length > 0) && (
                  <div className="card p-5">
                    <h4 className="font-semibold text-emerald-700 mb-3">✅ Strengths</h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-surface-700 flex gap-2">
                          <span className="text-emerald-500 flex-shrink-0">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(analysis.weaknesses?.length > 0) && (
                  <div className="card p-5">
                    <h4 className="font-semibold text-red-600 mb-3">⚠️ Weaknesses</h4>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((s, i) => (
                        <li key={i} className="text-sm text-surface-700 flex gap-2">
                          <span className="text-red-400 flex-shrink-0">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {analysis.suggestions?.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-semibold text-brand-700 mb-3">💡 Improvement Suggestions</h4>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-surface-700 flex gap-2 p-2 rounded-lg bg-brand-50/50">
                        <span className="text-brand-500 flex-shrink-0 font-bold">{i+1}.</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-5xl mb-4">📄</p>
              <h3 className="text-lg font-semibold text-surface-700">Paste your resume to begin</h3>
              <p className="text-sm text-surface-400 mt-2">Our AI will analyze your resume and provide a detailed ATS score, skill extraction, and improvement suggestions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
