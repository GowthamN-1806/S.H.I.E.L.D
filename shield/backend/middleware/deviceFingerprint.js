const { generateFingerprint } = require('../utils/cryptoUtils');

const extractDeviceFingerprint = (req, res, next) => {
    const components = {
        userAgent: req.headers['user-agent'] || '',
        acceptLang: req.headers['accept-language'] || '',
        customFp: req.headers['x-device-fingerprint'] || '',
        ip: req.ip || '',
    };
    req.deviceFingerprint = components.customFp || generateFingerprint(components);
    next();
};

module.exports = { extractDeviceFingerprint };
