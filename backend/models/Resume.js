const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        default: 'text_upload'
    },
    fileType: {
        type: String,
        enum: ['pdf', 'docx', 'txt', 'text_paste'],
        default: 'text_paste'
    },
    rawText: {
        type: String,
        required: true
    },
    parsedData: {
        contact: {
            email: String,
            phone: String,
            linkedin: String,
            github: String,
            website: String
        },
        sections: {
            type: Map,
            of: String
        },
        skills: {
            technical: [String],
            soft: [String],
            all: [String]
        },
        wordCount: Number,
        lineCount: Number
    },
    analysis: {
        atsScore: { type: Number, default: 0 },
        predictedCategory: String,
        categoryConfidence: Number,
        topCategories: [{
            category: String,
            score: Number
        }],
        strengths: [String],
        weaknesses: [String],
        suggestions: [String],
        sectionScores: {
            type: Map,
            of: String
        }
    },
    version: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ResumeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for fast user resume lookup
ResumeSchema.index({ userId: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', ResumeSchema);
