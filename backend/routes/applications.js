const express = require('express');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all applications
router.get('/', auth, async (req, res) => {
    try {
        const apps = await Application.find({ userId: req.userId }).sort({ appliedDate: -1 });
        res.json(apps);
    } catch (error) {
        console.error('Error in GET /applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get application stats
router.get('/stats', auth, async (req, res) => {
    try {
        const apps = await Application.find({ userId: req.userId });
        const stats = {
            total: apps.length,
            saved: apps.filter(a => a.status === 'saved').length,
            applied: apps.filter(a => a.status === 'applied').length,
            interview: apps.filter(a => a.status === 'interview').length,
            offered: apps.filter(a => a.status === 'offered').length,
            rejected: apps.filter(a => a.status === 'rejected').length,
            withdrawn: apps.filter(a => a.status === 'withdrawn').length
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add application
router.post('/', auth, async (req, res) => {
    try {
        const { company, position, status, jobUrl, jobDescription, salary, location, notes, matchScore, matchLevel } = req.body;
        
        if (!company || !position) {
            return res.status(400).json({ error: 'Company and position are required' });
        }
        
        const app = new Application({
            userId: req.userId,
            company,
            position,
            status: status || 'applied',
            jobUrl: jobUrl || '',
            jobDescription: jobDescription || '',
            salary: salary || '',
            location: location || '',
            notes: notes || '',
            matchScore: matchScore || null,
            matchLevel: matchLevel || '',
            appliedDate: new Date()
        });
        
        await app.save();
        res.json(app);
    } catch (error) {
        console.error('Error in POST /applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update application
router.put('/:id', auth, async (req, res) => {
    try {
        const { company, position, status, jobUrl, jobDescription, salary, location, notes, interviewDate, matchScore, matchLevel } = req.body;
        
        const updateData = {};
        if (company) updateData.company = company;
        if (position) updateData.position = position;
        if (status) updateData.status = status;
        if (jobUrl !== undefined) updateData.jobUrl = jobUrl;
        if (jobDescription !== undefined) updateData.jobDescription = jobDescription;
        if (salary !== undefined) updateData.salary = salary;
        if (location !== undefined) updateData.location = location;
        if (notes !== undefined) updateData.notes = notes;
        if (interviewDate !== undefined) updateData.interviewDate = interviewDate;
        if (matchScore !== undefined) updateData.matchScore = matchScore;
        if (matchLevel !== undefined) updateData.matchLevel = matchLevel;
        
        const app = await Application.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updateData,
            { new: true }
        );
        
        if (!app) return res.status(404).json({ error: 'Application not found' });
        res.json(app);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete application
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await Application.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        if (!result) return res.status(404).json({ error: 'Application not found' });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;