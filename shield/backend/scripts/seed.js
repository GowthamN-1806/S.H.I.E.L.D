require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const SecurityAlert = require('../models/SecurityAlert');
const ApiKey = require('../models/ApiKey');
const { v4: uuidv4 } = require('uuid');
const { sha256, generateApiKey, hashApiKey } = require('../utils/cryptoUtils');

const DEMO_PASSWORD = 'Shield@2024!';
const MFA_TEST_SECRET = 'JBSWY3DPEHPK3PXP'; // Test TOTP secret for all demo users

const USERS = [
    {
        username: 'alex.chen', email: 'alex.chen@shield.gov',
        role: 'super_admin', department: 'IT Security Division',
        employeeId: 'EMP-001',
        allowedLocations: [{ city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, radius: 50 }],
        riskScore: 5,
    },
    {
        username: 'priya.sharma', email: 'priya.sharma@shield.gov',
        role: 'city_admin', department: "Mayor's Office",
        employeeId: 'EMP-002',
        allowedLocations: [{ city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, radius: 30 }],
        riskScore: 8,
    },
    {
        username: 'marcus.webb', email: 'marcus.webb@shield.gov',
        role: 'traffic_officer', department: 'Traffic Control Center',
        employeeId: 'EMP-003',
        allowedLocations: [{ city: 'Pune', country: 'India', lat: 18.5204, lng: 73.8567, radius: 25 }],
        riskScore: 12,
    },
    {
        username: 'fatima.alhassan', email: 'fatima.alhassan@shield.gov',
        role: 'water_operator', department: 'Water Treatment Plant A',
        employeeId: 'EMP-004',
        allowedLocations: [{ city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, radius: 20 }],
        riskScore: 22,
    },
    {
        username: 'james.okafor', email: 'james.okafor@shield.gov',
        role: 'power_controller', department: 'Grid Operations Center',
        employeeId: 'EMP-005',
        allowedLocations: [{ city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, radius: 30 }],
        riskScore: 10,
    },
    {
        username: 'sarah.kowalski', email: 'sarah.kowalski@shield.gov',
        role: 'emergency_services', department: 'Emergency Coordination Hub',
        employeeId: 'EMP-006',
        allowedLocations: [{ city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, radius: 50 }],
        riskScore: 3,
    },
    {
        username: 'raj.patel', email: 'raj.patel@shield.gov',
        role: 'maintenance', department: 'Field Operations Team',
        employeeId: 'EMP-007',
        allowedLocations: [{ city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, radius: 100 }],
        riskScore: 15,
    },
    {
        username: 'emily.santos', email: 'emily.santos@shield.gov',
        role: 'citizen', department: 'Resident Portal',
        employeeId: 'EMP-008',
        riskScore: 0,
    },
    {
        username: 'datastream.inc', email: 'api@datastream.io',
        role: 'api_partner', department: 'Smart City Analytics Partner',
        employeeId: 'EMP-009',
        riskScore: 5,
    },
    {
        username: 'kai.nakamura', email: 'kai.nakamura@shield.gov',
        role: 'security_analyst', department: 'Cybersecurity Operations',
        employeeId: 'EMP-010',
        allowedLocations: [{ city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, radius: 50 }],
        riskScore: 2,
    },
];

const EVENT_TYPES = ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'API_ACCESS', 'ACCESS_DENIED', 'RISK_SCORE_CHANGED'];

async function seedUsers() {
    console.log('[SEED] Creating users...');
    const created = [];
    for (const userData of USERS) {
        const exists = await User.findOne({ username: userData.username });
        if (exists) { created.push(exists); continue; }
        const user = await User.create({
            ...userData,
            password: DEMO_PASSWORD,
            mfaEnabled: true,
            mfaVerified: true,
            mfaSecret: MFA_TEST_SECRET,
            workingHours: { start: '08:00', end: '18:00', timezone: 'Asia/Kolkata', days: [1, 2, 3, 4, 5] },
            deviceFingerprints: [
                { fingerprint: `demo-fp-${userData.employeeId}`, deviceName: 'Work Laptop', trusted: true, registeredAt: new Date(), lastUsed: new Date() },
            ],
            lastLogin: new Date(Date.now() - Math.random() * 86400000 * 3),
            lastLoginIp: '10.0.1.' + Math.floor(Math.random() * 255),
        });
        created.push(user);
        console.log(`  ✓ ${user.username} (${user.role})`);
    }
    return created;
}

async function seedAuditLogs(users) {
    console.log('[SEED] Creating audit logs...');
    const logs = [];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const daysAgo = Math.floor(Math.random() * 7);
        const timestamp = new Date(now - daysAgo * 86400000 - Math.random() * 86400000);

        let eventType, outcome, severity;
        if (i < 3) {
            eventType = 'LOGIN_FAILURE'; outcome = 'DENIED'; severity = 'WARNING';
        } else if (i === 3) {
            eventType = 'ACCESS_DENIED'; outcome = 'DENIED'; severity = 'WARNING';
        } else if (i < 6) {
            eventType = 'RISK_SCORE_CHANGED'; outcome = 'SUCCESS'; severity = 'INFO';
        } else {
            eventType = EVENT_TYPES[Math.floor(Math.random() * 3)];
            outcome = eventType === 'LOGIN_FAILURE' ? 'DENIED' : 'SUCCESS';
            severity = 'INFO';
        }

        const logData = {
            logId: uuidv4(), eventType,
            userId: user._id, username: user.username, userRole: user.role,
            ipAddress: '10.0.1.' + Math.floor(Math.random() * 255),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            resource: '/api/' + ['auth/login', 'city/traffic/status', 'city/water/status', 'dashboard/stats'][Math.floor(Math.random() * 4)],
            action: 'access', outcome, severity,
            riskScoreAtEvent: user.riskScore || 0,
            timestamp,
        };

        // Set hash chain
        const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
        logData.previousLogHash = lastLog ? lastLog.logHash : 'GENESIS';
        logData.logHash = sha256({ ...logData, previousLogHash: logData.previousLogHash });

        const log = new AuditLog(logData);
        await log.save({ validateBeforeSave: false });
        logs.push(logData);
    }
    console.log(`  ✓ ${logs.length} audit logs created`);
}

