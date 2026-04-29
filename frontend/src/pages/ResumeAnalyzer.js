import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'paste'
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const fileInputRef = useRef(null);
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

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setMessage({ type: 'error', text: `Unsupported file type: ${ext}. Allowed: PDF, DOCX, TXT` });
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 16MB.' });
      return;
    }
    setSelectedFile(file);
    setMessage(null);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Upload PDF and analyze directly
  const analyzeFile = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    setParseProgress('Uploading file...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setParseProgress('Parsing document & running AI analysis...');
      const res = await axios.post(`${AI_API}/analyze/resume-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      const data = res.data;
      // Set the extracted text so user can see and edit it
      if (data.raw_text) {
        setResumeText(data.raw_text);
        localStorage.setItem('userResume', data.raw_text);
      }

      setAnalysis(data);
      setMessage({ type: 'success', text: `✅ "${selectedFile.name}" parsed and analyzed successfully!` });
      setParseProgress('');

      // Also save to backend
      if (data.raw_text) {
        try {
          await axios.post(`${API}/api/resume/upload`, {
            resumeText: data.raw_text,
            fileName: selectedFile.name
          }, { headers });
        } catch (e) { /* silent fallback */ }
      }
    } catch (e) {
      console.error('File analysis error:', e);
      // Fallback: try the /analyze/resume endpoint with file field
      try {
        setParseProgress('Trying alternate parsing...');
        const res2 = await axios.post(`${AI_API}/analyze/resume`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });
        const data = res2.data;
        if (data.raw_text) {
          setResumeText(data.raw_text);
          localStorage.setItem('userResume', data.raw_text);
        }
        setAnalysis(data);
        setMessage({ type: 'success', text: `✅ "${selectedFile.name}" analyzed successfully!` });
      } catch (e2) {
        setMessage({
          type: 'error',
          text: `Failed to parse file. ${e.response?.data?.error || 'Ensure AI service is running on port 5001 with pdfplumber installed.'}`
        });
      }
      setParseProgress('');
    }
    setLoading(false);
  };

  // Analyze pasted text
  const analyzeText = async () => {
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
      try {
        const catRes = await axios.post(`${AI_API}/predict/category`, { resume_text: resumeText });
        setAnalysis({
          atsScore: 0,
          predictedCategory: catRes.data.predicted_category,
          strengths: [], weaknesses: [],
          suggestions: ['AI analysis service loading. Try again.']
        });
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

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Resume Analyzer</h1>
        <p className="text-surface-500 mt-1">Upload your PDF/DOCX or paste text — get ATS score, AI insights, and improvement suggestions</p>
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
          {/* Mode Toggle */}
          <div className="flex bg-surface-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setInputMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                inputMode === 'upload'
                  ? 'bg-white shadow-sm text-brand-700 ring-1 ring-brand-200'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <span>📎</span> Upload File
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                inputMode === 'paste'
                  ? 'bg-white shadow-sm text-brand-700 ring-1 ring-brand-200'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <span>📝</span> Paste Text
            </button>
          </div>

          {/* Upload Mode */}
          {inputMode === 'upload' && (
            <div className="card p-5 space-y-4">
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? 'border-brand-500 bg-brand-50/50 scale-[1.02]'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-surface-300 hover:border-brand-400 hover:bg-brand-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center">
                      <span className="text-2xl">
                        {selectedFile.name.endsWith('.pdf') ? '📕' :
                         selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc') ? '📘' : '📄'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900 text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      ✕ Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-brand-50 flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-700">
                        <span className="text-brand-600 font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-surface-400 mt-1">PDF, DOCX, or TXT (max 16MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress indicator */}
              {loading && parseProgress && (
                <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
                  <svg className="animate-spin h-4 w-4 text-brand-600 flex-shrink-0" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="text-sm text-brand-700 font-medium">{parseProgress}</span>
                </div>
              )}

              <button
                onClick={analyzeFile}
                disabled={loading || !selectedFile}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analyzing...
                  </>
                ) : '🔍 Upload & Analyze'}
              </button>

              {/* Show extracted text preview if available */}
              {resumeText && inputMode === 'upload' && analysis && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-surface-500">Extracted Text Preview</label>
                    <button
                      onClick={() => setInputMode('paste')}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Edit text →
                    </button>
                  </div>
                  <div className="bg-surface-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <p className="text-xs text-surface-600 font-mono whitespace-pre-wrap line-clamp-6">
                      {resumeText.substring(0, 500)}{resumeText.length > 500 ? '...' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paste Mode */}
          {inputMode === 'paste' && (
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
                <button onClick={analyzeText} disabled={loading} className="btn-primary flex-1">
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
          )}
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

              {/* Section Scores */}
              {analysis.section_scores && Object.keys(analysis.section_scores).length > 0 && (
                <div className="card p-5">
                  <h4 className="font-semibold text-surface-900 mb-3">📋 Section Coverage</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(analysis.section_scores).map(([section, status]) => (
                      <div key={section} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                        status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        <span>{status === 'Present' ? '✅' : '❌'}</span>
                        <span className="font-medium capitalize">{section}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center mb-4">
                <span className="text-4xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-surface-700">Upload or paste your resume</h3>
              <p className="text-sm text-surface-400 mt-2 max-w-sm mx-auto">
                Upload a PDF/DOCX file or paste text. Our AI will analyze your resume and provide a detailed ATS score, skill extraction, and improvement suggestions.
              </p>
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-xs text-surface-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> PDF Support
                </div>
                <div className="flex items-center gap-2 text-xs text-surface-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> DOCX Support
                </div>
                <div className="flex items-center gap-2 text-xs text-surface-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span> Text Paste
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
