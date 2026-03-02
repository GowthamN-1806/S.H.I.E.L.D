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
        console.log('--- S.H.I.E.L.D Activity Logging System Tests ---\n');

        // TEST A - Successful Login
        console.log('1. [TEST A] Initiating Login...');
        const loginRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'jane', password: 'securepassword123' });

        console.log(`Login Status: ${loginRes.status}`);
        const officerToken = loginRes.body.token;

        // TEST B - Authorized Traffic API Access
        console.log('\n2. [TEST B] Initiating Authorized Traffic API Access...');
        const trafficRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/traffic/controlSignal', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officerToken}` }
        }, { signalId: 'N1-Beta', status: 'Red' });
        console.log(`Traffic Request Status: ${trafficRes.status}`);

        // TEST C - Unauthorized Power Grid Access
        console.log('\n3. [TEST C] Initiating Unauthorized Power Grid Access...');
        const powerRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/power/gridStatus', method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officerToken}` }
        });
        console.log(`Power Request Status: ${powerRes.status}`);

        // TEST D - Logout
        console.log('\n4. [TEST D] Initiating Logout...');
        const logoutRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/auth/logout', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officerToken}` }
        }, {});
        console.log(`Logout Status: ${logoutRes.status}`);

        // VALIDATION - Retrieve logs as Super Admin
        console.log('\n5. [VALIDATION] Logging in as Super Admin and retrieving Audit Logs...');
        const adminLogin = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: 'fury', password: 'securepassword123' });

        const adminToken = adminLogin.body.token;

        const logsRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/admin/logs', method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
        });

        console.log(`Audit Logs Retrieved: ${logsRes.body.count || 0}`);
        if (logsRes.body.logs) {
            logsRes.body.logs.slice(0, 5).forEach(log => {
                console.log(`-> [${log.action}] | Role: ${log.role} | Outcome: ${log.outcome} | Path: ${log.endpoint}`);
            });
        }

        console.log('\n✔️ Testing Complete');

    } catch (err) {
        console.error('Test Failed:', err);
    }
};

runTests();
