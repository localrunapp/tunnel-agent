# ULTRA-minimal cloudflared - No supervisor needed!
FROM golang:1.21-alpine AS builder

WORKDIR /build
COPY go.mod ./
RUN touch go.sum
COPY cmd ./cmd
COPY internal ./internal
RUN go mod tidy && go mod download

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build \
    -a -installsuffix cgo \
    -ldflags="-w -s" \
    -trimpath \
    -o agent ./cmd/agent

# Minimal runtime
FROM alpine:3.19

# Install cloudflared binary
RUN apk add --no-cache ca-certificates curl \
    && ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') \
    && curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}" \
    -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared \
    && apk del curl \
    && rm -rf /var/cache/apk/* /tmp/*

ENV PROVIDER=cloudflare

# Copy Go binary
COPY --from=builder /build/agent /usr/local/bin/agent
COPY providers/shared/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Go binary manages everything
ENTRYPOINT ["/entrypoint.sh"]
