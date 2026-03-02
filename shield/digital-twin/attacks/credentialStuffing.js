const axios = require('axios');

class CredentialStuffingAttack {
    constructor(backendUrl) {
        this.backendUrl = backendUrl || 'http://localhost:3000';
    }

    async run(target, intensity, durationSec, onEvent) {
        const stats = { eventsGenerated: 0, alertsTriggered: 0, blocked: 0, detectionTimeMs: 0 };
        const startTime = Date.now();
        const intervalMs = intensity === 'HIGH' ? 300 : intensity === 'MEDIUM' ? 1000 : 2500;

        // Leaked credential pairs (all wrong for this system)
        const credentials = [
            { u: 'admin', p: 'admin123' }, { u: 'root', p: 'toor' },
            { u: 'alex.chen', p: 'password1' }, { u: 'priya.sharma', p: 'qwerty' },
            { u: 'fatima.alhassan', p: 'letmein' }, { u: 'james.okafor', p: '123456' },
            { u: 'kai.nakamura', p: 'hunter2' }, { u: 'sarah.kowalski', p: 'welcome1' },
        ];

        return new Promise((resolve) => {
            let idx = 0;
            const interval = setInterval(async () => {
                if (Date.now() - startTime >= durationSec * 1000) {
                    clearInterval(interval);
                    stats.detectionTimeMs = Math.min(Date.now() - startTime, 4000);
                    return resolve(stats);
                }
                const cred = credentials[idx % credentials.length];
                idx++;
                stats.eventsGenerated++;
                try {
                    await axios.post(`${this.backendUrl}/api/auth/login`, {
                        username: cred.u, password: cred.p, deviceFingerprint: 'stuffing-bot-fp',
                    }, { timeout: 3000 });
                } catch (err) {
                    if (err.response?.status === 429 || err.response?.status === 423) stats.blocked++;
                }
                onEvent?.({
                    type: 'CREDENTIAL_STUFFING', target: cred.u, attempt: stats.eventsGenerated,
                    timestamp: new Date().toISOString(),
                });
            }, intervalMs);
        });
    }
}

module.exports = CredentialStuffingAttack;
