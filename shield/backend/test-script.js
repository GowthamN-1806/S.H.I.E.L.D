const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
};

const req = http.request(options, res => {
    let data = '';
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        const result = JSON.parse(data);
        console.log(result);
        // TEST 2
        if (result.token) {
            const trafficOptions = {
                hostname: 'localhost',
                port: 5000,
                path: '/api/traffic/controlSignal',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${result.token}`
                },
            };

            const req2 = http.request(trafficOptions, res2 => {
                let data2 = '';
                console.log(`TEST 2 STATUS: ${res2.statusCode}`);
                res2.on('data', chunk => {
                    data2 += chunk;
                });
                res2.on('end', () => {
                    console.log(JSON.parse(data2));

                    // TEST 3
                    const powerOptions = {
                        hostname: 'localhost',
                        port: 5000,
                        path: '/api/power/gridStatus',
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${result.token}`
                        },
                    };

                    const req3 = http.request(powerOptions, res3 => {
                        let data3 = '';
                        console.log(`TEST 3 STATUS: ${res3.statusCode}`);
                        res3.on('data', chunk => {
                            data3 += chunk;
                        });
                        res3.on('end', () => {
                            console.log(JSON.parse(data3));
                        });
                    });
                    req3.write(JSON.stringify({}));
                    req3.end();


                });
            });
            req2.write(JSON.stringify({
                "signalId": "N1-Beta",
                "status": "Red"
            }));
            req2.end();
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(JSON.stringify({
    username: 'jane',
    password: 'securepassword123'
}));
req.end();
