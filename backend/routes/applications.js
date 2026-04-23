const express = require('express');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all applications
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching apps for userId:', req.userId);
        const apps = await Application.find({ userId: req.userId }).sort({ date: -1 });
        console.log('Found apps:', apps.length);
        res.json(apps);
    } catch (error) {
        console.error('Error in GET /applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add application
router.post('/', auth, async (req, res) => {
    try {
        console.log('Adding app for userId:', req.userId);
        console.log('Request body:', req.body);
        
        const { company, position, status } = req.body;
        
        if (!company || !position) {
            return res.status(400).json({ error: 'Company and position are required' });
        }
        
        const app = new Application({
            userId: req.userId,
            company: company,
            position: position,
            status: status || 'applied',
            date: new Date()
        });
        
        await app.save();
        console.log('App saved:', app);
        res.json(app);
    } catch (error) {
        console.error('Error in POST /applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete application
router.delete('/:id', auth, async (req, res) => {
    try {
        await Application.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Error in DELETE /applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get stats
router.get('/stats', auth, async (req, res) => {
    try {
        const apps = await Application.find({ userId: req.userId });
        const stats = {
            total: apps.length,
            applied: apps.filter(a => a.status === 'applied').length,
            interview: apps.filter(a => a.status === 'interview').length,
            offered: apps.filter(a => a.status === 'offered').length
        };
        res.json(stats);
    } catch (error) {
        console.error('Error in GET /applications/stats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;