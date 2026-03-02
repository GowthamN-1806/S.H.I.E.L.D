const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const generateSecret = (username) => {
    return speakeasy.generateSecret({
        name: `SHIELD-SmartCity:${username}`,
        issuer: process.env.MFA_ISSUER || 'SHIELD-SmartCity',
        length: 20,
    });
};

const generateQRCode = async (otpauthUrl) => {
    try {
        return await QRCode.toDataURL(otpauthUrl);
    } catch (err) {
        console.error('[MFA] QR code generation failed:', err.message);
        return null;
    }
};

const verifyToken = (secret, token) => {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2,
    });
};

const generateCurrentToken = (secret) => {
    return speakeasy.totp({ secret, encoding: 'base32' });
};

module.exports = { generateSecret, generateQRCode, verifyToken, generateCurrentToken };
