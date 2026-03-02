class EmergencySystem {
    constructor() {
        this.incidents = [
            { id: 'INC-001', type: 'TRAFFIC_ACCIDENT', location: 'MG Road', severity: 'MEDIUM', unitsDispatched: 2, eta: '8 min', status: 'ACTIVE' },
        ];
        this.units = { ambulance: 12, fire: 8, police: 24 };
    }

    getIncidents() {
        return {
            activeIncidents: this.incidents.filter(i => i.status === 'ACTIVE'),
            availableUnits: { ...this.units },
            totalIncidentsToday: 7 + Math.floor(Math.random() * 5),
            lastUpdated: new Date().toISOString(),
        };
    }

    dispatch(unitType, incidentId, location) {
        if (this.units[unitType] <= 0) return { error: `No ${unitType} units available` };
        this.units[unitType]--;
        return {
            dispatchId: `DSP-${Date.now()}`, unitType, incidentId, location,
            dispatchedAt: new Date().toISOString(), eta: Math.floor(5 + Math.random() * 15) + ' min',
        };
    }
}

module.exports = EmergencySystem;
