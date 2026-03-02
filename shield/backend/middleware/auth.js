const { verifyAccessToken } = require('../utils/tokenUtils');
const { redis } = require('../config/redis');
const { error } = require('../utils/responseUtils');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return error(res, 'Access token required', 401);
        }
        const token = authHeader.split(' ')[1];

        // Check blacklist
        const blacklisted = await redis.get(`blacklist:${token}`);
        if (blacklisted) {
            return error(res, 'Token has been revoked', 401);
        }

        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).lean();
        if (!user || !user.isActive) {
            return error(res, 'User account inactive or not found', 401);
        }
        if (user.isLocked) {
            return error(res, 'Account is locked. Contact administrator.', 423);
        }

        req.user = { ...user, _id: user._id };
        req.token = token;
        req.sessionId = decoded.sessionId;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return error(res, 'Token expired', 401);
        }
        return error(res, 'Invalid token', 401);
    }
};

module.exports = { requireAuth };
