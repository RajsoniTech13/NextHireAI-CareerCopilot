const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobapp';
        await mongoose.connect(uri);
        console.log('MongoDB connected');
    }catch(err){
        console.log('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;