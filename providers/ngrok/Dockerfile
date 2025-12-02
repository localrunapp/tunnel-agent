# Stage 1: Build stage con Node.js
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos del proyecto
COPY dist ./dist
COPY bin ./bin
COPY package.json ./
COPY node_modules ./node_modules

# Stage 2: Runtime con ngrok
FROM ngrok/ngrok:latest

# Instalar dependencias necesarias
USER root
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copiar aplicación desde builder
COPY --from=builder /app /app

WORKDIR /app

# Copiar configuración de supervisor
COPY providers/ngrok/supervisord.conf /etc/supervisord.conf

# Copiar entrypoint compartido
COPY providers/shared/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
