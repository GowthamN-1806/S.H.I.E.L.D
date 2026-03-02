const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post(
    '/manageSupply',
    protect,
    authorizeRoles('Super Admin', 'Water Authority Operator'),
    (req, res) => {
        const { zone, command } = req.body;
        res.status(200).json({
            message: 'S.H.I.E.L.D Gateway Authorized Request.',
            action: `Water supply for ${zone || 'City Center'} set to ${command || 'Normal Flow'}`,
            executedBy: req.user.role
        });
    }
);

module.exports = router;
