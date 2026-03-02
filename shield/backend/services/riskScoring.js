const { ROLE_SENSITIVITY, RISK_THRESHOLDS } = require('../utils/constants');

const calculateRiskScore = (event) => {
    let score = 0;
    const factors = [];

    // +30 → Outside working hours
    if (event.outsideWorkingHours) {
        score += 30;
        factors.push({ factor: 'Outside working hours', points: 30 });
    } else {
        score -= 5;
        factors.push({ factor: 'Within working hours', points: -5 });
    }

    // +25 → Unregistered device
    if (event.unknownDevice) {
        score += 25;
        factors.push({ factor: 'Unregistered device fingerprint', points: 25 });
    } else {
        score -= 5;
        factors.push({ factor: 'Trusted device', points: -5 });
    }

    // +20 → Outside allowed locations
    if (event.outsideAllowedLocation) {
        score += 20;
        factors.push({ factor: 'Outside allowed locations', points: 20 });
    } else {
        score -= 10;
        factors.push({ factor: 'Trusted location', points: -10 });
    }

    // +35 → Impossible travel
    if (event.impossibleTravel) {
        score += 35;
        factors.push({ factor: 'Impossible travel detected', points: 35 });
    }

    // +15/40 → API rate anomaly
    if (event.requestRateRatio > 10) {
        score += 40;
        factors.push({ factor: `API rate 10x above average (${event.requestRateRatio.toFixed(1)}x)`, points: 40 });
    } else if (event.requestRateRatio > 3) {
        score += 15;
        factors.push({ factor: `API rate 3x above average (${event.requestRateRatio.toFixed(1)}x)`, points: 15 });
    }

    // +20 → New resource type
    if (event.accessingNewResourceType) {
        score += 20;
        factors.push({ factor: 'First access to this resource type in 30 days', points: 20 });
    }

    // +50 → Repeated failed IP
    if (event.repeatedFailedIp) {
        score += 50;
        factors.push({ factor: 'Failed login from same IP as prior failures', points: 50 });
    }

    // +10 per failed attempt
    if (event.failedAttempts > 0) {
        const pts = Math.min(event.failedAttempts * 10, 50);
        score += pts;
        factors.push({ factor: `${event.failedAttempts} failed login attempts`, points: pts });
    }

    // +25 → Privilege escalation attempt
    if (event.privilegeEscalation) {
        score += 25;
        factors.push({ factor: 'Privilege escalation attempt', points: 25 });
    }

    // +30 → Large data export
    if (event.largeDataExport) {
        score += 30;
        factors.push({ factor: 'Response size 10x above user average', points: 30 });
    }

    // +15 → Rapid multi-system access
    if (event.rapidMultiSystemAccess) {
        score += 15;
        factors.push({ factor: 'Rapid sequential access to multiple system types', points: 15 });
    }

    // Clamp
    score = Math.max(0, Math.min(100, score));

    // Determine recommendation
    let recommendation = 'ALLOW';
    let level = 'LOW';
    for (const [key, range] of Object.entries(RISK_THRESHOLDS)) {
        if (score >= range.min && score <= range.max) {
            recommendation = range.action;
            level = key;
            break;
        }
    }

    return { score, level, factors, recommendation };
};

const buildEventFromRequest = (req, user) => {
    const now = new Date();
    const deviceFps = (user.deviceFingerprints || []).map((d) => d.fingerprint);
    const knownDevice = deviceFps.includes(req.deviceFingerprint || '');

    return {
        outsideWorkingHours: user.isWithinWorkingHours ? !user.isWithinWorkingHours() : false,
        unknownDevice: !knownDevice,
        outsideAllowedLocation: false,
        impossibleTravel: false,
        requestRateRatio: 1,
        accessingNewResourceType: false,
        repeatedFailedIp: false,
        failedAttempts: user.failedLoginAttempts || 0,
        privilegeEscalation: false,
        largeDataExport: false,
        rapidMultiSystemAccess: false,
    };
};

module.exports = { calculateRiskScore, buildEventFromRequest };
