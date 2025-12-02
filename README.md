# LocalRun Agent

Universal metrics agent for tunnel providers. Can be used as a **standalone CLI** or embedded in **Docker images**.

## 🚀 Features

- ✅ **Universal CLI** - One tool for all providers
- ✅ **Standalone or Docker** - Use as CLI or in containers
- ✅ **Multiple Providers** - ngrok, Cloudflare, localhost.run
- ✅ **Rich Metrics** - Requests, latency, bandwidth, container stats
- ✅ **Standard Payload** - Same format for all providers
- ✅ **Built with oclif** - Professional CLI framework

## 📦 Installation

### As CLI

```bash
npm install -g localrun-agent

# Or use npx
npx localrun-agent start ngrok --port 8000
```

### As Docker Image

```bash
docker pull localrun/ngrok:latest
docker pull localrun/cloudflared:latest
```

## 🎯 Usage

### Standalone CLI

```bash
# Start ngrok metrics collection
localrun-agent start ngrok --port 8000 --tunnel-id my-tunnel

# Start cloudflare with custom backend
localrun-agent start cloudflare \
  --port 3000 \
  --backend-url http://localhost:8000 \
  --interval 30

# Get help
localrun-agent start --help
```

### Docker Container

```bash
# ngrok
docker run -d \
  --name ngrok-8000 \
  --network portal_default \
  --add-host host.docker.internal:host-gateway \
  -e PROVIDER=ngrok \
  -e TUNNEL_PORT=8000 \
  -e BACKEND_URL=http://backend:8000 \
  -e NGROK_AUTHTOKEN=your_token \
  localrun/ngrok:latest \
  http host.docker.internal:8000

# cloudflare
docker run -d \
  --name cloudflared-3000 \
  --network portal_default \
  -e PROVIDER=cloudflare \
  -e TUNNEL_PORT=3000 \
  -e BACKEND_URL=http://backend:8000 \
  localrun/cloudflared:latest \
  tunnel --url http://host.docker.internal:3000
```

## 📊 Metrics Payload

All providers send the same standard format:

```json
{
  "provider": "ngrok",
  "tunnel_id": "ngrok-8000",
  "tunnel_port": 8000,
  "timestamp": 1732654770.123,
  "metrics": {
    "tunnel": {
      "public_url": "https://abc123.ngrok.io",
      "protocol": "https",
      "status": "running",
      "uptime_seconds": 3600
    },
    "requests": {
      "total": 1250,
      "rate_1m": 15.2,
      "rate_5m": 12.8,
      "errors": 5
    },
    "latency": {
      "p50": 25.3,
      "p90": 85.2,
      "p95": 120.8,
      "p99": 200.5
    },
    "bandwidth": {
      "bytes_in": 5242880,
      "bytes_out": 10485760,
      "rate_in_bps": 8192,
      "rate_out_bps": 16384
    },
    "container": {
      "memory_usage_bytes": 52428800,
      "memory_limit_bytes": 536870912,
      "memory_percent": 9.77,
      "cpu_percent": 2.5,
      "network_rx_bytes": 1048576,
      "network_tx_bytes": 2097152
    }
  }
}
```

## 🏗️ Project Structure

```
localrun-agent/
├── app/                    # oclif CLI application
│   ├── commands/           # CLI commands
│   │   └── start.ts        # Main start command
│   └── services/           # Business logic
│       └── metrics-service.ts
├── core/                   # Core functionality
│   ├── types/              # TypeScript types
│   ├── collectors/         # Metrics collectors
│   │   ├── ngrok-collector.ts
│   │   ├── cloudflare-collector.ts
│   │   └── container-stats.ts
│   └── reporters/          # Metrics reporters
│       └── http-reporter.ts
├── providers/              # Docker provider configs
│   ├── shared/
│   │   └── entrypoint.sh   # Shared entrypoint
│   ├── ngrok/
│   │   ├── Dockerfile
│   │   └── supervisord.conf
│   └── cloudflared/
│       ├── Dockerfile
│       └── supervisord.conf
├── bin/                    # CLI executables
├── package.json            # oclif configuration
└── Makefile                # Build system
```

## 🛠️ Development

### Build CLI

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in dev mode
npm run dev start ngrok --port 8000
```

### Build Docker Images

```bash
# Build all images
make docker-build-all

# Build specific image
make docker-build-ngrok
make docker-build-cloudflared
```

## 🔧 Configuration

### CLI Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--port` | `-p` | Local port being tunneled | Required |
| `--tunnel-id` | `-i` | Unique tunnel ID | `{provider}-{port}` |
| `--backend-url` | `-b` | Backend URL | `http://backend:8000` |
| `--interval` | `-n` | Collection interval (seconds) | `10` |
| `--log-level` | `-l` | Log level | `info` |

### Environment Variables

All flags can be set via environment variables:

- `TUNNEL_PORT`
- `TUNNEL_ID`
- `BACKEND_URL`
- `METRICS_INTERVAL`
- `LOG_LEVEL`

## 📝 Adding a New Provider

1. Create collector in `core/collectors/your-provider-collector.ts`
2. Add to factory in `core/collectors/index.ts`
3. Create `providers/your-provider/Dockerfile`
4. Create `providers/your-provider/supervisord.conf`
5. Add build target to `Makefile`

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

---

**Made with ❤️ by LocalRun Team**
