const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get(
    '/gridStatus',
    protect,
    authorizeRoles('Super Admin', 'City Administrator', 'Power Grid Operator'),
    (req, res) => {
        res.status(200).json({
            message: 'S.H.I.E.L.D Gateway Authorized Request.',
            status: 'Stable',
            loadPercentage: 62,
            accessedBy: req.user.role
        });
    }
);

module.exports = router;
