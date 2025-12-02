const http = require('http');

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/metrics/ingest') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const metrics = JSON.parse(body);
                console.log('\n🎯 Métricas recibidas:');
                console.log(JSON.stringify(metrics, null, 2));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                console.error('Error parsing JSON:', e);
                res.writeHead(400);
                res.end();
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(9999, () => {
    console.log('🚀 Mock backend listening on http://localhost:9999');
    console.log('📡 Waiting for metrics...\n');
});
