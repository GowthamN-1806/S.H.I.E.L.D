const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { evaluatePolicy } = require('../middleware/abac');
const { success, error } = require('../utils/responseUtils');
const { analyzeEvent } = require('../services/anomalyService');
const { createAlert } = require('../services/alertService');

// Helper: analyze access and potentially create alert
async function analyzeAccess(req, system, action) {
    try {
        const event = {
            userId: req.user._id, username: req.user.username, role: req.user.role,
            system, action, ipAddress: req.ip,
            outsideWorkingHours: false, unknownDevice: false, outsideAllowedLocation: false,
            impossibleTravel: false, requestRateRatio: 1, failedAttempts: 0,
        };
        const result = await analyzeEvent(event);
        if (result.anomaly_detected || result.risk_score > 60) {
            await createAlert({
                title: `Anomalous access: ${req.user.username} → ${system}:${action}`,
                description: result.explanation || `Risk score ${result.risk_score}`,
                severity: result.risk_score > 80 ? 'CRITICAL' : result.risk_score > 60 ? 'HIGH' : 'WARNING',
                source: 'SADE', targetSystem: system,
                userId: req.user._id, username: req.user.username,
                ipAddress: req.ip, riskScore: result.risk_score,
                anomalyType: result.anomaly_type || '', explanation: result.explanation || '',
            });
        }
        return result;
    } catch (e) {
        return { risk_score: 0, anomaly_detected: false };
    }
}

// ═══ TRAFFIC ═══
router.get('/traffic/status', requireAuth, requirePermission('traffic', 'read'), async (req, res) => {
    try {
        await analyzeAccess(req, 'traffic', 'read');
        return success(res, {
            signals: [
                { id: 'SIG-001', intersection: 'MG Road x FC Road', state: 'GREEN', timing: 45, congestion: 0.3 },
                { id: 'SIG-002', intersection: 'JM Road x University', state: 'RED', timing: 30, congestion: 0.7 },
                { id: 'SIG-003', intersection: 'Hinjawadi IT Park Entry', state: 'GREEN', timing: 60, congestion: 0.85 },
            ],
            averageCongestion: 0.62, activeIncidents: 1,
            lastUpdated: new Date().toISOString(),
        });
    } catch (err) { return error(res, 'Failed to fetch traffic status', 500); }
});

router.post('/traffic/signals/:id', requireAuth, requirePermission('traffic', 'control'),
    evaluatePolicy('traffic', 'control'), async (req, res) => {
        try {
            await analyzeAccess(req, 'traffic', 'control');
            const { state, timing } = req.body;
            return success(res, {
                signalId: req.params.id, state: state || 'GREEN', timing: timing || 45,
                updatedBy: req.user.username, updatedAt: new Date().toISOString(),
            }, 'Signal updated');
        } catch (err) { return error(res, 'Failed to update signal', 500); }
    });

router.post('/traffic/emergency', requireAuth, requirePermission('traffic', 'emergency_override'), async (req, res) => {
    try {
        await analyzeAccess(req, 'traffic', 'emergency_override');
        return success(res, {
            mode: 'EMERGENCY', allSignals: 'FLASHING', corridorCleared: true,
            activatedBy: req.user.username, activatedAt: new Date().toISOString(),
        }, 'Emergency traffic override activated');
    } catch (err) { return error(res, 'Failed to activate emergency mode', 500); }
});

// ═══ WATER ═══
router.get('/water/status', requireAuth, requirePermission('water', 'read'), async (req, res) => {
    try {
        await analyzeAccess(req, 'water', 'read');
        return success(res, {
            zones: [
                { id: 'WZ-01', name: 'Central Reservoir', flowRate: 1250, pressure: 4.2, ph: 7.1, chlorine: 0.5, status: 'NORMAL' },
                { id: 'WZ-02', name: 'East Treatment Plant', flowRate: 890, pressure: 3.8, ph: 7.3, chlorine: 0.4, status: 'NORMAL' },
                { id: 'WZ-03', name: 'West Distribution', flowRate: 620, pressure: 3.5, ph: 7.0, chlorine: 0.6, status: 'ELEVATED' },
            ],
            totalCapacityPercent: 78, lastUpdated: new Date().toISOString(),
        });
    } catch (err) { return error(res, 'Failed to fetch water status', 500); }
});

