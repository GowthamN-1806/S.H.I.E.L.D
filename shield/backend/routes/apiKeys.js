const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { success, error } = require('../utils/responseUtils');
const { generateApiKey, hashApiKey } = require('../utils/cryptoUtils');
const ApiKey = require('../models/ApiKey');
const { v4: uuidv4 } = require('uuid');

// GET /api/api-keys
router.get('/', requireAuth, requirePermission('api_keys', 'view'), async (req, res) => {
    try {
        const keys = await ApiKey.find().select('-hashedKey').sort({ createdAt: -1 }).lean();
        return success(res, keys);
    } catch (err) {
        return error(res, 'Failed to fetch API keys', 500, err.message);
    }
});

// POST /api/api-keys
router.post('/', requireAuth, requirePermission('api_keys', 'manage'), async (req, res) => {
    try {
        const { name, partnerName, scopes, rateLimitPerMinute, expiresInDays } = req.body;
        if (!name || !partnerName) return error(res, 'Name and partnerName are required', 400);
        const rawKey = generateApiKey();
        const prefix = rawKey.substring(0, 14);
        const apiKey = await ApiKey.create({
            keyId: uuidv4(), name, hashedKey: hashApiKey(rawKey), prefix,
            userId: req.user._id, partnerName, scopes: scopes || [],
            rateLimitPerMinute: rateLimitPerMinute || 10,
            expiresAt: new Date(Date.now() + (expiresInDays || 365) * 86400000),
            createdBy: req.user._id,
        });
        return success(res, { ...apiKey.toObject(), rawKey, hashedKey: undefined }, 'API key created. Save the raw key now — it cannot be retrieved again.', 201);
    } catch (err) {
        return error(res, 'Failed to create API key', 500, err.message);
    }
});

// POST /api/api-keys/:keyId/revoke
router.post('/:keyId/revoke', requireAuth, requirePermission('api_keys', 'manage'), async (req, res) => {
    try {
        const key = await ApiKey.findOneAndUpdate(
            { keyId: req.params.keyId },
            { isActive: false, revokedAt: new Date(), revokedBy: req.user._id },
            { new: true }
        ).select('-hashedKey');
        if (!key) return error(res, 'API key not found', 404);
        return success(res, key, 'API key revoked');
    } catch (err) {
        return error(res, 'Failed to revoke API key', 500, err.message);
    }
});

module.exports = router;
