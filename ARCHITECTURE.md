# 🎯 LocalRun Agent - Arquitectura Final

## ✨ Concepto

**Un solo proyecto oclif** que puede usarse como:

1. **CLI Standalone** → `localrun-agent start ngrok --port 8000`
2. **Imágenes Docker** → Cada proveedor tiene su Dockerfile que usa el CLI compilado

## 📁 Estructura del Proyecto

```
localrun-agent/
│
├── 📱 app/                          # Aplicación oclif
│   ├── commands/
│   │   └── start.ts                 # Comando principal
│   ├── services/
│   │   └── metrics-service.ts       # Lógica de negocio
│   └── utils/                       # Utilidades
│
├── ⚙️  core/                        # Código core reutilizable
│   ├── types/
│   │   └── index.ts                 # Tipos TypeScript
│   ├── collectors/                  # Colectores por proveedor
│   │   ├── index.ts                 # Factory
│   │   ├── ngrok-collector.ts
│   │   ├── cloudflare-collector.ts
│   │   └── container-stats.ts       # Stats de Docker
│   └── reporters/
│       └── http-reporter.ts         # Envío HTTP
│
├── 🐳 providers/                    # Configuraciones Docker
│   ├── shared/
│   │   └── entrypoint.sh            # ⭐ Entrypoint compartido
│   ├── ngrok/
│   │   ├── Dockerfile               # Usa el CLI compilado
│   │   └── supervisord.conf
│   ├── cloudflared/
│   │   ├── Dockerfile
│   │   └── supervisord.conf
│   └── localhost.run/
│       ├── Dockerfile
│       └── supervisord.conf
│
├── 🔧 bin/                          # Ejecutables CLI
│   ├── dev.js                       # Desarrollo
│   └── run.js                       # Producción
│
├── 📦 package.json                  # Configuración oclif
├── 📝 tsconfig.json
├── 🔨 Makefile                      # Build CLI + Docker
├── 📖 README.md
└── 🚫 .gitignore
```

## 🚀 Flujo de Trabajo

### 1. Desarrollo del CLI

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev start ngrok --port 8000

# Build
npm run build
```

### 2. Uso Standalone

```bash
# Ejecutar directamente
./bin/run.js start ngrok --port 8000 --tunnel-id my-tunnel

# O instalar globalmente
npm install -g .
localrun-agent start cloudflare --port 3000
```

### 3. Build de Imágenes Docker

```bash
# Build CLI primero
npm run build

# Build imágenes (usa el CLI compilado)
make docker-build-all

# O individual
make docker-build-ngrok
make docker-build-cloudflared
```

## 🎨 Arquitectura de Imágenes Docker

```
┌──────────────────────────────────────────────┐
│  Imagen: localrun/ngrok:latest               │
│  ┌────────────────────────────────────────┐  │
│  │  Supervisord                           │  │
│  │  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │   ngrok      │  │  localrun-agent │ │  │
│  │  │   daemon     │  │  (CLI compilado)│ │  │
│  │  │              │  │                 │ │  │
│  │  │              │  │  /app/bin/run.js│ │  │
│  │  │              │  │  start ngrok    │ │  │
│  │  └──────────────┘  └────────┬────────┘ │  │
│  └──────────────────────────────┼─────────┘  │
└──────────────────────────────────┼────────────┘
                                   │
                                   │ POST /api/metrics/ingest
                                   ▼
                      ┌────────────────────────┐
                      │  LocalRun Backend      │
                      └────────────────────────┘
```

## 💡 Ventajas de esta Arquitectura

### ✅ Un Solo Código Base
- El CLI y las imágenes Docker usan el **mismo código**
- Cambios en collectors se reflejan en ambos
- Fácil de mantener

### ✅ Flexible
- **Desarrollo**: Usa el CLI directamente
- **Producción**: Usa imágenes Docker
- **Testing**: Fácil probar sin Docker

### ✅ Escalable
- Agregar nuevo proveedor = 1 collector + 1 Dockerfile
- Código compartido en `core/`
- Factory pattern para colectores

### ✅ Profesional
- Basado en **oclif** (framework de Heroku/Salesforce)
- TypeScript con tipos fuertes
- Comandos con flags y validación
- Help automático

## 📝 Ejemplos de Uso

### CLI Standalone

```bash
# Básico
localrun-agent start ngrok --port 8000

# Con todas las opciones
localrun-agent start cloudflare \
  --port 3000 \
  --tunnel-id my-tunnel \
  --backend-url http://localhost:8000 \
  --interval 30 \
  --log-level debug

# Help
localrun-agent start --help
```

### Docker

```bash
# ngrok
docker run -d \
  --name ngrok-8000 \
  -e PROVIDER=ngrok \
  -e TUNNEL_PORT=8000 \
  -e BACKEND_URL=http://backend:8000 \
  localrun/ngrok:latest \
  http host.docker.internal:8000

# cloudflare
docker run -d \
  --name cloudflared-3000 \
  -e PROVIDER=cloudflare \
  -e TUNNEL_PORT=3000 \
  localrun/cloudflared:latest \
  tunnel --url http://host.docker.internal:3000
```

## 🔄 Cómo Funciona

### 1. CLI Standalone
```
Usuario → localrun-agent start ngrok --port 8000
         ↓
    app/commands/start.ts (oclif)
         ↓
    app/services/metrics-service.ts
         ↓
    core/collectors/ngrok-collector.ts
         ↓
    core/reporters/http-reporter.ts
         ↓
    Backend API
```

### 2. Docker Container
```
Docker run → providers/shared/entrypoint.sh
            ↓
        supervisord
            ↓
    ┌───────────────┬─────────────────────┐
    │               │                     │
  ngrok         /app/bin/run.js start ngrok
  daemon        (mismo flujo que CLI)
```

## 🎯 Payload Estándar

```typescript
{
  provider: "ngrok" | "cloudflare" | "localhost.run",
  tunnel_id: string,
  tunnel_port: number,
  timestamp: number,
  metrics: {
    tunnel: { public_url, protocol, status, uptime_seconds },
    requests: { total, rate_1m, rate_5m, errors },
    latency?: { p50, p90, p95, p99 },
    bandwidth: { bytes_in, bytes_out, rate_in_bps, rate_out_bps },
    container: { memory_*, cpu_*, network_* }
  }
}
```

## 🚀 Próximos Pasos

1. ✅ Estructura creada
2. ⏳ `npm install` para instalar dependencias
3. ⏳ `npm run build` para compilar
4. ⏳ Probar CLI: `npm run dev start ngrok --port 8000`
5. ⏳ Build imágenes: `make docker-build-all`
6. ⏳ Integrar con backend de LocalRun

## 📚 Comandos Rápidos

```bash
# Desarrollo
cd localrun-agent
npm install
npm run dev start ngrok --port 8000

# Build
npm run build

# Docker
make docker-build-all

# Test
npm test

# Lint
npm run lint
```

---

**🎉 ¡Listo para usar!**

Este diseño te da:
- ✅ CLI profesional con oclif
- ✅ Imágenes Docker que usan el mismo código
- ✅ Estructura escalable y mantenible
- ✅ Código compartido en `core/`
- ✅ Un solo payload estándar para todos
