const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema({
    alertId: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'],
        required: true,
    },
    status: {
        type: String,
        enum: ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'],
        default: 'OPEN',
    },
    source: { type: String, default: 'SADE' },
    targetSystem: { type: String, enum: ['traffic', 'water', 'power', 'emergency', 'auth', 'api', 'general'], default: 'general' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    username: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    riskScore: { type: Number, default: 0 },
    anomalyType: { type: String, default: '' },
    explanation: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isDemo: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acknowledgedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNotes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

securityAlertSchema.index({ severity: 1, status: 1 });
securityAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);
