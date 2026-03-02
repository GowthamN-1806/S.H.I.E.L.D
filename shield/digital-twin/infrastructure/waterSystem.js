class WaterSystem {
    constructor() {
        this.zones = [
            { id: 'WZ-01', name: 'Central Reservoir', flowRate: 1250, pressure: 4.2, ph: 7.1, chlorine: 0.5, status: 'NORMAL' },
            { id: 'WZ-02', name: 'East Treatment Plant', flowRate: 890, pressure: 3.8, ph: 7.3, chlorine: 0.4, status: 'NORMAL' },
            { id: 'WZ-03', name: 'West Distribution', flowRate: 620, pressure: 3.5, ph: 7.0, chlorine: 0.6, status: 'NORMAL' },
        ];
    }

    getStatus() {
        return {
            zones: this.zones.map(z => ({
                ...z,
                flowRate: z.flowRate + Math.floor((Math.random() - 0.5) * 50),
                pressure: +(z.pressure + (Math.random() - 0.5) * 0.3).toFixed(1),
            })),
            totalCapacityPercent: 78 + Math.floor(Math.random() * 10 - 5),
            lastUpdated: new Date().toISOString(),
        };
    }

    updateFlow(zoneId, flowRate) {
        const zone = this.zones.find(z => z.id === zoneId);
        if (!zone) return null;
        zone.flowRate = flowRate;
        return zone;
    }

    emergencyShutdown() {
        this.zones.forEach(z => { z.status = 'SHUTDOWN'; z.flowRate = 0; });
        return { status: 'EMERGENCY_SHUTDOWN', allValves: 'CLOSED' };
    }
}

module.exports = WaterSystem;
