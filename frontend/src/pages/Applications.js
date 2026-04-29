import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bookmark, Briefcase, Mic, CheckCircle, XCircle, CornerUpLeft, ClipboardList, List, MapPin } from 'lucide-react';

const API = 'http://localhost:5002';

const STATUS_CONFIG = {
  saved:     { label: 'Saved',     color: 'badge-gray',   icon: <Bookmark size={16} /> },
  applied:   { label: 'Applied',   color: 'badge-blue',   icon: <Briefcase size={16} /> },
  interview: { label: 'Interview', color: 'badge-yellow', icon: <Mic size={16} /> },
  offered:   { label: 'Offered',   color: 'badge-green',  icon: <CheckCircle size={16} /> },
  rejected:  { label: 'Rejected',  color: 'badge-red',    icon: <XCircle size={16} /> },
  withdrawn: { label: 'Withdrawn', color: 'badge-gray',   icon: <CornerUpLeft size={16} /> },
};
const STATUSES = Object.keys(STATUS_CONFIG);

const Applications = () => {
  const [apps, setApps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ company: '', position: '', status: 'applied', location: '', salary: '', notes: '', jobUrl: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [view, setView] = useState('kanban'); // 'kanban' or 'list'
  const [filter, setFilter] = useState('all');
  const token = localStorage.getItem('token');
  const headers = { 'x-auth-token': token };

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    try {
      const res = await axios.get(`${API}/api/applications`, { headers });
      setApps(res.data);
    } catch (e) { setMessage({ type: 'error', text: 'Error loading applications' }); }
    setLoading(false);
  };

  const saveApp = async (e) => {
    e.preventDefault();
    if (!form.company || !form.position) return;
    try {
      if (editingId) {
        await axios.put(`${API}/api/applications/${editingId}`, form, { headers });
        setMessage({ type: 'success', text: 'Updated!' });
      } else {
        await axios.post(`${API}/api/applications`, form, { headers });
        setMessage({ type: 'success', text: 'Application added!' });
      }
      setForm({ company: '', position: '', status: 'applied', location: '', salary: '', notes: '', jobUrl: '' });
      setShowForm(false);
      setEditingId(null);
      fetchApps();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Error saving' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteApp = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await axios.delete(`${API}/api/applications/${id}`, { headers });
      fetchApps();
      setMessage({ type: 'success', text: 'Deleted' });
    } catch { setMessage({ type: 'error', text: 'Delete failed' }); }
    setTimeout(() => setMessage(null), 2000);
  };

  const editApp = (app) => {
    setForm({ company: app.company, position: app.position, status: app.status, location: app.location || '', salary: app.salary || '', notes: app.notes || '', jobUrl: app.jobUrl || '' });
    setEditingId(app._id);
    setShowForm(true);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API}/api/applications/${id}`, { status: newStatus }, { headers });
      fetchApps();
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Application Tracker</h1>
          <p className="text-surface-500 mt-1">{apps.length} total applications</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-surface-100 rounded-lg p-0.5">
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'kanban' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'}`}><span className="flex items-center gap-1"><ClipboardList size={14} /> Kanban</span></button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'list' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'}`}><span className="flex items-center gap-1"><List size={14} /> List</span></button>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ company: '', position: '', status: 'applied', location: '', salary: '', notes: '', jobUrl: '' }); }} className="btn-primary text-sm">
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm animate-slide-down ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message.text}</div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card p-5 mb-6 animate-slide-down">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Application' : 'New Application'}</h3>
          <form onSubmit={saveApp} className="grid sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Company *" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} required className="input-field" />
            <input type="text" placeholder="Position *" value={form.position} onChange={(e) => setForm({...form, position: e.target.value})} required className="input-field" />
            <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="input-field" />
            <input type="text" placeholder="Salary" value={form.salary} onChange={(e) => setForm({...form, salary: e.target.value})} className="input-field" />
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="input-field">
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
            <input type="url" placeholder="Job URL (optional)" value={form.jobUrl} onChange={(e) => setForm({...form, jobUrl: e.target.value})} className="input-field" />
            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="input-field sm:col-span-2" rows={2} />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add Application'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
          {['applied', 'interview', 'offered', 'rejected'].map(status => (
            <div key={status} className="min-w-[220px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span>{STATUS_CONFIG[status].icon}</span>
                <h4 className="text-sm font-semibold text-surface-700">{STATUS_CONFIG[status].label}</h4>
                <span className="badge-gray text-xs">{apps.filter(a => a.status === status).length}</span>
              </div>
              <div className="space-y-2">
                {apps.filter(a => a.status === status).map(app => (
                  <div key={app._id} className="card p-3 cursor-pointer group" onClick={() => editApp(app)}>
                    <p className="font-medium text-sm text-surface-900 truncate">{app.position}</p>
                    <p className="text-xs text-surface-500 truncate">{app.company}</p>
                    {app.location && <p className="text-xs text-surface-400 mt-1 flex items-center gap-1"><MapPin size={12} /> {app.location}</p>}
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {STATUSES.filter(s => s !== status && !['saved','withdrawn'].includes(s)).map(s => (
                        <button key={s} onClick={(e) => { e.stopPropagation(); updateStatus(app._id, s); }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 hover:bg-surface-200 text-surface-600">
                          → {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {apps.filter(a => a.status === status).length === 0 && (
                  <div className="border-2 border-dashed border-surface-200 rounded-lg p-4 text-center text-xs text-surface-400">
                    No {STATUS_CONFIG[status].label.toLowerCase()} apps
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          {/* Filter pills */}
          <div className="p-3 border-b border-surface-100 flex gap-1 flex-wrap">
            {['all', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === s ? 'bg-brand-100 text-brand-700' : 'text-surface-500 hover:bg-surface-100'}`}>
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-surface-400">No applications found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Company</th>
                  <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Position</th>
                  <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-surface-500 px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(app => (
                    <tr key={app._id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-surface-900">{app.company}</td>
                      <td className="px-4 py-3 text-sm text-surface-700">{app.position}</td>
                      <td className="px-4 py-3"><span className={STATUS_CONFIG[app.status]?.color || 'badge-gray'}>{STATUS_CONFIG[app.status]?.label || app.status}</span></td>
                      <td className="px-4 py-3 text-xs text-surface-500">{new Date(app.appliedDate || app.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => editApp(app)} className="text-xs text-brand-600 hover:text-brand-700 mr-3">Edit</button>
                        <button onClick={() => deleteApp(app._id)} className="text-xs text-red-500 hover:text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;