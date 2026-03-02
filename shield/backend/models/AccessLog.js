const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional, in case of anonymous/failed logins
    },
    username: {
        type: String,
        required: false
    },
    role: {
        type: String,
        default: 'Unknown'
    },
    endpoint: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    outcome: {
        type: String,
        required: true,
        enum: ['SUCCESS', 'DENIED', 'BLOCKED', 'ERROR']
    },
    severity: {
        type: String,
        required: true,
        enum: ['INFO', 'WARNING', 'CRITICAL']
    },
    ipAddress: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

const AccessLog = mongoose.model('AccessLog', accessLogSchema);
module.exports = AccessLog;
