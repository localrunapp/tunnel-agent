#!/bin/sh
set -e

echo "🚀 LocalRun Agent - ${PROVIDER} Tunnel"
echo "======================================="

# Validar variables requeridas
if [ -z "$PROVIDER" ]; then
    echo "❌ ERROR: PROVIDER is required"
    exit 1
fi

if [ -z "$TUNNEL_PORT" ]; then
    echo "❌ ERROR: TUNNEL_PORT is required"
    exit 1
fi

# Configurar defaults
export TUNNEL_ID="${TUNNEL_ID:-${PROVIDER}-${TUNNEL_PORT}}"
export BACKEND_URL="${BACKEND_URL:-http://backend:8000}"
export METRICS_INTERVAL="${METRICS_INTERVAL:-10}"
export LOG_LEVEL="${LOG_LEVEL:-info}"

echo "📊 Configuration:"
echo "  Provider: $PROVIDER"
echo "  Tunnel ID: $TUNNEL_ID"
echo "  Tunnel Port: $TUNNEL_PORT"
echo "  Backend URL: $BACKEND_URL"
echo "  Metrics Interval: ${METRICS_INTERVAL}s"
echo "  Log Level: $LOG_LEVEL"
echo ""

# Iniciar supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
