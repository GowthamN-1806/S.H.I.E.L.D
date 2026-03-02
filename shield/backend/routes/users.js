const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { success, error, paginated } = require('../utils/responseUtils');
const User = require('../models/User');

// GET /api/users
router.get('/', requireAuth, requirePermission('users', 'read'), async (req, res) => {
    try {
        const { page = 1, limit = 20, role, department } = req.query;
        const query = {};
        if (role) query.role = role;
        if (department) query.department = new RegExp(department, 'i');
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password -mfaSecret')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();
        return paginated(res, users, total, page, limit);
    } catch (err) {
        return error(res, 'Failed to fetch users', 500, err.message);
    }
});

// GET /api/users/:id
router.get('/:id', requireAuth, requirePermission('users', 'read'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -mfaSecret').lean();
        if (!user) return error(res, 'User not found', 404);
        return success(res, user);
    } catch (err) {
        return error(res, 'Failed to fetch user', 500, err.message);
    }
});

// POST /api/users
router.post('/', requireAuth, requirePermission('users', 'create'), async (req, res) => {
    try {
        const { username, email, password, role, department, employeeId } = req.body;
        if (!username || !email || !password || !role) {
            return error(res, 'username, email, password, and role are required', 400);
        }
        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) return error(res, 'Username or email already exists', 409);
        const user = await User.create({
            username, email, password, role, department, employeeId,
            createdBy: req.user._id,
        });
        return success(res, user.toSafeObject(), 'User created', 201);
    } catch (err) {
        return error(res, 'Failed to create user', 500, err.message);
    }
});

// PATCH /api/users/:id
router.patch('/:id', requireAuth, requirePermission('users', 'modify'), async (req, res) => {
    try {
        const allowed = ['email', 'role', 'department', 'isActive', 'workingHours', 'allowedLocations'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password -mfaSecret');
        if (!user) return error(res, 'User not found', 404);
        return success(res, user, 'User updated');
    } catch (err) {
        return error(res, 'Failed to update user', 500, err.message);
    }
});

// POST /api/users/:id/lock
router.post('/:id/lock', requireAuth, requirePermission('users', 'lock'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isLocked: true, lockoutUntil: new Date('2099-12-31') },
            { new: true }
        ).select('-password -mfaSecret');
        if (!user) return error(res, 'User not found', 404);
        return success(res, user, 'User locked');
    } catch (err) {
        return error(res, 'Failed to lock user', 500, err.message);
    }
});

// POST /api/users/:id/unlock
router.post('/:id/unlock', requireAuth, requirePermission('users', 'lock'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isLocked: false, lockoutUntil: null, failedLoginAttempts: 0 },
            { new: true }
        ).select('-password -mfaSecret');
        if (!user) return error(res, 'User not found', 404);
        return success(res, user, 'User unlocked');
    } catch (err) {
        return error(res, 'Failed to unlock user', 500, err.message);
    }
});

module.exports = router;
