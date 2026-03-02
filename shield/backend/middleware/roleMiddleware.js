const { logSecurityEvent } = require('../services/auditLogger');

const authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        // req.user is populated by the protect middleware before this runs
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'S.H.I.E.L.D verification failed: User role not found in session' });
        }

        // Check if the user's role is in the array of allowed roles for this specific route
        if (!allowedRoles.includes(req.user.role)) {

            await logSecurityEvent({
                user: req.user,
                endpoint: req.originalUrl,
                method: req.method,
                action: 'RBAC_DENIED',
                outcome: 'DENIED',
                severity: 'CRITICAL',
                ipAddress: req.ip,
                metadata: { clearanceRequired: allowedRoles }
            });

            console.warn(`[DENIED] User ID: ${req.user.id} | Role: ${req.user.role} attempted unauthorized access to ${req.originalUrl}`);

            return res.status(403).json({
                message: 'S.H.I.E.L.D Enforcement Engine: Access Denied',
                reason: `Role '${req.user.role}' lacks clearance for this infrastructure API.`,
                clearanceRequired: allowedRoles
            });
        }

        await logSecurityEvent({
            user: req.user,
            endpoint: req.originalUrl,
            method: req.method,
            action: 'RBAC_ALLOWED',
            outcome: 'SUCCESS',
            severity: 'INFO',
            ipAddress: req.ip
        });

        next(); // Authorization passed, proceed to the controller
    };
};

module.exports = { authorizeRoles };
