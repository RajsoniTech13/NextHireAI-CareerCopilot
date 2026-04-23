// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

const getSecret = () => process.env.JWT_SECRET || 'secret123';

// Register
router.post('/register', async (req, res) => {
    try{
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const existing = await User.findOne({ email: email.toLowerCase() });
        if(existing){
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const user = new User({ name, email: email.toLowerCase(), password });
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, getSecret(), { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                name,
                email: user.email
            }
        });
        
    }catch(err){
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try{
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if(!user){
            return res.status(400).json({ error: 'User not found' });
        }
        
        const valid = await user.comparePassword(password);
        if(!valid){
            return res.status(400).json({ error: 'Wrong password' });
        }
        
        const token = jwt.sign({ userId: user._id }, getSecret(), { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
        
    }catch(err){
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password').populate('activeResumeId');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { skills, name, headline, location, experience, preferences } = req.body;
        
        const updateData = {};
        
        if (skills) {
            updateData.skills = typeof skills === 'string' 
                ? skills.split(',').map(s => s.trim()).filter(Boolean)
                : skills;
        }
        if (name) updateData.name = name;
        if (headline !== undefined) updateData.headline = headline;
        if (location !== undefined) updateData.location = location;
        if (experience !== undefined) updateData.experience = experience;
        if (preferences) updateData.preferences = preferences;
        
        const user = await User.findByIdAndUpdate(req.userId, updateData, { new: true }).select('-password');
        res.json(user);
    } catch(err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;