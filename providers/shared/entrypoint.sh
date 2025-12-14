#!/bin/sh
set -e

echo "LocalRun Agent (Go) - ${PROVIDER} Tunnel"
echo "======================================="

# Validate required vars
if [ -z "$TUNNEL_PORT" ]; then
    echo "ERROR: TUNNEL_PORT is required"
    exit 1
fi

# Set defaults
export TUNNEL_ID="${TUNNEL_ID:-${PROVIDER}-${TUNNEL_PORT}}"
export BACKEND_URL="${BACKEND_URL}"
export METRICS_INTERVAL="${METRICS_INTERVAL:-10}"

echo "Configuration:"
echo "  Provider: $PROVIDER"
echo "  Tunnel ID: $TUNNEL_ID"
echo "  Tunnel Port: $TUNNEL_PORT"
echo "  Backend URL: $BACKEND_URL"
echo "  Metrics Interval: ${METRICS_INTERVAL}s"
echo ""

# Start agent
exec /usr/local/bin/agent
