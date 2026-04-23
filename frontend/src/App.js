// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import AIDashboard from './pages/JS AIDashboard';
import JobMatcher from './pages/JobMatcher';
import Profile from './pages/Profile';
import UploadResume from './pages/UploadResume';

// Navigation Bar Component
const Navbar = () => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    // Don't show navbar on login/register pages
    if (location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userResume');
        window.location.href = '/login';
    };

    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/dashboard" className="logo">| JobAssistant</Link>
                <div className="nav-links">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/upload-resume">Upload Resume</Link>
                    <Link to="/applications">Applications</Link>
                    <Link to="/ai-dashboard">AI Dashboard</Link>
                    <Link to="/job-matcher">Job Matcher</Link>
                    <Link to="/profile">Profile</Link>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </div>
        </nav>
    );
};

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
                <Route path="/ai-dashboard" element={<ProtectedRoute><AIDashboard /></ProtectedRoute>} />
                <Route path="/job-matcher" element={<ProtectedRoute><JobMatcher /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/upload-resume" element={<ProtectedRoute><UploadResume /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;