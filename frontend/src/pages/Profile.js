// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const Profile = () => {
    const [profile, setProfile] = useState({ name: '', email: '', skills: [] });
    const [skills, setSkills] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/profile`, {
                headers: { 'x-auth-token': token }
            });
            setProfile(res.data);
            setSkills(res.data.skills ? res.data.skills.join(', ') : '');
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage('Error loading profile');
            setMessageType('error');
        }
        setLoading(false);
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        
        try {
            const res = await axios.put(`${API_URL}/api/auth/profile`, 
                { skills: skills },
                { headers: { 'x-auth-token': token } }
            );
            
            if (res.data) {
                setMessage('Profile updated successfully!');
                setMessageType('success');
                fetchProfile(); // Refresh profile data
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Error updating profile');
            setMessageType('error');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (!token) {
        return (
            <div className="container text-center" style={{ padding: '50px' }}>
                <div className="card">
                    <h2>Please Login First</h2>
                    <button onClick={() => window.location.href = '/login'}>Go to Login</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="text-center" style={{ padding: '50px' }}>Loading...</div>;
    }

    return (
        <div className="container">
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <h1>My Profile</h1>
                
                {message && (
                    <div className={messageType === 'success' ? 'success' : 'error'}>
                        {message}
                    </div>
                )}
                
                <form onSubmit={updateProfile}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Name</label>
                        <input 
                            type="text" 
                            value={profile.name || ''} 
                            disabled 
                            style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Email</label>
                        <input 
                            type="email" 
                            value={profile.email || ''} 
                            disabled 
                            style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Skills (comma separated)</label>
                        <input
                            type="text"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="e.g., Python, JavaScript, React, MongoDB"
                            style={{ width: '100%', padding: '10px' }}
                        />
                        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                            Add your skills to get better AI job recommendations
                        </small>
                    </div>
                    
                    <button type="submit" style={{ width: '100%' }}>
                        Update Profile
                    </button>
                </form>

                {/* Display current skills as tags */}
                {profile.skills && profile.skills.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Your Current Skills:</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {profile.skills.map((skill, index) => (
                                <span key={index} className="skill-tag resume-skill">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;