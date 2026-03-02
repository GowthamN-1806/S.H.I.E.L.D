const ROLES = [
    'super_admin',
    'city_admin',
    'traffic_officer',
    'water_operator',
    'power_controller',
    'emergency_services',
    'maintenance',
    'citizen',
    'api_partner',
    'security_analyst',
];

const ROLE_SENSITIVITY = {
    super_admin: 5,
    city_admin: 4,
    security_analyst: 4,
    traffic_officer: 3,
    water_operator: 3,
    power_controller: 3,
    emergency_services: 3,
    maintenance: 2,
    api_partner: 2,
    citizen: 1,
};

const EVENT_TYPES = [
    'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'API_ACCESS',
    'ACCESS_DENIED', 'ACCOUNT_LOCKED', 'ALERT_GENERATED', 'POLICY_CHANGED',
    'USER_CREATED', 'USER_MODIFIED', 'RISK_SCORE_CHANGED', 'SESSION_TERMINATED',
    'ATTACK_SIMULATED', 'MFA_CHALLENGE', 'MFA_SUCCESS', 'MFA_FAILURE',
];

const ALERT_SEVERITY = ['INFO', 'WARNING', 'HIGH', 'CRITICAL'];
const ALERT_STATUS = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];

const RISK_THRESHOLDS = {
    LOW: { min: 0, max: 25, action: 'ALLOW' },
    MEDIUM: { min: 26, max: 50, action: 'WARN' },
    HIGH: { min: 51, max: 75, action: 'MFA_CHALLENGE' },
    VERY_HIGH: { min: 76, max: 90, action: 'SUSPEND' },
    CRITICAL: { min: 91, max: 100, action: 'LOCKOUT' },
};

const LOCKOUT_THRESHOLDS = {
    5: 15 * 60 * 1000,    // 5 attempts → 15 min
    8: 60 * 60 * 1000,    // 8 attempts → 60 min
    10: null,              // 10+ → indefinite (admin unlock)
};

const CITY_SYSTEMS = ['traffic', 'water', 'power', 'emergency'];

const PERMISSIONS = {
    'users:read': ['super_admin', 'city_admin', 'security_analyst'],
    'users:create': ['super_admin', 'city_admin'],
    'users:modify': ['super_admin', 'city_admin'],
    'users:delete': ['super_admin'],
    'users:lock': ['super_admin', 'city_admin', 'security_analyst'],

    'traffic:read': ['super_admin', 'city_admin', 'traffic_officer', 'security_analyst', 'maintenance'],
    'traffic:control': ['super_admin', 'traffic_officer'],
    'traffic:emergency_override': ['super_admin', 'emergency_services', 'traffic_officer'],

    'water:read': ['super_admin', 'city_admin', 'water_operator', 'security_analyst', 'maintenance'],
    'water:control': ['super_admin', 'water_operator'],
    'water:emergency_shutdown': ['super_admin', 'water_operator', 'emergency_services'],

    'power:read': ['super_admin', 'city_admin', 'power_controller', 'security_analyst', 'maintenance'],
    'power:control': ['super_admin', 'power_controller'],
    'power:grid_modify': ['super_admin', 'power_controller'],

    'emergency:read': ['super_admin', 'city_admin', 'emergency_services', 'security_analyst'],
    'emergency:dispatch': ['super_admin', 'emergency_services'],
    'emergency:coordinate': ['super_admin', 'emergency_services', 'city_admin'],

    'audit_logs:read': ['super_admin', 'security_analyst', 'city_admin'],
    'audit_logs:export': ['super_admin', 'security_analyst'],

    'alerts:read': ['super_admin', 'city_admin', 'security_analyst', 'traffic_officer',
        'water_operator', 'power_controller', 'emergency_services'],
    'alerts:acknowledge': ['super_admin', 'city_admin', 'security_analyst'],
    'alerts:resolve': ['super_admin', 'security_analyst'],

    'api_keys:manage': ['super_admin', 'city_admin'],
    'api_keys:view': ['super_admin', 'city_admin', 'security_analyst'],

    'digital_twin:run': ['super_admin', 'security_analyst'],
    'digital_twin:view': ['super_admin', 'city_admin', 'security_analyst'],

    'dashboard:view': ['super_admin', 'city_admin', 'security_analyst', 'traffic_officer',
        'water_operator', 'power_controller', 'emergency_services'],
    'dashboard:full': ['super_admin', 'city_admin', 'security_analyst'],

    'citizen:portal': ['citizen'],
    'partner:api': ['api_partner'],

    'demo:trigger': ['super_admin', 'security_analyst', 'city_admin'],
};

module.exports = {
    ROLES,
    ROLE_SENSITIVITY,
    EVENT_TYPES,
    ALERT_SEVERITY,
    ALERT_STATUS,
    RISK_THRESHOLDS,
    LOCKOUT_THRESHOLDS,
    CITY_SYSTEMS,
    PERMISSIONS,
};
