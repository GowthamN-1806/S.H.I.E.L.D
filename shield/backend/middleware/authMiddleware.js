const jwt = require('jsonwebtoken');
const { logSecurityEvent } = require('../services/auditLogger');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Our payload has id and role. Attach to req so downstream functions can use it.
            req.user = { id: decoded.id, role: decoded.role };

            // We do a low level debug log but typically we don't spam the DB with every single API token success
            // To fulfill the requirement we can log TOKEN_SUCCESS here if needed, but the RBAC roleMiddleware logs the true success.

            next(); // Move to the next middleware (or route handler)
        } catch (error) {
            console.error(error);

            await logSecurityEvent({
                endpoint: req.originalUrl,
                method: req.method,
                action: 'TOKEN_FAILURE',
                outcome: 'BLOCKED',
                severity: 'WARNING',
                ipAddress: req.ip,
                metadata: { reason: 'Invalid or expired JWT token' }
            });

            return res.status(401).json({ message: 'Not authorized by S.H.I.E.L.D, invalid token' });
        }
    }

    if (!token) {
        await logSecurityEvent({
            endpoint: req.originalUrl,
            method: req.method,
            action: 'TOKEN_FAILURE',
            outcome: 'BLOCKED',
            severity: 'WARNING',
            ipAddress: req.ip,
            metadata: { reason: 'No token provided' }
        });

        return res.status(401).json({ message: 'Not authorized by S.H.I.E.L.D, no token provided' });
    }
};

module.exports = { protect };
