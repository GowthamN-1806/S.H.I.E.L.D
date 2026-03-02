const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { success, error, paginated } = require('../utils/responseUtils');
const { exportLogs, verifyLogChain } = require('../services/auditService');
const AuditLog = require('../models/AuditLog');

// GET /api/logs
router.get('/', requireAuth, requirePermission('audit_logs', 'read'), async (req, res) => {
    try {
        const { page = 1, limit = 30, eventType, severity, userId, dateFrom, dateTo } = req.query;
        const query = {};
        if (eventType) query.eventType = eventType;
        if (severity) query.severity = severity;
        if (userId) query.userId = userId;
        if (dateFrom || dateTo) {
            query.timestamp = {};
            if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
            if (dateTo) query.timestamp.$lte = new Date(dateTo);
        }
        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();
        return paginated(res, logs, total, page, limit);
    } catch (err) {
        return error(res, 'Failed to fetch logs', 500, err.message);
    }
});

// GET /api/logs/verify
router.get('/verify', requireAuth, requirePermission('audit_logs', 'read'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 7 * 86400000).toISOString();
        const end = endDate || new Date().toISOString();
        const result = await verifyLogChain(start, end);
        return success(res, result, result.valid ? 'Log chain integrity verified' : 'Integrity issues found');
    } catch (err) {
        return error(res, 'Chain verification failed', 500, err.message);
    }
});

// GET /api/logs/export
router.get('/export', requireAuth, requirePermission('audit_logs', 'export'), async (req, res) => {
    try {
        const logs = await exportLogs(req.query);
        return success(res, logs, `Exported ${logs.length} log entries`);
    } catch (err) {
        return error(res, 'Export failed', 500, err.message);
    }
});

module.exports = router;
