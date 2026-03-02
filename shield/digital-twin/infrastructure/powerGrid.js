class PowerGrid {
    constructor() {
        this.sectors = [
            { id: 'PS-01', name: 'Commercial District', load: 72, capacity: 500, status: 'NORMAL', voltage: 230 },
            { id: 'PS-02', name: 'Residential North', load: 85, capacity: 350, status: 'HIGH_LOAD', voltage: 228 },
            { id: 'PS-03', name: 'Industrial Zone', load: 45, capacity: 800, status: 'NORMAL', voltage: 231 },
        ];
    }

    getStatus() {
        return {
            sectors: this.sectors.map(s => ({
                ...s,
                load: Math.min(100, Math.max(10, s.load + Math.floor((Math.random() - 0.5) * 8))),
                voltage: +(s.voltage + (Math.random() - 0.5) * 2).toFixed(0),
            })),
            totalGridLoad: Math.floor(this.sectors.reduce((a, s) => a + s.load, 0) / this.sectors.length),
            outageZones: [],
            lastUpdated: new Date().toISOString(),
        };
    }

    updateLoad(sectorId, loadLimit) {
        const sector = this.sectors.find(s => s.id === sectorId);
        if (!sector) return null;
        sector.load = Math.min(loadLimit, sector.load);
        return sector;
    }

    modifyGrid(config) {
        return { gridConfig: config, modifiedAt: new Date().toISOString() };
    }
}

module.exports = PowerGrid;
