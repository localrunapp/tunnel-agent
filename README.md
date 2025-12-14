# LocalRun Agent

High-performance, lightweight tunnel agent written in Go.

## Features

- **Ultra-lightweight**: ~45MB Docker images
- **Fast**: Instant startup time
- **Multi-provider**: Support for Cloudflare, Ngrok, and Pinggy
- **Metrics**: Built-in metrics collector (CPU, RAM, Bandwidth, Requests)
- **Docker-native**: Designed for containerized environments

## Supported Providers

| Provider | Image | Size | Type |
|----------|-------|------|------|
| **Cloudflare** | `ghcr.io/localrunapp/cloudflared` | ~53MB | Quick Tunnels & Private Tunnels |
| **Ngrok** | `ghcr.io/localrunapp/ngrok` | ~43MB | Authenticated Tunnels |
| **Pinggy** | `ghcr.io/localrunapp/pinggy` | ~45MB | SSH-based Tunnels |

## Usage

### Docker

```bash
# Cloudflare (Quick Tunnel)
docker run -d \
  --name tunnel \
  -e TUNNEL_PORT=3000 \
  -e TARGET_HOST=host.docker.internal \
  --add-host host.docker.internal:host-gateway \
  ghcr.io/localrunapp/cloudflared:latest

# Pinggy
docker run -d \
  --name tunnel \
  -e TUNNEL_PORT=3000 \
  -e TARGET_HOST=host.docker.internal \
  --add-host host.docker.internal:host-gateway \
  ghcr.io/localrunapp/pinggy:latest
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TUNNEL_PORT` | Local port to expose | Required |
| `TARGET_HOST` | Host to forward traffic to | `localhost` |
| `TUNNEL_ID` | Unique ID for the tunnel | `provider-port` |
| `BACKEND_URL` | URL to send metrics to | (Disabled if empty) |
| `METRICS_INTERVAL` | Interval in seconds for metrics | `10` |

### Provider-Specific Images

| Provider | Image | Size | Type |
|----------|-------|------|------|
| **Cloudflare** | `ghcr.io/localrunapp/cloudflared` | ~53MB | Quick Tunnels & Private Tunnels |
| **Ngrok** | `ghcr.io/localrunapp/ngrok` | ~43MB | Authenticated Tunnels |
| **Pinggy** | `ghcr.io/localrunapp/pinggy` | ~45MB | SSH-based Tunnels |

## Development

```bash
# Build binary
make build

# Build Docker images
make build-all
```