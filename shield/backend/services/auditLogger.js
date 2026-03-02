const AccessLog = require('../models/AccessLog');

const logSecurityEvent = async ({
    user = {},
    endpoint,
    method,
    action,
    outcome,
    severity,
    ipAddress,
    metadata = {}
}) => {
    try {
        const logEntry = new AccessLog({
            userId: user.id || null,
            username: user.username || 'Anonymous',
            role: user.role || 'Unknown',
            endpoint,
            method,
            action,
            outcome,
            severity,
            ipAddress: ipAddress || '0.0.0.0',
            metadata
        });

        await logEntry.save();
    } catch (error) {
        // We log to the local console but we DO NOT crash the API if DB logging fails
        console.error('CRITICAL: Activity Logging Failed ->', error.message);
    }
};

module.exports = { logSecurityEvent };
