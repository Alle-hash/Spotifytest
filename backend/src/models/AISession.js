const mongoose = require('mongoose');

const aiSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        required: true
    },
    rootSongs: [{
        id: String,
        name: String,
        artist: String,
        uri: String
    }],
    requestCount: {
        type: Number,
        default: 0
    },
    recommendedHistory: [{
        id: String,
        name: String,
        artist: String,
        similarity: Number,
        addedAt: Date
    }],
    selectedSongs: [{
        id: String,
        name: String,
        artist: String,
        uri: String,
        similarity: Number
    }],
    lastActivity: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Session expires after 1 hour of inactivity
    }
});

// Update lastActivity on any modification
aiSessionSchema.pre('save', function (next) {
    this.lastActivity = new Date();
    next();
});

module.exports = mongoose.model('AISession', aiSessionSchema);
