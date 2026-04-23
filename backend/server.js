require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/applications');
const aiRoutes = require('./routes/ai');
const resumeRoutes = require('./routes/resume');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resume', resumeRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n  NextHireAI Backend running on port ${PORT}`);
    console.log(`  AI Service: ${process.env.AI_SERVICE_URL || 'http://localhost:5001'}\n`);
});