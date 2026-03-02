const axios = require('axios');

class ApiAbuseAttack {
    constructor(backendUrl) {
        this.backendUrl = backendUrl || 'http://localhost:3000';
    }

    async run(targetSystem, intensity, durationSec, onEvent) {
        const stats = { eventsGenerated: 0, alertsTriggered: 0, blocked: 0, detectionTimeMs: 0 };
        const startTime = Date.now();
        const intervalMs = intensity === 'HIGH' ? 100 : intensity === 'MEDIUM' ? 500 : 1500;
        const endpoints = [
            `/api/city/${targetSystem}/status`,
            `/api/city/${targetSystem}/status`,
            `/api/city/${targetSystem}/status`,
        ];

        return new Promise((resolve) => {
            const interval = setInterval(async () => {
                if (Date.now() - startTime >= durationSec * 1000) {
                    clearInterval(interval);
                    stats.detectionTimeMs = Math.min(Date.now() - startTime, 3000);
                    return resolve(stats);
                }
                stats.eventsGenerated++;
                const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
                try {
                    await axios.get(`${this.backendUrl}${ep}`, { timeout: 2000 });
                } catch (err) {
                    if (err.response?.status === 429) stats.blocked++;
                }
                onEvent?.({
                    type: 'API_FLOOD', target: targetSystem, endpoint: ep,
                    attempt: stats.eventsGenerated, timestamp: new Date().toISOString(),
                });
            }, intervalMs);
        });
    }
}

module.exports = ApiAbuseAttack;
