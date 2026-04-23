// frontend/src/pages/Applications.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const Applications = () => {
    const [apps, setApps] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ company: '', position: '', status: 'applied' });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        if (token) {
            fetchApps();
        } else {
            setLoading(false);
            setMessage('Please login first');
        }
    }, []);

    const fetchApps = async () => {
        try {
            console.log('Fetching applications...');
            const res = await axios.get(`${API_URL}/api/applications`, {
                headers: { 'x-auth-token': token }
            });
            console.log('Applications fetched:', res.data);
            setApps(res.data);
        } catch (error) {
            console.error('Fetch error:', error.response?.data || error.message);
            setMessage('Error loading applications');
        }
        setLoading(false);
    };

    const addApp = async (e) => {
        e.preventDefault();
        
        console.log('Form data:', form);
        
        if (!form.company || !form.position) {
            setMessage('Please fill all fields');
            setTimeout(() => setMessage(''), 2000);
            return;
        }

        try {
            console.log('Sending POST request to:', `${API_URL}/api/applications`);
            console.log('With data:', {
                company: form.company,
                position: form.position,
                status: form.status
            });
            console.log('With token:', token);
            
            const res = await axios.post(
                `${API_URL}/api/applications`,
                {
                    company: form.company,
                    position: form.position,
                    status: form.status
                },
                { headers: { 'x-auth-token': token } }
            );
            
            console.log('Response:', res.data);
            
            setMessage('Application added!');
            setForm({ company: '', position: '', status: 'applied' });
            setShowForm(false);
            fetchApps();
            setTimeout(() => setMessage(''), 2000);
        } catch (error) {
            console.error('ERROR DETAILS:');
            console.error('Message:', error.message);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            console.error('Full error:', error);
            
            setMessage(`Error: ${error.response?.data?.error || error.message}`);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const deleteApp = async (id) => {
        if (window.confirm('Delete this application?')) {
            try {
                await axios.delete(`${API_URL}/api/applications/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                fetchApps();
                setMessage('Deleted Successfully');
                setTimeout(() => setMessage(''), 2000);
            } catch (error) {
                console.error('Delete error:', error);
                setMessage('Delete failed');
                setTimeout(() => setMessage(''), 2000);
            }
        }
    };

    if (!token) {
        return (
            <div className="container text-center" style={{ padding: '50px' }}>
                <div className="card">
                    <h2>Please Login</h2>
                    <button onClick={() => window.location.href = '/login'}>Login</button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="text-center" style={{ padding: '50px' }}>Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1>Applications</h1>
                <button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add'}
                </button>
            </div>

            {message && (
                <div className={message.includes('| ') ? 'success' : 'error'}>
                    {message}
                </div>
            )}

            {showForm && (
                <div className="card">
                    <h3>New Application</h3>
                    <form onSubmit={addApp}>
                        <input
                            type="text"
                            placeholder="Company"
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Position"
                            value={form.position}
                            onChange={(e) => setForm({ ...form, position: e.target.value })}
                            required
                        />
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="applied">Applied</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offered</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <button type="submit">Save</button>
                    </form>
                </div>
            )}

            <div className="card">
                {apps.length === 0 ? (
                    <p>No applications yet</p>
                ) : (
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Position</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {apps.map(app => (
                                <tr key={app._id}>
                                    <td>{app.company}</td>
                                    <td>{app.position}</td>
                                    <td>{app.status}</td>
                                    <td>{new Date(app.date).toLocaleDateString()}</td>
                                    <td>
                                        <button onClick={() => deleteApp(app._id)} style={{ background: '#e74c3c' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Applications;