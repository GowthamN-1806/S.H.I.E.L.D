const rolePermissions = {
    'Super Admin': ['/api/traffic', '/api/water', '/api/power', '/api/emergency', '/api/status'],
    'City Administrator': ['/api/status'], // Only read-only status endpoints
    'Traffic Department Officer': ['/api/traffic', '/api/status'],
    'Water Authority Operator': ['/api/water', '/api/status'],
    'Power Grid Operator': ['/api/power', '/api/status'],
    'Emergency Services': ['/api/emergency', '/api/traffic/override', '/api/status'],
    'Maintenance Staff': ['/api/status'],
    'Citizen Viewer': ['/api/status/public']
};

module.exports = { rolePermissions };
