import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Wrench, FileText } from 'lucide-react';

const API = 'http://localhost:5002';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeHistory, setResumeHistory] = useState([]);
  const token = localStorage.getItem('token');
  const headers = { 'x-auth-token': token };

  useEffect(() => { loadProfile(); loadResumeHistory(); }, []);

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${API}/api/auth/profile`, { headers });
      setProfile(res.data);
      setSkills(res.data.skills?.join(', ') || '');
      setHeadline(res.data.headline || '');
      setLocation(res.data.location || '');
      setExperience(res.data.experience || '');
    } catch (e) { setMessage({ type: 'error', text: 'Error loading profile' }); }
    setLoading(false);
  };

  const loadResumeHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/resume/history`, { headers });
      setResumeHistory(res.data);
    } catch (e) { console.error(e); }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(`${API}/api/auth/profile`, { skills, headline, location, experience }, { headers });
      setProfile(res.data);
      setMessage({ type: 'success', text: 'Profile updated!' });
    } catch (e) { setMessage({ type: 'error', text: 'Error updating profile' }); }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">My Profile</h1>
        <p className="text-surface-500 mt-1">Manage your career profile and preferences</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm animate-slide-down ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message.text}</div>
      )}

      {/* Profile Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 gradient-brand rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-glow">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900">{profile?.name || 'User'}</h2>
            <p className="text-sm text-surface-500">{profile?.email}</p>
            {profile?.headline && <p className="text-sm text-surface-600 mt-0.5">{profile.headline}</p>}
          </div>
        </div>

        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Headline</label>
            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Full Stack Developer | React | Node.js" className="input-field" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Experience Level</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value)} className="input-field">
                <option value="">Select...</option>
                <option value="fresher">Fresher (0-1 years)</option>
                <option value="junior">Junior (1-3 years)</option>
                <option value="mid">Mid-Level (3-5 years)</option>
                <option value="senior">Senior (5-8 years)</option>
                <option value="lead">Lead (8+ years)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Skills (comma separated)</label>
            <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Python, JavaScript, React, Node.js" className="input-field" />
            <p className="text-xs text-surface-400 mt-1">Add skills for better AI job recommendations</p>
          </div>

          <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2">
            {saving ? 'Saving...' : <><Save size={18} /> Update Profile</>}
          </button>
        </form>
      </div>

      {/* Current Skills */}
      {profile?.skills?.length > 0 && (
        <div className="card p-5 mb-6">
          <h4 className="font-semibold text-surface-900 mb-3 flex items-center gap-2"><Wrench className="text-surface-500" size={20} /> Your Skills</h4>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s, i) => <span key={i} className="badge-blue">{s}</span>)}
          </div>
        </div>
      )}

      {/* Resume History */}
      {resumeHistory.length > 0 && (
        <div className="card p-5">
          <h4 className="font-semibold text-surface-900 mb-3 flex items-center gap-2"><FileText className="text-surface-500" size={20} /> Resume History</h4>
          <div className="space-y-2">
            {resumeHistory.map((r, i) => (
              <div key={r._id || i} className="flex items-center justify-between p-3 rounded-lg bg-surface-50">
                <div>
                  <p className="text-sm font-medium text-surface-900">{r.fileName || `Resume v${r.version}`}</p>
                  <p className="text-xs text-surface-500">
                    {r.analysis?.predictedCategory && <span className="badge-purple mr-2">{r.analysis.predictedCategory}</span>}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.analysis?.atsScore > 0 && (
                    <span className={`text-sm font-bold ${r.analysis.atsScore >= 70 ? 'text-emerald-600' : r.analysis.atsScore >= 50 ? 'text-brand-600' : 'text-amber-600'}`}>
                      {r.analysis.atsScore}%
                    </span>
                  )}
                  {r.isActive && <span className="badge-green">Active</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;