router.post('/water/flow/:zone', requireAuth, requirePermission('water', 'control'),
    evaluatePolicy('water', 'control'), async (req, res) => {
        try {
            await analyzeAccess(req, 'water', 'control');
            return success(res, {
                zone: req.params.zone, newFlowRate: req.body.flowRate || 1000,
                updatedBy: req.user.username, updatedAt: new Date().toISOString(),
            }, 'Flow rate updated');
        } catch (err) { return error(res, 'Failed to update flow rate', 500); }
    });

router.post('/water/emergency-shutdown', requireAuth, requirePermission('water', 'emergency_shutdown'), async (req, res) => {
    try {
        await analyzeAccess(req, 'water', 'emergency_shutdown');
        return success(res, {
            status: 'EMERGENCY_SHUTDOWN', allValves: 'CLOSED',
            activatedBy: req.user.username, activatedAt: new Date().toISOString(),
        }, 'Emergency water shutdown initiated');
    } catch (err) { return error(res, 'Failed to initiate shutdown', 500); }
});

// ═══ POWER ═══
router.get('/power/status', requireAuth, requirePermission('power', 'read'), async (req, res) => {
    try {
        await analyzeAccess(req, 'power', 'read');
        return success(res, {
            sectors: [
                { id: 'PS-01', name: 'Commercial District', load: 72, capacity: 500, status: 'NORMAL', voltage: 230 },
                { id: 'PS-02', name: 'Residential North', load: 85, capacity: 350, status: 'HIGH_LOAD', voltage: 228 },
                { id: 'PS-03', name: 'Industrial Zone', load: 45, capacity: 800, status: 'NORMAL', voltage: 231 },
            ],
            totalGridLoad: 67, outageZones: [], lastUpdated: new Date().toISOString(),
        });
    } catch (err) { return error(res, 'Failed to fetch power status', 500); }
});

router.post('/power/load/:sector', requireAuth, requirePermission('power', 'control'),
    evaluatePolicy('power', 'control'), async (req, res) => {
        try {
            await analyzeAccess(req, 'power', 'control');
            return success(res, {
                sector: req.params.sector, newLoadLimit: req.body.loadLimit || 80,
                updatedBy: req.user.username, updatedAt: new Date().toISOString(),
            }, 'Load limit updated');
        } catch (err) { return error(res, 'Failed to update load', 500); }
    });

router.patch('/power/grid', requireAuth, requirePermission('power', 'grid_modify'),
    evaluatePolicy('power', 'grid_modify'), async (req, res) => {
        try {
            await analyzeAccess(req, 'power', 'grid_modify');
            return success(res, {
                gridConfig: req.body, modifiedBy: req.user.username,
                modifiedAt: new Date().toISOString(),
            }, 'Grid configuration updated');
        } catch (err) { return error(res, 'Failed to modify grid', 500); }
    });

// ═══ EMERGENCY ═══
router.get('/emergency/incidents', requireAuth, requirePermission('emergency', 'read'), async (req, res) => {
    try {
        await analyzeAccess(req, 'emergency', 'read');
        return success(res, {
            activeIncidents: [
                { id: 'INC-001', type: 'TRAFFIC_ACCIDENT', location: 'MG Road', severity: 'MEDIUM', unitsDispatched: 2, eta: '8 min' },
            ],
            availableUnits: { ambulance: 12, fire: 8, police: 24 },
            totalIncidentsToday: 7, lastUpdated: new Date().toISOString(),
        });
    } catch (err) { return error(res, 'Failed to fetch incidents', 500); }
});

router.post('/emergency/dispatch', requireAuth, requirePermission('emergency', 'dispatch'), async (req, res) => {
    try {
        await analyzeAccess(req, 'emergency', 'dispatch');
        const { unitType, incidentId, location } = req.body;
        return success(res, {
            dispatchId: `DSP-${Date.now()}`, unitType: unitType || 'police',
            incidentId, location, dispatchedBy: req.user.username,
            dispatchedAt: new Date().toISOString(), eta: '12 min',
        }, 'Unit dispatched');
    } catch (err) { return error(res, 'Failed to dispatch', 500); }
});

module.exports = router;
