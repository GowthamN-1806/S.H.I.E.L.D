const { redis } = require('../config/redis');
const { error } = require('../utils/responseUtils');

const rateLimit = (opts = {}) => {
    const windowMs = opts.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
    const max = opts.max || parseInt(process.env.RATE_LIMIT_MAX) || 60;
    const keyPrefix = opts.keyPrefix || 'rl';

    return async (req, res, next) => {
        const identifier = req.user ? req.user._id : req.ip;
        const key = `${keyPrefix}:${identifier}`;
        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.pexpire(key, windowMs);
            }
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
            if (current > max) {
                return error(res, 'Too many requests. Please try again later.', 429);
            }
            next();
        } catch (err) {
            console.warn('[RATE-LIMIT] Redis error, allowing request:', err.message);
            next();
        }
    };
};

const authRateLimit = rateLimit({
    windowMs: 60000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    keyPrefix: 'rl:auth',
});

const apiPartnerRateLimit = rateLimit({
    windowMs: 60000,
    max: 10,
    keyPrefix: 'rl:partner',
});

module.exports = { rateLimit, authRateLimit, apiPartnerRateLimit };
