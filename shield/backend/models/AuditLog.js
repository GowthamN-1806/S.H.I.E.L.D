const mongoose = require('mongoose');
const { sha256 } = require('../utils/cryptoUtils');

const auditLogSchema = new mongoose.Schema({
    logId: { type: String, unique: true, required: true },
    eventType: {
        type: String,
        enum: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'API_ACCESS',
            'ACCESS_DENIED', 'ACCOUNT_LOCKED', 'ALERT_GENERATED', 'POLICY_CHANGED',
            'USER_CREATED', 'USER_MODIFIED', 'RISK_SCORE_CHANGED', 'SESSION_TERMINATED',
            'ATTACK_SIMULATED', 'MFA_CHALLENGE', 'MFA_SUCCESS', 'MFA_FAILURE'],
        required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    username: { type: String, default: 'system' },
    userRole: { type: String, default: '' },
    ipAddress: { type: String, default: '0.0.0.0' },
    userAgent: { type: String, default: '' },
    deviceFingerprint: { type: String, default: '' },
    geolocation: {
        city: { type: String, default: '' },
        country: { type: String, default: '' },
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
    },
    resource: { type: String, default: '' },
    action: { type: String, default: '' },
    outcome: {
        type: String,
        enum: ['SUCCESS', 'DENIED', 'BLOCKED', 'ESCALATED'],
        default: 'SUCCESS',
    },
    riskScoreAtEvent: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    previousLogHash: { type: String, default: 'GENESIS' },
    logHash: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, immutable: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' },
});

// Compute hash chain before saving
auditLogSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const lastLog = await mongoose.model('AuditLog')
                .findOne({}, { logHash: 1 })
                .sort({ timestamp: -1 })
                .lean();
            this.previousLogHash = lastLog ? lastLog.logHash : 'GENESIS';
            const hashPayload = {
                logId: this.logId,
                eventType: this.eventType,
                userId: this.userId,
                username: this.username,
                resource: this.resource,
                action: this.action,
                outcome: this.outcome,
                timestamp: this.timestamp,
                previousLogHash: this.previousLogHash,
            };
            this.logHash = sha256(hashPayload);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Prevent mutations
auditLogSchema.pre('updateOne', function () {
    throw new Error('Audit logs are immutable — updates are forbidden');
});
auditLogSchema.pre('findOneAndUpdate', function () {
    throw new Error('Audit logs are immutable — updates are forbidden');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
