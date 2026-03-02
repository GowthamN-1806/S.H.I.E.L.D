const { PERMISSIONS } = require('../utils/constants');
const { error } = require('../utils/responseUtils');
const { createLog } = require('../services/auditService');

const requirePermission = (resource, action) => {
    return async (req, res, next) => {
        const permKey = `${resource}:${action}`;
        const allowedRoles = PERMISSIONS[permKey];

        if (!allowedRoles) {
            return error(res, 'Permission not configured', 500);
        }

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            await createLog({
                eventType: 'ACCESS_DENIED',
                userId: req.user?._id,
                username: req.user?.username || 'unknown',
                userRole: req.user?.role || 'none',
                ipAddress: req.ip,
                resource: permKey,
                action,
                outcome: 'DENIED',
                severity: 'WARNING',
                riskScoreAtEvent: req.user?.riskScore || 0,
                metadata: { requiredPermission: permKey, userRole: req.user?.role },
            });
            return error(res, `Access denied: insufficient permissions for ${resource}:${action}`, 403);
        }
        next();
    };
};

module.exports = { requirePermission };
