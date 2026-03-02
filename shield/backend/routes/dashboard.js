const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { success, error } = require('../utils/responseUtils');
const { getAlertStats } = require('../services/alertService');
const { getActiveSessionCount, getActiveSessions } = require('../services/sessionService');
const AuditLog = require('../models/AuditLog');
const SecurityAlert = require('../models/SecurityAlert');
const User = require('../models/User');

// GET /api/dashboard/stats
router.get('/stats', requireAuth, requirePermission('dashboard', 'view'), async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [totalEvents, activeSessions, alertStats, blockedAttempts, totalApiCalls, totalUsers] = await Promise.all([
            AuditLog.countDocuments({ timestamp: { $gte: today } }),
            getActiveSessionCount(),
            getAlertStats(),
            AuditLog.countDocuments({ outcome: { $in: ['DENIED', 'BLOCKED'] }, timestamp: { $gte: today } }),
            AuditLog.countDocuments({ eventType: 'API_ACCESS', timestamp: { $gte: today } }),
            User.countDocuments({ isActive: true }),
        ]);
        return success(res, {
            totalEvents, activeSessions,
            blockedAttempts, totalApiCalls, totalUsers,
            activeAlerts: alertStats.open,
            criticalAlerts: alertStats.critical,
            highAlerts: alertStats.high,
        });
    } catch (err) {
        return error(res, 'Failed to fetch dashboard stats', 500, err.message);
    }
});

// GET /api/dashboard/sessions
router.get('/sessions', requireAuth, requirePermission('dashboard', 'view'), async (req, res) => {
    try {
        const sessions = await getActiveSessions();
        return success(res, sessions);
    } catch (err) {
        return error(res, 'Failed to fetch sessions', 500, err.message);
    }
});

// GET /api/dashboard/risk-distribution
router.get('/risk-distribution', requireAuth, requirePermission('dashboard', 'view'), async (req, res) => {
    try {
        const users = await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$department', avgRisk: { $avg: '$riskScore' }, count: { $sum: 1 } } },
            { $sort: { avgRisk: -1 } },
        ]);
        return success(res, users);
    } catch (err) {
        return error(res, 'Failed to fetch risk distribution', 500, err.message);
    }
});

// GET /api/dashboard/recent-events
router.get('/recent-events', requireAuth, requirePermission('dashboard', 'view'), async (req, res) => {
    try {
        const events = await AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();
        return success(res, events);
    } catch (err) {
        return error(res, 'Failed to fetch recent events', 500, err.message);
    }
});

// GET /api/dashboard/system-health
router.get('/system-health', requireAuth, requirePermission('dashboard', 'view'), async (req, res) => {
    try {
        const systems = [
            {
                name: 'Traffic Management', id: 'traffic', status: 'SECURE',
                lastIncident: null, uptime: 99.97, activeConnections: 342,
            },
            {
                name: 'Water Treatment', id: 'water', status: 'ELEVATED',
                lastIncident: new Date(Date.now() - 3600000).toISOString(), uptime: 99.94, activeConnections: 128,
            },
            {
                name: 'Power Grid', id: 'power', status: 'SECURE',
                lastIncident: null, uptime: 99.99, activeConnections: 567,
            },
            {
                name: 'Emergency Network', id: 'emergency', status: 'SECURE',
                lastIncident: null, uptime: 99.98, activeConnections: 89,
            },
        ];
        // Check for recent alerts to update statuses
        const recentAlerts = await SecurityAlert.find({
            status: 'OPEN', createdAt: { $gte: new Date(Date.now() - 3600000) },
        }).lean();
        for (const alert of recentAlerts) {
            const sys = systems.find(s => s.id === alert.targetSystem);
            if (sys) {
                sys.status = alert.severity === 'CRITICAL' ? 'INCIDENT' : 'ELEVATED';
                sys.lastIncident = alert.createdAt;
            }
        }
        return success(res, systems);
    } catch (err) {
        return error(res, 'Failed to fetch system health', 500, err.message);
    }
});

module.exports = router;
