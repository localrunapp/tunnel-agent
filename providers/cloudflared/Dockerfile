# Multi-stage build para cloudflared con Node.js
FROM alpine:latest AS runtime

# Instalar dependencias
RUN apk add --no-cache \
    nodejs \
    npm \
    supervisor \
    ca-certificates \
    curl

# Instalar cloudflared
RUN curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared

# Copiar aplicación
COPY dist /app/dist
COPY bin /app/bin
COPY package.json /app/package.json
COPY node_modules /app/node_modules

WORKDIR /app

# Copiar configuración de supervisor
COPY providers/cloudflared/supervisord.conf /etc/supervisord.conf

# Copiar entrypoint compartido
COPY providers/shared/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
