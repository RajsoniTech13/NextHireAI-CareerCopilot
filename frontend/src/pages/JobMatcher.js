import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AI_API = 'http://localhost:5001';

const JobMatcher = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('checking');

  useEffect(() => {
    checkAI();
    loadResume();
  }, []);

  const checkAI = async () => {
    try {
      await axios.get(`${AI_API}/health`);
      setAiStatus('online');
    } catch { setAiStatus('offline'); }
  };

  const loadResume = () => {
    const local = localStorage.getItem('userResume');
    if (local) setResumeText(local);
  };

  const analyzeMatch = async () => {
    if (!jobDescription) return alert('Paste a job description');
    if (!resumeText) return alert('No resume found. Upload on Resume page first.');
    setLoading(true);
    try {
      // Try new semantic endpoint first
      const res = await axios.post(`${AI_API}/match/semantic`, {
        resume_text: resumeText,
        job_description: jobDescription,
        job_title: jobTitle
      });
      setResult(res.data);
    } catch {
      // Fallback to legacy
      try {
        const res = await axios.post(`${AI_API}/predict/match`, {
          resume_text: resumeText,
          job_description: jobDescription,
          job_title: jobTitle
        });
        setResult(res.data);
      } catch (e) {
        alert('AI service error. Ensure Python API is running.');
      }
    }
    setLoading(false);
  };

  const getScoreColor = (s) => s >= 70 ? '#10b981' : s >= 50 ? '#6366f1' : s >= 30 ? '#f59e0b' : '#ef4444';
  const getScoreBg = (s) => s >= 70 ? 'bg-emerald-50 text-emerald-700' : s >= 50 ? 'bg-brand-50 text-brand-700' : s >= 30 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Job Match Analyzer</h1>
          <p className="text-surface-500 mt-1">AI-powered semantic matching between your resume and job descriptions</p>
        </div>
        <span className={`badge ${aiStatus === 'online' ? 'badge-green' : 'badge-red'}`}>
          {aiStatus === 'online' ? '● AI Online' : '○ AI Offline'}
        </span>
      </div>

      {!resumeText && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          ⚠️ No resume loaded. <a href="/resume" className="underline font-medium">Upload one first</a>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="card p-5">
            <label className="block text-sm font-medium text-surface-700 mb-2">Job Title (optional)</label>
            <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" className="input-field mb-4" />

            <label className="block text-sm font-medium text-surface-700 mb-2">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={14}
              className="input-field font-mono text-xs leading-relaxed resize-none"
            />

            <button onClick={analyzeMatch} disabled={loading || aiStatus === 'offline' || !resumeText} className="btn-primary w-full mt-4">
              {loading ? '⏳ Analyzing with AI...' : '🎯 Analyze Match'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Score Card */}
              <div className="card p-6 text-center">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <svg width="160" height="160" className="score-ring">
                    <circle cx="80" cy="80" r="68" stroke="#e4e4e7" strokeWidth="12" fill="none" />
                    <circle cx="80" cy="80" r="68" stroke={getScoreColor(result.match_score)} strokeWidth="12" fill="none"
                      strokeDasharray={427} strokeDashoffset={427 - (result.match_score / 100) * 427} strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-4xl font-bold" style={{ color: getScoreColor(result.match_score) }}>{result.match_score}%</div>
                    <div className="text-xs text-surface-400">Match</div>
                  </div>
                </div>
                <div className={`inline-block px-4 py-1.5 rounded-full font-semibold text-sm ${getScoreBg(result.match_score)}`}>
                  {result.match_level}
                </div>
                {result.recommendation && <p className="text-sm text-surface-500 mt-3">{result.recommendation}</p>}
              </div>

              {/* Breakdown */}
              {result.breakdown && (
                <div className="card p-5">
                  <h4 className="font-semibold text-surface-900 mb-3">📊 Score Breakdown</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Overall Similarity', val: result.breakdown.overall_similarity },
                      { label: 'Skills Match', val: result.breakdown.skills_match },
                      { label: 'Experience Match', val: result.breakdown.experience_match },
                    ].map((b, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-surface-600">{b.label}</span>
                          <span className="font-medium">{b.val}%</span>
                        </div>
                        <div className="w-full bg-surface-100 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${b.val}%`, backgroundColor: getScoreColor(b.val) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Comparison */}
              {result.skill_analysis && (
                <div className="card p-5">
                  <h4 className="font-semibold text-surface-900 mb-3">🛠️ Skill Analysis</h4>
                  {result.skill_analysis.matching_skills?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-emerald-600 mb-1.5">✅ Matching Skills</p>
                      <div className="flex flex-wrap gap-1.5">{result.skill_analysis.matching_skills.map((s,i) => <span key={i} className="badge-green">{s}</span>)}</div>
                    </div>
                  )}
                  {result.skill_analysis.missing_skills?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-red-600 mb-1.5">❌ Missing Skills (Skill Gap)</p>
                      <div className="flex flex-wrap gap-1.5">{result.skill_analysis.missing_skills.map((s,i) => <span key={i} className="badge-red">{s}</span>)}</div>
                    </div>
                  )}
                  {result.skill_analysis.extra_skills?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-600 mb-1.5">➕ Your Extra Skills</p>
                      <div className="flex flex-wrap gap-1.5">{result.skill_analysis.extra_skills.map((s,i) => <span key={i} className="badge-blue">{s}</span>)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Legacy skill display */}
              {!result.skill_analysis && (result.resume_skills?.length > 0 || result.job_skills?.length > 0) && (
                <div className="card p-5">
                  <h4 className="font-semibold text-surface-900 mb-3">🛠️ Skills Detected</h4>
                  {result.resume_skills?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-surface-500 mb-1.5">Your Skills</p>
                      <div className="flex flex-wrap gap-1.5">{result.resume_skills.map((s,i) => <span key={i} className="badge-green">{s}</span>)}</div>
                    </div>
                  )}
                  {result.job_skills?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-surface-500 mb-1.5">Job Requires</p>
                      <div className="flex flex-wrap gap-1.5">{result.job_skills.map((s,i) => <span key={i} className="badge-yellow">{s}</span>)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {result.explanation?.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-semibold text-surface-900 mb-3">💬 AI Explanation</h4>
                  <ul className="space-y-2">
                    {result.explanation.map((e, i) => (
                      <li key={i} className="text-sm text-surface-600 flex gap-2">
                        <span className="text-brand-500 flex-shrink-0">→</span>{e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-5xl mb-4">🎯</p>
              <h3 className="text-lg font-semibold text-surface-700">Paste a job description</h3>
              <p className="text-sm text-surface-400 mt-2">Our AI will semantically analyze how well your resume matches the role, provide a score breakdown, and identify skill gaps.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobMatcher;