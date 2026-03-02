const axios = require('axios');

class BruteForceAttack {
    constructor(backendUrl) {
        this.backendUrl = backendUrl || 'http://localhost:3000';
    }

    async run(target, intensity, durationSec, onEvent) {
        const stats = { eventsGenerated: 0, alertsTriggered: 0, blocked: 0, detectionTimeMs: 0 };
        const startTime = Date.now();
        const intervalMs = intensity === 'HIGH' ? 500 : intensity === 'MEDIUM' ? 1500 : 3000;
        const usernames = [target || 'fatima.alhassan', 'alex.chen', 'priya.sharma'];
        const passwords = ['wrong1', 'wrong2', 'admin123', 'password', 'Shield@2023'];

        return new Promise((resolve) => {
            const interval = setInterval(async () => {
                const elapsed = Date.now() - startTime;
                if (elapsed >= durationSec * 1000) {
                    clearInterval(interval);
                    stats.detectionTimeMs = Math.min(elapsed, 5000);
                    return resolve(stats);
                }
                const username = usernames[Math.floor(Math.random() * usernames.length)];
                const password = passwords[Math.floor(Math.random() * passwords.length)];
                stats.eventsGenerated++;
                try {
                    await axios.post(`${this.backendUrl}/api/auth/login`, { username, password, deviceFingerprint: 'attacker-fp-001' }, { timeout: 3000 });
                } catch (err) {
                    const status = err.response?.status;
                    if (status === 429) stats.blocked++;
                    if (status === 423) stats.blocked++;
                }
                onEvent?.({
                    type: 'BRUTE_FORCE', target: username, attempt: stats.eventsGenerated,
                    timestamp: new Date().toISOString(), blocked: stats.blocked,
                });
            }, intervalMs);
        });
    }
}

module.exports = BruteForceAttack;
