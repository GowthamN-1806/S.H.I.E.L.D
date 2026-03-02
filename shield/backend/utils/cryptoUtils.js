const crypto = require('crypto');

const sha256 = (data) => {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const generateFingerprint = (components) => {
    const raw = Object.values(components).sort().join('|');
    return sha256(raw);
};

const generateApiKey = () => {
    return `shield_${crypto.randomBytes(32).toString('hex')}`;
};

const hashApiKey = (key) => {
    return sha256(key);
};

const generateSessionId = () => {
    return crypto.randomUUID();
};

module.exports = { sha256, generateFingerprint, generateApiKey, hashApiKey, generateSessionId };
