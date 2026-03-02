const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { logSecurityEvent } = require('../services/auditLogger');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (in this demo, to create initial roles)
const registerUser = async (req, res) => {
    const { name, email, username, password, role } = req.body;

    try {
        const userExists = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User with email or username already exists in S.H.I.E.L.D' });
        }

        const user = await User.create({
            name,
            email,
            username,
            password,
            role,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                isActive: user.isActive,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data provided to gateway' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({
            username: new RegExp(`^${username}$`, 'i')
        });

        if (!user) {
            await logSecurityEvent({
                user: { username, role: 'Unknown' },
                endpoint: req.originalUrl,
                method: req.method,
                action: 'LOGIN_FAILURE',
                outcome: 'DENIED',
                severity: 'WARNING',
                ipAddress: req.ip,
                metadata: { reason: 'Invalid S.H.I.E.L.D credentials (user not found)' }
            });
            return res.status(401).json({ message: 'Invalid S.H.I.E.L.D credentials' });
        }

        if (!user.isActive) {
            await logSecurityEvent({
                user,
                endpoint: req.originalUrl,
                method: req.method,
                action: 'LOGIN_FAILURE',
                outcome: 'BLOCKED',
                severity: 'WARNING',
                ipAddress: req.ip,
                metadata: { reason: 'S.H.I.E.L.D Account is inactive' }
            });
            return res.status(401).json({ message: 'S.H.I.E.L.D Account is inactive' });
        }

        if (await user.comparePassword(password)) {
            await logSecurityEvent({
                user,
                endpoint: req.originalUrl,
                method: req.method,
                action: 'LOGIN_SUCCESS',
                outcome: 'SUCCESS',
                severity: 'INFO',
                ipAddress: req.ip
            });

            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                isActive: user.isActive,
                token: generateToken(user._id, user.role),
            });
        } else {
            await logSecurityEvent({
                user,
                endpoint: req.originalUrl,
                method: req.method,
                action: 'LOGIN_FAILURE',
                outcome: 'DENIED',
                severity: 'WARNING',
                ipAddress: req.ip,
                metadata: { reason: 'Invalid S.H.I.E.L.D credentials (wrong password)' }
            });
            res.status(401).json({ message: 'Invalid S.H.I.E.L.D credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

const logoutUser = async (req, res) => {
    // The client simply trashes their JWT, but we can log the intentional logout if they hit this endpoint

    // We assume they provide the token to auth this request so we know who is logging out
    if (req.user) {
        await logSecurityEvent({
            user: req.user,
            endpoint: req.originalUrl,
            method: req.method,
            action: 'LOGOUT',
            outcome: 'SUCCESS',
            severity: 'INFO',
            ipAddress: req.ip
        });
    }

    res.status(200).json({ message: 'S.H.I.E.L.D Gateway session terminated' });
};

module.exports = { registerUser, authUser, logoutUser };
