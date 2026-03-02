const SecurityAlert = require('../models/SecurityAlert');
const { v4: uuidv4 } = require('uuid');

let io = null;
const setIO = (socketIO) => { io = socketIO; };

const createAlert = async (alertData) => {
    try {
        const alert = await SecurityAlert.create({
            alertId: uuidv4(),
            ...alertData,
            createdAt: new Date(),
        });
        if (io) {
            io.emit('new_alert', {
                alertId: alert.alertId,
                title: alert.title,
                severity: alert.severity,
                targetSystem: alert.targetSystem,
                description: alert.description,
                createdAt: alert.createdAt,
                isDemo: alert.isDemo || false,
            });
        }
        return alert;
    } catch (err) {
        console.error('[ALERT] Create error:', err.message);
        return null;
    }
};

const getAlerts = async (filters = {}, page = 1, limit = 20) => {
    const query = {};
    if (filters.severity) query.severity = filters.severity;
    if (filters.status) query.status = filters.status;
    if (filters.targetSystem) query.targetSystem = filters.targetSystem;
    if (filters.isDemo !== undefined) query.isDemo = filters.isDemo;
    const total = await SecurityAlert.countDocuments(query);
    const alerts = await SecurityAlert.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return { alerts, total, page, limit };
};

const acknowledgeAlert = async (alertId, userId) => {
    return SecurityAlert.findOneAndUpdate(
        { alertId },
        { status: 'ACKNOWLEDGED', acknowledgedBy: userId, acknowledgedAt: new Date() },
        { new: true }
    );
};

const resolveAlert = async (alertId, userId, notes = '') => {
    return SecurityAlert.findOneAndUpdate(
        { alertId },
        { status: 'RESOLVED', resolvedBy: userId, resolvedAt: new Date(), resolutionNotes: notes },
        { new: true }
    );
};

const getAlertStats = async () => {
    const [total, open, critical, high] = await Promise.all([
        SecurityAlert.countDocuments(),
        SecurityAlert.countDocuments({ status: 'OPEN' }),
        SecurityAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } }),
        SecurityAlert.countDocuments({ severity: 'HIGH', status: { $ne: 'RESOLVED' } }),
    ]);
    return { total, open, critical, high };
};

const clearDemoAlerts = async () => {
    return SecurityAlert.deleteMany({ isDemo: true });
};

module.exports = { createAlert, getAlerts, acknowledgeAlert, resolveAlert, getAlertStats, clearDemoAlerts, setIO };
