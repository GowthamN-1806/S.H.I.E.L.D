const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimit');
const { login, logout } = require('../services/authService');
const { verifyToken } = require('../services/mfaService');
const { generateSecret, generateQRCode } = require('../services/mfaService');
const { verifyTempToken, verifyRefreshToken, generateAccessToken, generateRefreshToken: genRefresh } = require('../utils/tokenUtils');
const { createLog } = require('../services/auditService');
const { success, error } = require('../utils/responseUtils');
const { redis } = require('../config/redis');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', authRateLimit, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return error(res, 'Username and password are required', 400);
        const meta = {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
            deviceFingerprint: req.deviceFingerprint || req.headers['x-device-fingerprint'] || '',
            geolocation: req.geolocation || {},
        };
        const result = await login(username, password, meta);
        if (!result.success && !result.requiresMfa) {
            return error(res, result.message, result.status);
        }
        return success(res, result, result.requiresMfa ? 'MFA verification required' : 'Login successful');
    } catch (err) {
        return error(res, 'Login failed', 500, err.message);
    }
});

// POST /api/auth/verify-mfa
router.post('/verify-mfa', authRateLimit, async (req, res) => {
    try {
        const { tempToken, mfaCode } = req.body;
        if (!tempToken || !mfaCode) return error(res, 'Temp token and MFA code required', 400);

        let decoded;
        try { decoded = verifyTempToken(tempToken); } catch { return error(res, 'Invalid or expired temp token', 401); }

        const user = await User.findById(decoded.userId);
        if (!user) return error(res, 'User not found', 404);

        const valid = verifyToken(user.mfaSecret, mfaCode);
        if (!valid) {
            await createLog({
                eventType: 'MFA_FAILURE', userId: user._id, username: user.username,
                userRole: user.role, ipAddress: req.ip, action: 'mfa_verify', outcome: 'DENIED',
                resource: '/api/auth/verify-mfa', severity: 'WARNING',
            });
            return error(res, 'Invalid MFA code', 401);
        }

        user.lastLogin = new Date();
        user.lastLoginIp = req.ip;
        await user.save();

        const { createSession } = require('../services/sessionService');
        const session = await createSession(user, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
        const accessToken = generateAccessToken({
            userId: user._id, username: user.username, role: user.role, sessionId: session?.sessionId,
        });
        const refreshToken = genRefresh({ userId: user._id });
        await redis.setex(`refresh:${user._id}`, 7 * 24 * 3600, refreshToken);

        await createLog({
            eventType: 'MFA_SUCCESS', userId: user._id, username: user.username,
            userRole: user.role, ipAddress: req.ip, action: 'mfa_verify', outcome: 'SUCCESS',
            resource: '/api/auth/verify-mfa', severity: 'INFO',
        });
        await createLog({
            eventType: 'LOGIN_SUCCESS', userId: user._id, username: user.username,
            userRole: user.role, ipAddress: req.ip, action: 'login', outcome: 'SUCCESS',
            resource: '/api/auth/login', severity: 'INFO',
        });

        return success(res, {
            user: user.toSafeObject(), accessToken, refreshToken, sessionId: session?.sessionId,
        }, 'MFA verified. Login successful.');
    } catch (err) {
        return error(res, 'MFA verification failed', 500, err.message);
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return error(res, 'Refresh token required', 400);
        const decoded = verifyRefreshToken(refreshToken);
        const stored = await redis.get(`refresh:${decoded.userId}`);
        if (stored !== refreshToken) return error(res, 'Invalid refresh token', 401);
        const user = await User.findById(decoded.userId).lean();
        if (!user || !user.isActive) return error(res, 'User not found', 401);
        const newAccess = generateAccessToken({ userId: user._id, username: user.username, role: user.role });
        const newRefresh = genRefresh({ userId: user._id });
        await redis.setex(`refresh:${decoded.userId}`, 7 * 24 * 3600, newRefresh);
        return success(res, { accessToken: newAccess, refreshToken: newRefresh }, 'Token refreshed');
    } catch (err) {
        return error(res, 'Token refresh failed', 401);
    }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
    try {
        await logout(req.user._id, req.sessionId);
        await redis.setex(`blacklist:${req.token}`, 900, '1');
        await createLog({
            eventType: 'LOGOUT', userId: req.user._id, username: req.user.username,
            userRole: req.user.role, ipAddress: req.ip, action: 'logout', outcome: 'SUCCESS',
            resource: '/api/auth/logout', severity: 'INFO',
        });
        return success(res, null, 'Logged out successfully');
    } catch (err) {
        return error(res, 'Logout failed', 500, err.message);
    }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return error(res, 'User not found', 404);
        return success(res, user.toSafeObject());
    } catch (err) {
        return error(res, 'Failed to fetch profile', 500, err.message);
    }
});

// POST /api/auth/setup-mfa
router.post('/setup-mfa', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return error(res, 'User not found', 404);
        const secret = generateSecret(user.username);
        user.mfaSecret = secret.base32;
        user.mfaEnabled = true;
        await user.save();
        const qrCode = await generateQRCode(secret.otpauth_url);
        return success(res, { secret: secret.base32, qrCode, otpauthUrl: secret.otpauth_url }, 'MFA setup initiated');
    } catch (err) {
        return error(res, 'MFA setup failed', 500, err.message);
    }
});

module.exports = router;
