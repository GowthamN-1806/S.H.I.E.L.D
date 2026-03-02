const { error } = require('../utils/responseUtils');
const { createLog } = require('../services/auditService');

const evaluatePolicy = (resource, action) => {
    return async (req, res, next) => {
        const user = req.user;
        if (!user) return error(res, 'No user context for ABAC evaluation', 403);

        // POLICY 1 — Time restriction for critical controls
        const criticalResources = ['water:control', 'power:grid_modify', 'power:control'];
        const permKey = `${resource}:${action}`;
        if (criticalResources.includes(permKey)) {
            const withinHours = user.workingHours ? isWithinHours(user.workingHours) : true;
            if (!withinHours && user.role !== 'super_admin') {
                await logDenial(req, permKey, 'Outside authorized working hours');
                return error(res, 'Access denied: outside authorized working hours for this operation', 403);
            }
        }

        // POLICY 2 — Device requirement for sensitive operations
        if (action.includes('control') || action.includes('emergency') || action.includes('modify')) {
            const deviceFp = req.deviceFingerprint || req.headers['x-device-fingerprint'] || '';
            const trustedDevices = (user.deviceFingerprints || []).filter(d => d.trusted).map(d => d.fingerprint);
            if (trustedDevices.length > 0 && !trustedDevices.includes(deviceFp) && user.role !== 'super_admin') {
                await logDenial(req, permKey, 'Untrusted device');
                return error(res, 'Sensitive operations require a registered device', 403);
            }
        }

        // POLICY 3 — Location requirement for critical infrastructure
        if (['water:control', 'power:grid_modify'].includes(permKey)) {
            // In production, compare GPS coordinates. For demo, we pass through.
            const geoHeader = req.headers['x-geo-location'];
            if (geoHeader && user.allowedLocations && user.allowedLocations.length > 0) {
                // Simplified check - in production use Haversine formula
            }
        }

        // POLICY 4 — Risk score gate
        if (user.riskScore > 75) {
            if (action !== 'read' && action !== 'view') {
                await logDenial(req, permKey, 'Elevated risk score restricts write operations');
                return error(res, 'Elevated risk score restricts write operations. Contact security.', 403);
            }
        }

        // POLICY 5 — Citizen data isolation
        if (user.role === 'citizen') {
            if (req.params.userId && req.params.userId !== user._id.toString()) {
                await logDenial(req, permKey, 'Citizens can only access their own data');
                return error(res, 'Access denied: you can only access your own data', 403);
            }
        }

        // POLICY 6 — Partner sandbox
        if (user.role === 'api_partner') {
            const allowedScopes = user.apiScope || [];
            if (allowedScopes.length > 0 && !allowedScopes.includes(permKey)) {
                await logDenial(req, permKey, 'Outside partner API scope');
                return error(res, 'Access denied: operation outside your API scope', 403);
            }
        }

        next();
    };
};

function isWithinHours(wh) {
    const now = new Date();
    const day = now.getDay();
    if (wh.days && !wh.days.includes(day)) return false;
    const [startH, startM] = (wh.start || '08:00').split(':').map(Number);
    const [endH, endM] = (wh.end || '18:00').split(':').map(Number);
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return currentMin >= startH * 60 + startM && currentMin <= endH * 60 + endM;
}

async function logDenial(req, permission, reason) {
    try {
        await createLog({
            eventType: 'ACCESS_DENIED', userId: req.user._id, username: req.user.username,
            userRole: req.user.role, ipAddress: req.ip, resource: permission,
            action: 'abac_check', outcome: 'DENIED', severity: 'WARNING',
            riskScoreAtEvent: req.user.riskScore || 0,
            metadata: { reason, policy: 'ABAC' },
        });
    } catch (e) { /* non-critical */ }
}

module.exports = { evaluatePolicy };
