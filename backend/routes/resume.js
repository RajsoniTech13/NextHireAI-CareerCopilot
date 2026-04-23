// backend/routes/resume.js
const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const User = require('../models/User');
const PythonAIBridge = require('../utils/pythonBridge');
const auth = require('../middleware/auth');

// GET /api/resume - Get user's active resume
router.get('/', auth, async (req, res) => {
    try {
        const resume = await Resume.findOne({ userId: req.userId, isActive: true })
            .sort({ createdAt: -1 });
        
        if (!resume) {
            return res.json({ message: 'No resume found', resume: null });
        }
        res.json(resume);
    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/resume/history - Get all resume versions
router.get('/history', auth, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.userId })
            .select('fileName fileType version isActive analysis.atsScore analysis.predictedCategory createdAt')
            .sort({ createdAt: -1 });
        res.json(resumes);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/resume/upload - Upload and analyze resume text
router.post('/upload', auth, async (req, res) => {
    try {
        const { resumeText, fileName } = req.body;
        
        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({ error: 'Resume text must be at least 50 characters' });
        }
        
        // Call AI service for analysis
        let analysisResult = {};
        try {
            analysisResult = await PythonAIBridge.analyzeResume(resumeText);
        } catch (aiErr) {
            console.error('AI analysis failed, saving without analysis:', aiErr.message);
        }
        
        // Get version number
        const existingCount = await Resume.countDocuments({ userId: req.userId });
        
        // Deactivate previous resumes
        await Resume.updateMany(
            { userId: req.userId, isActive: true },
            { isActive: false }
        );
        
        // Create new resume
        const resume = new Resume({
            userId: req.userId,
            fileName: fileName || 'Resume Upload',
            fileType: 'text_paste',
            rawText: resumeText,
            parsedData: {
                skills: analysisResult.skills || { technical: [], soft: [], all: [] },
                contact: analysisResult.contact || {},
                wordCount: analysisResult.word_count || resumeText.split(/\s+/).length,
                lineCount: resumeText.split('\n').length
            },
            analysis: {
                atsScore: analysisResult.ats_score || 0,
                predictedCategory: analysisResult.predicted_category || '',
                categoryConfidence: analysisResult.category_confidence || 0,
                topCategories: analysisResult.top_categories || [],
                strengths: analysisResult.strengths || [],
                weaknesses: analysisResult.weaknesses || [],
                suggestions: analysisResult.suggestions || [],
                sectionScores: analysisResult.section_scores || {}
            },
            version: existingCount + 1,
            isActive: true
        });
        
        await resume.save();
        
        // Update user's active resume
        await User.findByIdAndUpdate(req.userId, { activeResumeId: resume._id });
        
        res.json({
            message: 'Resume uploaded and analyzed successfully',
            resume
        });
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/resume/analyze - Re-analyze existing resume
router.post('/analyze', auth, async (req, res) => {
    try {
        const { resumeId, jobDescription } = req.body;
        
        let resume;
        if (resumeId) {
            resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
        } else {
            resume = await Resume.findOne({ userId: req.userId, isActive: true })
                .sort({ createdAt: -1 });
        }
        
        if (!resume) {
            return res.status(404).json({ error: 'No resume found' });
        }
        
        const analysisResult = await PythonAIBridge.analyzeResume(resume.rawText, jobDescription);
        
        // Update resume analysis
        resume.analysis = {
            atsScore: analysisResult.ats_score || 0,
            predictedCategory: analysisResult.predicted_category || '',
            categoryConfidence: analysisResult.category_confidence || 0,
            topCategories: analysisResult.top_categories || [],
            strengths: analysisResult.strengths || [],
            weaknesses: analysisResult.weaknesses || [],
            suggestions: analysisResult.suggestions || [],
            sectionScores: analysisResult.section_scores || {}
        };
        
        await resume.save();
        res.json(resume);
    } catch (error) {
        console.error('Resume analysis error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/resume/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await Resume.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        if (!result) return res.status(404).json({ error: 'Resume not found' });
        res.json({ message: 'Resume deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
