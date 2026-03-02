const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Simulated traffic control endpoint
// Requires authentication AND specifically the Super Admin or Traffic Department Officer role
router.post(
    '/controlSignal',
    protect,
    authorizeRoles('Super Admin', 'Traffic Department Officer', 'Emergency Services'),
    (req, res) => {
        const { signalId, status } = req.body;
        // In reality, this would talk to the SCADA system or IoT controller
        res.status(200).json({
            message: 'S.H.I.E.L.D Gateway Authorized Request. Infrastructure updated.',
            action: `Traffic signal ${signalId || 'unknown'} set to ${status || 'override'}`,
            executedBy: req.user.role
        });
    }
);

// Simulated read-only endpoint (accessible by more roles)
router.get(
    '/status',
    protect,
    authorizeRoles('Super Admin', 'City Administrator', 'Traffic Department Officer', 'Emergency Services'),
    (req, res) => {
        res.status(200).json({
            message: 'Traffic network operational',
            congestionLevel: 'Low',
            activeOverrides: 0
        });
    }
);

module.exports = router;
