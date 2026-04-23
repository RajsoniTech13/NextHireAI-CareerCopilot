// frontend/src/pages/UploadResume.js
import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

const UploadResume = () => {
  const [resumeText, setResumeText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const token = localStorage.getItem('token');
  const BACKEND_URL = 'http://localhost:5000';

  // Save to backend database
  const saveToDatabase = async (resumeText) => {
    try {
      // Try different possible field names based on your backend model
      const applicationData = {
        jobTitle: 'Resume Upload',
        companyName: 'My Profile',
        status: 'Saved',
        resumeText: resumeText,
        description: resumeText,  // Alternative field name
        notes: 'Uploaded for AI job recommendations'
      };
      
      const response = await axios.post(
        `${BACKEND_URL}/api/applications`,
        applicationData,
        { headers: { 'x-auth-token': token } }
      );
      console.log('Saved to database:', response.data);
      return true;
    } catch (error) {
      console.error('Database save error:', error.response?.data || error.message);
      return false;
    }
  };

  const handleUpload = async () => {
    if (!resumeText) {
      setMessage('Please paste your resume text');
      setMessageType('error');
      return;
    }

    setUploading(true);
    
    try {
      // Save to localStorage (for AI quick access) - THIS ALWAYS WORKS
      localStorage.setItem('userResume', resumeText);
      
      // Try to save to backend (optional - don't show error if fails)
      const dbSaved = await saveToDatabase(resumeText);
      
      if (dbSaved) {
        setMessage('Resume saved to database and AI system!');
        setMessageType('success');
      } else {
        // Still show success because localStorage saved
        setMessage('Resume saved locally! AI features will work. (Database save skipped)');
        setMessageType('success');
      }
      
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Save error:', error);
      // Still save to localStorage even if error
      localStorage.setItem('userResume', resumeText);
      setMessage('Resume saved locally! AI features will work.');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    }
    setUploading(false);
  };

  const clearResume = () => {
    localStorage.removeItem('userResume');
    setResumeText('');
    setMessage('Resume cleared from local storage');
    setMessageType('success');
    setTimeout(() => setMessage(''), 2000);
  };

  const useSampleResume = () => {
    setResumeText(`John Doe
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
- Built React frontend components
- Implemented CI/CD pipeline using Jenkins

EDUCATION
Bachelor of Technology in Computer Science
University Name | 2014-2018`);
  };

  return (
    <div className="container">
      <h1>Upload Your Resume</h1>
      
      <div className="ai-status-badge online" style={{ background: '#e8f4f8', color: '#0c5460' }}>
        Your resume will be saved to:
        <ul className="mt-10" style={{ marginLeft: '20px' }}>
          <li>Local storage (for AI quick access) - ALWAYS WORKS</li>
          <li>Database (optional - AI works even if this fails)</li>
        </ul>
      </div>
      
      <div className="card">
        <label className="detail-label">Paste your resume text here:</label>
        <textarea
          rows={15}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume content here..."
          className="job-description-input"
        />
      </div>

      <div className="flex-gap-10">
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Saving...' : 'Save Resume'}
        </button>

        <button onClick={clearResume} style={{ background: '#dc3545' }}>
          Clear Resume
        </button>
      </div>

      {message && (
        <div className={`${messageType === 'success' ? 'success' : 'error'} mt-15`}>
          {message}
        </div>
      )}

      {/* Sample Resume Section */}
      <div className="card mt-20">
        <h3>| Sample Resume (Click to use)</h3>
        <pre className="job-description-input" style={{ background: '#f5f5f5', fontSize: '12px' }}>
{`John Doe
Software Engineer

SUMMARY
Experienced Python Developer with 5+ years of experience in full-stack development.

TECHNICAL SKILLS
- Python, JavaScript, Java, SQL
- Django, Flask, React, Node.js
- PostgreSQL, MongoDB, MySQL
- AWS, Docker, Git, Jenkins

WORK EXPERIENCE
Senior Software Engineer | Tech Corp | 2020-Present
- Developed REST APIs using Django
- Built React frontend components

EDUCATION
Bachelor of Technology in Computer Science | 2014-2018`}
        </pre>
        <button onClick={useSampleResume} className="mt-10" style={{ background: '#28a745' }}>
          Use This Sample Resume
        </button>
      </div>

      {/* Navigation Tip */}
      <div className="resume-category-card mt-20">
        <h4>After Upload:</h4>
        <ol style={{ marginLeft: '20px' }}>
          <li>Go to <strong>Dashboard</strong> to see AI job recommendations</li>
          <li>Go to <strong>AI Dashboard</strong> to see your career path</li>
          <li>Go to <strong>Job Matcher</strong> to compare with any job description</li>
        </ol>
      </div>
    </div>
  );
};

export default UploadResume;