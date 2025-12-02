FROM cloudflare/cloudflared:latest

RUN apk add --no-cache nodejs npm supervisor

COPY dist /app/dist
COPY bin /app/bin
COPY package.json /app/package.json
COPY node_modules /app/node_modules

WORKDIR /app

COPY providers/cloudflared/supervisord.conf /etc/supervisord.conf
COPY providers/shared/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
