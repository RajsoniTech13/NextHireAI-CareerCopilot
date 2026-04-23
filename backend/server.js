const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/applications');
const aiRoutes = require('./routes/ai');

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Connect DB
connectDB();

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/ai', aiRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});