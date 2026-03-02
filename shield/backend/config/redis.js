const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
    },
    lazyConnect: true,
});

redis.on('connect', () => console.log('[SHIELD-REDIS] Connected'));
redis.on('error', (err) => console.error('[SHIELD-REDIS] Error:', err.message));

const connectRedis = async () => {
    try {
        await redis.connect();
    } catch (err) {
        console.error('[SHIELD-REDIS] Failed to connect:', err.message);
    }
};

module.exports = { redis, connectRedis };
