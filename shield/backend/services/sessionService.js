const Session = require('../models/Session');
const { redis } = require('../config/redis');
const { generateSessionId } = require('../utils/cryptoUtils');

const createSession = async (user, meta = {}) => {
    try {
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

        const session = await Session.create({
            sessionId,
            userId: user._id,
            username: user.username,
            role: user.role,
            ipAddress: meta.ipAddress || '0.0.0.0',
            userAgent: meta.userAgent || '',
            deviceFingerprint: meta.deviceFingerprint || '',
            geolocation: meta.geolocation || {},
            riskScoreAtCreation: user.riskScore || 0,
            expiresAt,
        });

        // Store in Redis for fast lookups
        await redis.setex(`session:${sessionId}`, 8 * 3600, JSON.stringify({
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
        }));

        return session;
    } catch (err) {
        console.error('[SESSION] Create error:', err.message);
        return null;
    }
};

const terminateSession = async (sessionId, reason = 'User logout') => {
    try {
        await Session.findOneAndUpdate(
            { sessionId },
            { isActive: false, terminatedAt: new Date(), terminatedReason: reason }
        );
        await redis.del(`session:${sessionId}`);
        return true;
    } catch (err) {
        console.error('[SESSION] Terminate error:', err.message);
        return false;
    }
};

const terminateAllUserSessions = async (userId, reason = 'Account action') => {
    try {
        const sessions = await Session.find({ userId, isActive: true });
        for (const s of sessions) {
            await redis.del(`session:${s.sessionId}`);
        }
        await Session.updateMany(
            { userId, isActive: true },
            { isActive: false, terminatedAt: new Date(), terminatedReason: reason }
        );
        return sessions.length;
    } catch (err) {
        console.error('[SESSION] Terminate all error:', err.message);
        return 0;
    }
};

const getActiveSessions = async (filters = {}) => {
    const query = { isActive: true };
    if (filters.userId) query.userId = filters.userId;
    return Session.find(query).sort({ createdAt: -1 }).lean();
};

const getActiveSessionCount = async () => {
    return Session.countDocuments({ isActive: true });
};

module.exports = { createSession, terminateSession, terminateAllUserSessions, getActiveSessions, getActiveSessionCount };
