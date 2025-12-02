FROM ngrok/ngrok:latest

# Instalar Node.js y supervisor
RUN apk add --no-cache \
    nodejs \
    npm \
    supervisor

# Copiar el CLI compilado
COPY dist /app/dist
COPY bin /app/bin
COPY package.json /app/package.json
COPY node_modules /app/node_modules

WORKDIR /app

# Copiar configuración de supervisor
COPY providers/ngrok/supervisord.conf /etc/supervisord.conf

# Copiar entrypoint compartido
COPY providers/shared/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
