const http = require('http');

const makeRequest = (options, postData = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on('error', reject);

        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
};

const runTests = async () => {
    try {
        console.log('--- S.H.I.E.L.D Master Dashboard Backend Tests ---\n');

        // Login as Super Admin first
        console.log('1. Logging in as Super Admin...');
        const loginRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'fury', password: 'securepassword123' });

        console.log(`Login Status: ${loginRes.status}`);
        const adminToken = loginRes.body.token;

        // Test GET /stats
        console.log('\n2. Testing GET /api/admin/stats...');
        const statsRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`Stats Request Status: ${statsRes.status}`);
        if (statsRes.body.stats) {
            console.log(`Stats:`, statsRes.body.stats);
        }

        // Test GET /system-status
        console.log('\n3. Testing GET /api/admin/system-status...');
        const statusRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/admin/system-status', method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`Status Request Status: ${statusRes.status}`);
        if (statusRes.body.status) {
            console.log(`Status:`, statusRes.body.status);
        }

        // Test Traffic API to generate logs for the frontend
        console.log('\n4. Logging in as Traffic Officer to generate logs...');
        const officerLoginRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'jane', password: 'securepassword123' });
        const officerToken = officerLoginRes.body.token;

        // Test B Authorized Access
        await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/traffic/controlSignal', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officerToken}` }
        }, { signalId: 'N1-Beta', status: 'Red' });

        // Test C Unauthorized Access
        await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/power/gridStatus', method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officerToken}` }
        });

        console.log('\n✔️ Testing Complete');
    } catch (err) {
        console.error('Test Failed:', err);
    }
};

runTests();
