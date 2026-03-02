const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const AccessLog = require('../models/AccessLog');

// @desc    Get all activity logs
// @route   GET /api/admin/logs
// @access  Private/Super Admin ONLY
router.get('/logs', protect, authorizeRoles('Super Admin'), async (req, res) => {
    try {
        const pageSize = 50;
        const page = Number(req.query.page) || 1;

        const count = await AccessLog.countDocuments();

        // Fetch logs descending (newest first)
        const logs = await AccessLog.find({})
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.status(200).json({
            success: true,
            count,
            page,
            pages: Math.ceil(count / pageSize),
            logs,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving S.H.I.E.L.D logs', error: error.message });
    }
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Super Admin ONLY
router.get('/stats', protect, authorizeRoles('Super Admin'), async (req, res) => {
    try {
        const User = require('../models/User');

        const totalUsers = await User.countDocuments();
        const activeUsersCount = await User.countDocuments({ isActive: true });
        const totalRequests = await AccessLog.countDocuments();

        const deniedRequestsCount = await AccessLog.countDocuments({ outcome: { $in: ['DENIED', 'BLOCKED'] } });
        const loginSuccessCount = await AccessLog.countDocuments({ action: 'LOGIN_SUCCESS' });
        const loginFailureCount = await AccessLog.countDocuments({ action: 'LOGIN_FAILURE' });
        const rbacDeniedCount = await AccessLog.countDocuments({ action: 'RBAC_DENIED' });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeSessions: activeUsersCount, // Simplified representation
                totalRequests,
                deniedRequestsCount,
                loginSuccessCount,
                loginFailureCount,
                rbacDeniedCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving S.H.I.E.L.D stats', error: error.message });
    }
});

// @desc    Get system status
// @route   GET /api/admin/system-status
// @access  Private/Super Admin ONLY
router.get('/system-status', protect, authorizeRoles('Super Admin'), async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

        res.status(200).json({
            success: true,
            status: {
                gateway: 'Operational',
                database: dbStatus,
                uptime: `${Math.floor(process.uptime() / 60)} minutes`,
                version: 'S.H.I.E.L.D v1.0'
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving system status', error: error.message });
    }
});

module.exports = router;
