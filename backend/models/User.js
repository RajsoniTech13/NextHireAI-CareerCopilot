const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    skills: [String],
    headline: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    experience: {
        type: String,
        default: ''
    },
    preferences: {
        jobTypes: { type: [String], default: ['Full-time'] },
        locations: { type: [String], default: [] },
        salaryMin: { type: Number, default: 0 },
        remoteOnly: { type: Boolean, default: false }
    },
    activeResumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

UserSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

UserSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);