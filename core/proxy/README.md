# Analytics Proxy

Universal HTTP proxy with automatic analytics collection for ANY tunnel provider.

## ✅ Features

- **Universal**: Works with Cloudflare, ngrok, Serveo, localhost.run, etc.
- **Non-blocking**: Fire & forget with in-memory queue
- **Batch processing**: Sends 100 events at once every 5 seconds
- **Zero overhead**: < 1ms latency added to requests
- **Automatic**: Captures IP, User-Agent, sizes, latency, etc.
- **Resilient**: Continues working even if analytics backend fails

## 🚀 Usage

### Standalone

```bash
cd core/proxy
npm install
npm run build

# Start proxy
TARGET_PORT=3000 \
PROXY_PORT=8001 \
BACKEND_URL=http://backend:8000 \
TUNNEL_ID=my-service \
node analytics-proxy.js
```

### In Docker Container

```dockerfile
FROM cloudflare/cloudflared:latest

# Install Node.js
RUN apk add --no-cache nodejs npm

# Copy proxy
COPY core/proxy /app/proxy
WORKDIR /app/proxy
RUN npm install && npm run build

# Start both proxy and tunnel
CMD node analytics-proxy.js & cloudflared tunnel --url http://localhost:8001
```

## 📊 Data Captured

### Per Request:
- `tunnel_id`: Service identifier
- `ip`: Client IP (from X-Forwarded-For or CF-Connecting-IP)
- `user_agent`: Browser/client info
- `method`: HTTP method (GET, POST, etc.)
- `path`: Request path
- `status_code`: Response status
- `response_time_ms`: Latency
- `request_size_bytes`: Request body size
- `response_size_bytes`: Response body size
- `referer`: Referer header
- `accept_language`: Language preference
- `timestamp`: ISO 8601 timestamp

### Derived (backend):
- Browser (Chrome, Firefox, Safari, etc.)
- OS (Windows, macOS, Linux, etc.)
- Device type (mobile, tablet, desktop, bot)
- Country (from GeoIP database)

## 🎯 Architecture

```
Internet → Tunnel Provider → Analytics Proxy → Your App
                                    ↓
                             Backend (TinyDB)
```

### Flow:
1. Request arrives at proxy
2. Proxy captures metadata (< 0.1ms)
3. Proxy forwards to your app immediately
4. Response captured and added to queue
5. Queue flushes every 5s or every 100 events
6. Batch sent to backend (fire & forget)

## ⚙️ Configuration

### Environment Variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TARGET_PORT` | Your app's port | `3000` |
| `PROXY_PORT` | Proxy listening port | `8001` |
| `BACKEND_URL` | Analytics backend URL | `http://backend:8000` |
| `TUNNEL_ID` | Service identifier | `tunnel-{port}` |

### Queue Settings:

```typescript
maxBatchSize: 100      // Flush after 100 events
flushInterval: 5000    // Flush every 5 seconds
timeout: 3000          // Backend request timeout
```

## 🔍 Health Check

```bash
curl http://localhost:8001/__analytics_health

# Response:
{
  "status": "ok",
  "queue_size": 23,
  "tunnel_id": "my-service",
  "target_port": 3000
}
```

## 📈 Performance

- **Latency overhead**: < 1ms
- **Memory usage**: ~10MB (for queue)
- **CPU usage**: < 1%
- **Network**: 1 HTTP request per 100 events

## 🛡️ Error Handling

- If backend is down: Events are dropped (not queued indefinitely)
- If proxy crashes: Tunnel continues working
- If your app crashes: Proxy returns 502 Bad Gateway
- Timeout: 3s max wait for backend response

## 🔗 Integration with Providers

### Cloudflare
```bash
# Before
cloudflared tunnel --url http://host.docker.internal:3000

# After
node analytics-proxy.js &
cloudflared tunnel --url http://localhost:8001
```

### ngrok
```bash
# Before
ngrok http 3000

# After
node analytics-proxy.js &
ngrok http 8001
```

### Serveo
```bash
# Before
ssh -R 80:localhost:3000 serveo.net

# After
node analytics-proxy.js &
ssh -R 80:localhost:8001 serveo.net
```

## 📝 Backend Endpoints

The proxy sends data to:

```
POST /analytics/batch
{
  "events": [
    {
      "tunnel_id": "my-service",
      "ip": "203.0.113.45",
      "user_agent": "Mozilla/5.0...",
      "method": "GET",
      "path": "/api/users",
      "status_code": 200,
      "response_time_ms": 45.2,
      "request_size_bytes": 512,
      "response_size_bytes": 2048,
      "timestamp": "2025-11-27T20:30:00Z"
    },
    // ... up to 100 events
  ]
}
```

## 🚧 Limitations

- WebSocket analytics are basic (connection only, not messages)
- HTTPS traffic is proxied but not decrypted
- Binary protocols (non-HTTP) are not analyzed
- Maximum queue size: 1000 events (to prevent memory issues)

## 📄 License

MIT
