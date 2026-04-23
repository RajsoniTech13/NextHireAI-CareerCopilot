import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import JobMatcher from './pages/JobMatcher';
import Profile from './pages/Profile';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/resume', label: 'Resume', icon: '📄' },
  { path: '/jobs', label: 'Job Matcher', icon: '🎯' },
  { path: '/applications', label: 'Applications', icon: '📋' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

const Navbar = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (['/login', '/register', '/'].includes(location.pathname)) return null;
  if (!token) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userResume');
    window.location.href = '/login';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-glow group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              NextHireAI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <button onClick={handleLogout} className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600">
            Logout
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-surface-200 px-2 py-1 flex overflow-x-auto gap-1">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              location.pathname === item.path
                ? 'bg-brand-50 text-brand-700'
                : 'text-surface-500 hover:bg-surface-100'
            }`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return <div className="pt-20 md:pt-16 min-h-screen">{children}</div>;
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobMatcher /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;