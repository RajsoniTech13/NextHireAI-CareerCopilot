const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/jobapp');
        console.log('MongoDB connected');
    }catch(err){
        console.log('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;