async function seedAlerts(users) {
    console.log('[SEED] Creating security alerts...');
    const waterUser = users.find(u => u.role === 'water_operator');
    const alerts = [
        {
            alertId: uuidv4(), title: 'Impossible travel detected: water_operator accessed from 2 locations',
            description: 'User fatima.alhassan logged in from Mumbai at 10:15 and Bangalore at 10:45 — 950km apart in 30 minutes.',
            severity: 'CRITICAL', status: 'OPEN', source: 'SADE', targetSystem: 'water',
            userId: waterUser?._id, username: 'fatima.alhassan', riskScore: 88, anomalyType: 'IMPOSSIBLE_TRAVEL',
        },
        {
            alertId: uuidv4(), title: 'API partner exceeded rate limit on power system endpoint',
            description: 'datastream.inc sent 47 requests/min to /api/city/power/status (limit: 10/min).',
            severity: 'HIGH', status: 'OPEN', source: 'SAPG', targetSystem: 'power',
            username: 'datastream.inc', riskScore: 65, anomalyType: 'RATE_LIMIT_EXCEEDED',
        },
        {
            alertId: uuidv4(), title: 'Multiple failed login attempts: maintenance staff account',
            description: '4 consecutive failed logins for raj.patel from IP 192.168.1.105.',
            severity: 'WARNING', status: 'OPEN', source: 'APBDS', targetSystem: 'auth',
            username: 'raj.patel', riskScore: 40, anomalyType: 'BRUTE_FORCE_PROBE',
        },
        {
            alertId: uuidv4(), title: 'Login outside working hours: traffic officer (overtime logged)',
            description: 'marcus.webb logged in at 22:30 IST — outside configured hours (08:00-18:00).',
            severity: 'INFO', status: 'OPEN', source: 'IAAL', targetSystem: 'auth',
            username: 'marcus.webb', riskScore: 30, anomalyType: 'OFF_HOURS_ACCESS',
        },
        {
            alertId: uuidv4(), title: 'Brute force attempt blocked: unknown user targeting admin accounts',
            description: 'IP 185.220.101.42 attempted 23 logins against admin accounts in 2 minutes. IP blocked.',
            severity: 'CRITICAL', status: 'RESOLVED', source: 'APBDS', targetSystem: 'auth',
            riskScore: 95, anomalyType: 'BRUTE_FORCE_ATTACK',
            resolvedAt: new Date(Date.now() - 86400000), resolutionNotes: 'IP blocked at firewall level. No accounts compromised.',
        },
    ];
    for (const alert of alerts) {
        await SecurityAlert.create({ ...alert, createdAt: new Date(Date.now() - Math.random() * 3 * 86400000) });
    }
    console.log(`  ✓ ${alerts.length} security alerts created`);
}

async function seedApiKeys(users) {
    console.log('[SEED] Creating API keys...');
    const admin = users.find(u => u.role === 'super_admin');
    const partners = [
        { name: 'DataStream Analytics Key', partnerName: 'DataStream Inc', scopes: ['traffic:read', 'power:read'] },
        { name: 'CityWatch Monitor Key', partnerName: 'CityWatch Security', scopes: ['alerts:read', 'dashboard:view'] },
        { name: 'GridSense IoT Key', partnerName: 'GridSense Networks', scopes: ['power:read', 'power:control'] },
    ];
    for (const p of partners) {
        const rawKey = generateApiKey();
        await ApiKey.create({
            keyId: uuidv4(), name: p.name, hashedKey: hashApiKey(rawKey), prefix: rawKey.substring(0, 14),
            userId: admin._id, partnerName: p.partnerName, scopes: p.scopes,
            rateLimitPerMinute: 10, isActive: true,
            expiresAt: new Date(Date.now() + 365 * 86400000), createdBy: admin._id,
        });
    }
    console.log('  ✓ 3 API keys created');
}

(async () => {
    try {
        await connectDB();
        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║   S.H.I.E.L.D — Database Seed Script      ║');
        console.log('╚═══════════════════════════════════════════╝\n');
        console.log('  Demo Password for all users: Shield@2024!\n');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            AuditLog.deleteMany({}),
            SecurityAlert.deleteMany({}),
            ApiKey.deleteMany({}),
        ]);
        console.log('[SEED] Cleared existing data\n');

        const users = await seedUsers();
        await seedAuditLogs(users);
        await seedAlerts(users);
        await seedApiKeys(users);

        console.log('\n[SEED] ✅ Database seeded successfully!');
        console.log('[SEED] Login with: alex.chen / Shield@2024!\n');
        process.exit(0);
    } catch (err) {
        console.error('[SEED] ❌ Seed failed:', err);
        process.exit(1);
    }
})();
