class TrafficSystem {
    constructor() {
        this.signals = [
            { id: 'SIG-001', intersection: 'MG Road x FC Road', state: 'GREEN', timing: 45, congestion: 0.3 },
            { id: 'SIG-002', intersection: 'JM Road x University', state: 'RED', timing: 30, congestion: 0.7 },
            { id: 'SIG-003', intersection: 'Hinjawadi IT Park Entry', state: 'GREEN', timing: 60, congestion: 0.85 },
            { id: 'SIG-004', intersection: 'Airport Road x NH4', state: 'YELLOW', timing: 5, congestion: 0.55 },
        ];
    }

    getStatus() {
        // Simulate slight variation
        return {
            signals: this.signals.map(s => ({
                ...s,
                congestion: Math.min(1, Math.max(0, s.congestion + (Math.random() - 0.5) * 0.1)),
            })),
            averageCongestion: +(this.signals.reduce((a, s) => a + s.congestion, 0) / this.signals.length).toFixed(2),
            activeIncidents: Math.floor(Math.random() * 3),
            lastUpdated: new Date().toISOString(),
        };
    }

    updateSignal(id, state, timing) {
        const signal = this.signals.find(s => s.id === id);
        if (!signal) return null;
        if (state) signal.state = state;
        if (timing) signal.timing = timing;
        return signal;
    }

    activateEmergency() {
        this.signals.forEach(s => { s.state = 'FLASHING'; });
        return { mode: 'EMERGENCY', allSignals: 'FLASHING', corridorCleared: true };
    }
}

module.exports = TrafficSystem;
