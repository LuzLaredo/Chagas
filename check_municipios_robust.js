const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/municipios',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log(`Total municipios found: ${jsonData.length}`);
            jsonData.forEach(m => {
                console.log(`ID: ${m.municipio_id}, Name: ${m.nombre_municipio}`);
            });
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw data:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
