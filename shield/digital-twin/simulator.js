require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const TrafficSystem = require('./infrastructure/trafficSystem');
const WaterSystem = require('./infrastructure/waterSystem');
const PowerGrid = require('./infrastructure/powerGrid');
const EmergencySystem = require('./infrastructure/emergencySystem');
const BruteForceAttack = require('./attacks/bruteForce');
const ApiAbuseAttack = require('./attacks/apiAbuse');
const InsiderThreatAttack = require('./attacks/insiderThreat');
const CredentialStuffingAttack = require('./attacks/credentialStuffing');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Infrastructure instances
const traffic = new TrafficSystem();
const water = new WaterSystem();
const power = new PowerGrid();
const emergency = new EmergencySystem();

// Simulation state
let simState = { status: 'IDLE', currentAttack: null, progress: 0 };

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Attack instances
const attacks = {
    brute_force: new BruteForceAttack(BACKEND_URL),
    api_flood: new ApiAbuseAttack(BACKEND_URL),
    insider_threat: new InsiderThreatAttack(BACKEND_URL),
    credential_stuffing: new CredentialStuffingAttack(BACKEND_URL),
};

// ═══ INFRASTRUCTURE STATUS ENDPOINTS ═══
app.get('/api/twin/traffic', (req, res) => res.json(traffic.getStatus()));
app.get('/api/twin/water', (req, res) => res.json(water.getStatus()));
app.get('/api/twin/power', (req, res) => res.json(power.getStatus()));
app.get('/api/twin/emergency', (req, res) => res.json(emergency.getIncidents()));
app.get('/api/twin/status', (req, res) => res.json(simState));

// ═══ ATTACK SIMULATION ═══
app.post('/api/twin/simulate', async (req, res) => {
    const { attackType, targetSystem, intensity, duration } = req.body;

    if (simState.status === 'RUNNING') {
        return res.status(409).json({ error: 'Simulation already running' });
    }

    const attack = attacks[attackType];
    if (!attack) {
        return res.status(400).json({ error: `Unknown attack type: ${attackType}. Valid: ${Object.keys(attacks).join(', ')}` });
    }

    simState = { status: 'RUNNING', currentAttack: attackType, targetSystem, intensity, progress: 0 };
    io.emit('attack_simulation_event', { type: 'START', ...simState, timestamp: new Date().toISOString() });
    res.json({ message: 'Simulation started', ...simState });

    const durationSec = duration || 30;
    const startTime = Date.now();

    // Progress timer
    const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        simState.progress = Math.min(100, Math.floor((elapsed / durationSec) * 100));
        io.emit('attack_simulation_event', {
            type: 'PROGRESS', progress: simState.progress, elapsed: elapsed.toFixed(1),
            timestamp: new Date().toISOString(),
        });
    }, 2000);

    try {
        const result = await attack.run(targetSystem, intensity || 'MEDIUM', durationSec, (event) => {
            io.emit('attack_simulation_event', { type: 'EVENT', ...event });
        });

        clearInterval(progressInterval);
        const resilienceScore = result.blocked > 0 ? Math.floor((result.blocked / Math.max(1, result.eventsGenerated)) * 100) : 0;
        simState = { status: 'COMPLETED', currentAttack: null, progress: 100 };

        const summary = {
            type: 'COMPLETED', attackType, targetSystem, intensity, durationSec,
            ...result, resilienceScore,
            detectionRate: result.eventsGenerated > 0 ? `${Math.floor((result.blocked / result.eventsGenerated) * 100)}%` : '0%',
            timestamp: new Date().toISOString(),
        };
        io.emit('attack_simulation_event', summary);
    } catch (err) {
        clearInterval(progressInterval);
        simState = { status: 'IDLE', currentAttack: null, progress: 0 };
        io.emit('attack_simulation_event', { type: 'ERROR', error: err.message, timestamp: new Date().toISOString() });
    }
});

app.post('/api/twin/reset', (req, res) => {
    simState = { status: 'IDLE', currentAttack: null, progress: 0 };
    io.emit('attack_simulation_event', { type: 'RESET', timestamp: new Date().toISOString() });
    res.json({ message: 'Simulation reset' });
});

app.get('/api/twin/health', (req, res) => res.json({ status: 'operational', service: 'digital-twin' }));

// Socket.IO
io.on('connection', (socket) => {
    console.log(`[TWIN] Client connected: ${socket.id}`);
    socket.emit('attack_simulation_event', { type: 'STATUS', ...simState });
    socket.on('disconnect', () => console.log(`[TWIN] Client disconnected: ${socket.id}`));
});

const PORT = process.env.DIGITAL_TWIN_PORT || 3002;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   S.H.I.E.L.D Digital Twin — Port ${PORT}        ║
║   City Infrastructure Simulation Engine       ║
╚═══════════════════════════════════════════════╝
  `);
});
