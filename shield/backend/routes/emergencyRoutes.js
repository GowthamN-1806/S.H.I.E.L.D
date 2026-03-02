const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post(
    '/dispatch',
    protect,
    authorizeRoles('Super Admin', 'Emergency Services'),
    (req, res) => {
        const { unit, location } = req.body;
        res.status(200).json({
            message: 'S.H.I.E.L.D Gateway Authorized Request. Priority Protocol Initiated.',
            unitDispatched: unit || 'Ambulance 12',
            targetLocation: location || 'City Hall',
            dispatchedBy: req.user.role
        });
    }
);

module.exports = router;
