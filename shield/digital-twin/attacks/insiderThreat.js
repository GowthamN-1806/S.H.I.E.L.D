const axios = require('axios');

class InsiderThreatAttack {
    constructor(backendUrl) {
        this.backendUrl = backendUrl || 'http://localhost:3000';
    }

    async run(targetSystem, intensity, durationSec, onEvent) {
        const stats = { eventsGenerated: 0, alertsTriggered: 0, blocked: 0, detectionTimeMs: 0 };
        const startTime = Date.now();
        const intervalMs = intensity === 'HIGH' ? 1000 : intensity === 'MEDIUM' ? 3000 : 5000;

        // Simulate an insider trying to access systems beyond their role
        const unauthorizedEndpoints = [
            `/api/city/water/emergency-shutdown`,
            `/api/city/power/grid`,
            `/api/city/emergency/dispatch`,
            `/api/users`,
        ];

        return new Promise((resolve) => {
            const interval = setInterval(async () => {
                if (Date.now() - startTime >= durationSec * 1000) {
                    clearInterval(interval);
                    stats.detectionTimeMs = Math.min(Date.now() - startTime, 8000);
                    return resolve(stats);
                }
                stats.eventsGenerated++;
                const ep = unauthorizedEndpoints[Math.floor(Math.random() * unauthorizedEndpoints.length)];
                try {
                    await axios.post(`${this.backendUrl}${ep}`, {}, { timeout: 3000 });
                } catch (err) {
                    if (err.response?.status === 403) stats.blocked++;
                    if (err.response?.status === 401) stats.blocked++;
                }
                onEvent?.({
                    type: 'INSIDER_THREAT', target: targetSystem, endpoint: ep,
                    attempt: stats.eventsGenerated, timestamp: new Date().toISOString(),
                });
            }, intervalMs);
        });
    }
}

module.exports = InsiderThreatAttack;
