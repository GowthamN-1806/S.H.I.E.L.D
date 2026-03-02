const AuditLog = require('../models/AuditLog');
const { v4: uuidv4 } = require('uuid');
const { sha256 } = require('../utils/cryptoUtils');

const createLog = async (eventData) => {
    try {
        const log = new AuditLog({
            logId: uuidv4(),
            ...eventData,
            timestamp: new Date(),
        });
        await log.save();
        return log;
    } catch (err) {
        console.error('[AUDIT] Failed to create log:', err.message);
        return null;
    }
};

const verifyLogChain = async (startDate, endDate) => {
    try {
        const logs = await AuditLog.find({
            timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }).sort({ timestamp: 1 }).lean();

        const corrupted = [];
        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const expectedPrev = i === 0 ? log.previousLogHash : logs[i - 1].logHash;
            if (log.previousLogHash !== expectedPrev && log.previousLogHash !== 'GENESIS') {
                corrupted.push({ logId: log.logId, issue: 'previousLogHash mismatch' });
            }
            const recomputed = sha256({
                logId: log.logId,
                eventType: log.eventType,
                userId: log.userId,
                username: log.username,
                resource: log.resource,
                action: log.action,
                outcome: log.outcome,
                timestamp: log.timestamp,
                previousLogHash: log.previousLogHash,
            });
            if (recomputed !== log.logHash) {
                corrupted.push({ logId: log.logId, issue: 'logHash integrity failure' });
            }
        }
        return {
            valid: corrupted.length === 0,
            totalLogs: logs.length,
            corruptedEntries: corrupted,
            verifiedAt: new Date(),
        };
    } catch (err) {
        console.error('[AUDIT] Chain verification error:', err.message);
        return { valid: false, totalLogs: 0, corruptedEntries: [], error: err.message, verifiedAt: new Date() };
    }
};

const exportLogs = async (filters = {}) => {
    try {
        const query = {};
        if (filters.userId) query.userId = filters.userId;
        if (filters.eventType) query.eventType = filters.eventType;
        if (filters.severity) query.severity = filters.severity;
        if (filters.dateFrom || filters.dateTo) {
            query.timestamp = {};
            if (filters.dateFrom) query.timestamp.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.timestamp.$lte = new Date(filters.dateTo);
        }
        return AuditLog.find(query).sort({ timestamp: -1 }).limit(filters.limit || 500).lean();
    } catch (err) {
        console.error('[AUDIT] Export error:', err.message);
        return [];
    }
};

module.exports = { createLog, verifyLogChain, exportLogs };
