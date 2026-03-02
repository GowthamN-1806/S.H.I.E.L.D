const { createLog } = require('../services/auditService');

const requestLogger = async (req, res, next) => {
    const start = Date.now();
    res.on('finish', async () => {
        if (req.path.startsWith('/api/') && !req.path.includes('/health')) {
            try {
                await createLog({
                    eventType: 'API_ACCESS',
                    userId: req.user?._id || null,
                    username: req.user?.username || 'anonymous',
                    userRole: req.user?.role || '',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'] || '',
                    deviceFingerprint: req.deviceFingerprint || '',
                    geolocation: req.geolocation || {},
                    resource: `${req.method} ${req.originalUrl}`,
                    action: req.method,
                    outcome: res.statusCode < 400 ? 'SUCCESS' : 'DENIED',
                    riskScoreAtEvent: req.user?.riskScore || 0,
                    severity: res.statusCode >= 500 ? 'CRITICAL' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
                    metadata: { statusCode: res.statusCode, responseTime: Date.now() - start },
                });
            } catch (e) { /* non-critical */ }
        }
    });
    next();
};

module.exports = { requestLogger };
