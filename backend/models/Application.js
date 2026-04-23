const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['saved', 'applied', 'interview', 'offered', 'rejected', 'withdrawn'],
        default: 'applied'
    },
    jobUrl: {
        type: String,
        default: ''
    },
    jobDescription: {
        type: String,
        default: ''
    },
    matchScore: {
        type: Number,
        default: null
    },
    matchLevel: {
        type: String,
        default: ''
    },
    salary: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    interviewDate: {
        type: Date,
        default: null
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ApplicationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

ApplicationSchema.index({ userId: 1, status: 1, appliedDate: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);