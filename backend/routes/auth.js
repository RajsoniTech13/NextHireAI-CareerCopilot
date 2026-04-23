// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try{
        const { name, email, password } = req.body;
        
        const existing = await User.findOne({ email });
        if(existing){
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const user = new User({ name, email, password });
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, 'secret123');
        res.json({
            token,
            user: {
                id: user._id,
                name,
                email
            }
        });
        
    }catch(err){
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try{
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ error: 'User not found' });
        }
        
        const valid = await user.comparePassword(password);
        if(!valid){
            return res.status(400).json({ error: 'Wrong password' });
        }
        
        const token = jwt.sign({ userId: user._id }, 'secret123');
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email
            }
        });
        
    }catch(err){
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
        const { skills } = req.body;
        const skillsArr = skills ? skills.split(',').map(s => s.trim()) : [];
        await User.findByIdAndUpdate(req.userId, { skills: skillsArr });
        res.json({ message: 'Profile updated' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;