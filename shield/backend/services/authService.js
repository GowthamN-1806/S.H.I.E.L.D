const User = require('../models/User');
const {
    generateAccessToken,
    generateRefreshToken,
    generateTempToken
} = require('../utils/tokenUtils');

const {
    createSession,
    terminateSession
} = require('./sessionService');

const { createLog } = require('./auditService');
const { calculateRiskScore, buildEventFromRequest } = require('./riskScoring');
const { redis } = require('../config/redis');
const { LOCKOUT_THRESHOLDS } = require('../utils/constants');


// ================= LOGIN =================
const login = async (username, password, meta = {}) => {

    // ✅ Case‑insensitive username search
    const user = await User.findOne({
        username: new RegExp(`^${username}$`, 'i'),
        isActive: true
    });

    // ✅ Safety validation
    if (!user || typeof user.comparePassword !== 'function') {
        return { success: false, status: 401, message: 'Invalid credentials' };
    }

    // ================= LOCKOUT CHECK =================
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const remaining = Math.ceil((user.lockoutUntil - Date.now()) / 60000);

        await createLog({
            eventType: 'LOGIN_FAILURE',
            userId: user._id,
            username: user.username,
            userRole: user.role,
            ipAddress: meta.ipAddress,
            action: 'login',
            outcome: 'BLOCKED',
            resource: '/api/auth/login',
            severity: 'WARNING'
        });

        return {
            success: false,
            status: 423,
            message: `Account locked. Try again in ${remaining} minutes.`
        };
    }

    // ================= PASSWORD CHECK =================
    const valid = await user.comparePassword(password);

    if (!valid) {
        user.failedLoginAttempts += 1;

        let lockDuration = null;

        for (const [threshold, duration] of Object.entries(LOCKOUT_THRESHOLDS)) {
            if (user.failedLoginAttempts >= parseInt(threshold)) {
                lockDuration = duration;
            }
        }

        if (lockDuration !== null) {
            user.lockoutUntil = new Date(Date.now() + lockDuration);
            user.isLocked = true;
        }

        await user.save();

        return { success: false, status: 401, message: 'Invalid credentials' };
    }

    // ================= RESET FAILED ATTEMPTS =================
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.isLocked = false;

    // ================= RISK SCORING =================
    const riskEvent = buildEventFromRequest(meta, user);
    const risk = calculateRiskScore(riskEvent);

    const requireMfa = user.mfaEnabled || risk.score > 50;

    // ================= MFA FLOW =================
    if (requireMfa) {
        await user.save();

        const tempToken = generateTempToken({
            userId: user._id,
            purpose: 'mfa'
        });

        return {
            success: true,
            requiresMfa: true,
            tempToken,
            riskScore: risk.score,
            riskLevel: risk.level
        };
    }

    // ================= SUCCESS LOGIN =================
    user.lastLogin = new Date();
    user.lastLoginIp = meta.ipAddress;
    await user.save();

    const session = await createSession(user, meta);

    const accessToken = generateAccessToken({
        userId: user._id,
        username: user.username,
        role: user.role,
        sessionId: session?.sessionId
    });

    const refreshToken = generateRefreshToken({
        userId: user._id
    });

    await redis.setex(`refresh:${user._id}`, 7 * 24 * 3600, refreshToken);

    await createLog({
        eventType: 'LOGIN_SUCCESS',
        userId: user._id,
        username: user.username,
        userRole: user.role,
        ipAddress: meta.ipAddress,
        action: 'login',
        outcome: 'SUCCESS',
        resource: '/api/auth/login',
        severity: 'INFO'
    });

    return {
        success: true,
        requiresMfa: false,
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
        sessionId: session?.sessionId,
        riskScore: risk.score,
        riskLevel: risk.level
    };
};


// ================= LOGOUT =================
const logout = async (userId, sessionId) => {
    try {
        if (sessionId) {
            await terminateSession(sessionId, 'User logout');
        }

        await redis.del(`refresh:${userId}`);

        return true;
    } catch (err) {
        console.error('[AUTH] Logout error:', err.message);
        return false;
    }
};

module.exports = { login, logout };