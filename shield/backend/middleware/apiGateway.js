const { extractDeviceFingerprint } = require('./deviceFingerprint');
const { extractGeolocation } = require('./geoValidation');

const apiGateway = [
    extractDeviceFingerprint,
    extractGeolocation,
];

module.exports = { apiGateway };
