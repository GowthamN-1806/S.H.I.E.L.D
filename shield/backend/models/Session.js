const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    role: { type: String, required: true },
    ipAddress: { type: String, default: '0.0.0.0' },
    userAgent: { type: String, default: '' },
    deviceFingerprint: { type: String, default: '' },
    geolocation: {
        city: { type: String, default: '' },
        country: { type: String, default: '' },
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
    },
    riskScoreAtCreation: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    terminatedAt: { type: Date, default: null },
    terminatedReason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    lastActivityAt: { type: Date, default: Date.now },
});

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Session', sessionSchema);
