import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5002';
const AI_API = 'http://localhost:5001';

const ScoreRing = ({ score, size = 120, strokeWidth = 10 }) => {
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
        <div className="text-2xl font-bold" style={{ color }}>{score}</div>
        <div className="text-xs text-surface-400">ATS Score</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, applied: 0, interview: 0, offered: 0, rejected: 0 });
  const [resume, setResume] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const token = localStorage.getItem('token');
  const headers = { 'x-auth-token': token };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadUser(), loadStats(), loadResume()]);
    setLoading(false);
  };

  const loadUser = async () => {
    try {
      const res = await axios.get(`${API}/api/auth/user`, { headers });
      setUser(res.data);
    } catch (e) { console.error(e); }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API}/api/applications/stats`, { headers });
      setStats(res.data);
    } catch (e) { console.error(e); }
  };

  const loadResume = async () => {
    try {
      const res = await axios.get(`${API}/api/resume`, { headers });
      if (res.data?.resume || res.data?.rawText) {
        const r = res.data.resume || res.data;
        setResume(r);
        if (r.analysis?.predictedCategory) setCategory(r.analysis.predictedCategory);
        loadAI(r.rawText);
      } else {
        const local = localStorage.getItem('userResume');
        if (local) loadAI(local);
      }
    } catch (e) {
      const local = localStorage.getItem('userResume');
      if (local) loadAI(local);
    }
  };

  const loadAI = async (text) => {
    if (!text) return;
    setAiLoading(true);
    try {
      const catRes = await axios.post(`${AI_API}/predict/category`, { resume_text: text });
      setCategory(catRes.data.predicted_category);

      const jobs = [
        { id: 1, title: 'Software Engineer', description: 'Python, Django, React, SQL, AWS, JavaScript, Docker' },
        { id: 2, title: 'Data Scientist', description: 'Python, Machine Learning, SQL, Pandas, NumPy, TensorFlow' },
        { id: 3, title: 'Full Stack Developer', description: 'React, Node.js, MongoDB, JavaScript, TypeScript' },
        { id: 4, title: 'DevOps Engineer', description: 'AWS, Docker, Kubernetes, Jenkins, Linux, Terraform' },
        { id: 5, title: 'Backend Developer', description: 'Python, Django, Flask, PostgreSQL, REST APIs, Redis' },
      ];

      const matchRes = await axios.post(`${AI_API}/predict/batch`, { resume_text: text, jobs });
      setRecommendations(matchRes.data.recommendations || []);
    } catch (e) { console.error('AI error:', e); }
    setAiLoading(false);
  };

  const getMatchColor = (score) => {
    if (score >= 70) return 'text-emerald-600 bg-emerald-50';
    if (score >= 50) return 'text-brand-600 bg-brand-50';
    if (score >= 30) return 'text-amber-600 bg-amber-50';
    return 'text-red-500 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-brand-600 mx-auto mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <p className="text-surface-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="gradient-dark rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user?.name || 'User'} 👋</h1>
          <p className="text-indigo-200 mt-2">
            {category ? (
              <>Your AI profile: <span className="font-semibold text-white bg-white/20 px-3 py-1 rounded-full text-sm">{category}</span></>
            ) : 'Upload a resume to unlock AI-powered career insights'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: '📊', color: 'text-surface-700' },
          { label: 'Applied', value: stats.applied, icon: '📨', color: 'text-blue-600' },
          { label: 'Interview', value: stats.interview, icon: '🎙️', color: 'text-amber-600' },
          { label: 'Offered', value: stats.offered, icon: '🎉', color: 'text-emerald-600' },
          { label: 'Rejected', value: stats.rejected, icon: '❌', color: 'text-red-500' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="text-lg">{s.icon}</span>
            <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-sm text-surface-500">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Resume Score */}
        <div className="card p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-medium text-surface-500 mb-4">Resume ATS Score</h3>
          {resume?.analysis?.atsScore ? (
            <>
              <ScoreRing score={resume.analysis.atsScore} />
              <p className="mt-3 text-sm text-surface-500">
                {resume.analysis.atsScore >= 70 ? 'Great resume!' : resume.analysis.atsScore >= 50 ? 'Room for improvement' : 'Needs work'}
              </p>
              <a href="/resume" className="btn-primary mt-4 text-xs px-4 py-2">Improve Score</a>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">📄</p>
              <p className="text-sm text-surface-500 mb-3">Upload your resume for an ATS score</p>
              <a href="/resume" className="btn-primary text-xs px-4 py-2">Upload Resume</a>
            </div>
          )}
        </div>

        {/* AI Job Recommendations */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">AI Job Recommendations</h3>
            {aiLoading && <span className="badge-blue text-xs">Analyzing...</span>}
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((job, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div>
                    <p className="font-medium text-surface-900">{job.job_title}</p>
                    <p className="text-xs text-surface-500">{job.match_level}</p>
                  </div>
                  <span className={`text-lg font-bold px-3 py-1 rounded-lg ${getMatchColor(job.match_score)}`}>
                    {job.match_score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-sm text-surface-500">
                {aiLoading ? 'AI is analyzing your profile...' : 'Upload a resume to get AI recommendations'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/resume', icon: '📄', title: 'Analyze Resume', desc: 'Get ATS score & AI insights', color: 'from-indigo-500 to-purple-500' },
          { href: '/jobs', icon: '🎯', title: 'Match Jobs', desc: 'Semantic AI job matching', color: 'from-emerald-500 to-teal-500' },
          { href: '/applications', icon: '📋', title: 'Track Applications', desc: 'Kanban-style tracker', color: 'from-amber-500 to-orange-500' },
        ].map((action, i) => (
          <a key={i} href={action.href}
            className="card p-5 group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white text-lg mb-3 group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <h4 className="font-semibold text-surface-900">{action.title}</h4>
            <p className="text-sm text-surface-500 mt-1">{action.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;