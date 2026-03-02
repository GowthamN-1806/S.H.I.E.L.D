const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { success, error, paginated } = require('../utils/responseUtils');
const { getAlerts, acknowledgeAlert, resolveAlert, getAlertStats } = require('../services/alertService');

// GET /api/alerts
router.get('/', requireAuth, requirePermission('alerts', 'read'), async (req, res) => {
    try {
        const { page = 1, limit = 20, severity, status, targetSystem } = req.query;
        const result = await getAlerts({ severity, status, targetSystem }, parseInt(page), parseInt(limit));
        return paginated(res, result.alerts, result.total, result.page, result.limit);
    } catch (err) {
        return error(res, 'Failed to fetch alerts', 500, err.message);
    }
});

// GET /api/alerts/stats
router.get('/stats', requireAuth, requirePermission('alerts', 'read'), async (req, res) => {
    try {
        const stats = await getAlertStats();
        return success(res, stats);
    } catch (err) {
        return error(res, 'Failed to fetch alert stats', 500, err.message);
    }
});

// POST /api/alerts/:alertId/acknowledge
router.post('/:alertId/acknowledge', requireAuth, requirePermission('alerts', 'acknowledge'), async (req, res) => {
    try {
        const alert = await acknowledgeAlert(req.params.alertId, req.user._id);
        if (!alert) return error(res, 'Alert not found', 404);
        return success(res, alert, 'Alert acknowledged');
    } catch (err) {
        return error(res, 'Failed to acknowledge alert', 500, err.message);
    }
});

// POST /api/alerts/:alertId/resolve
router.post('/:alertId/resolve', requireAuth, requirePermission('alerts', 'resolve'), async (req, res) => {
    try {
        const { notes } = req.body;
        const alert = await resolveAlert(req.params.alertId, req.user._id, notes || '');
        if (!alert) return error(res, 'Alert not found', 404);
        return success(res, alert, 'Alert resolved');
    } catch (err) {
        return error(res, 'Failed to resolve alert', 500, err.message);
    }
});

module.exports = router;
