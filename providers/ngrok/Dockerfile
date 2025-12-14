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

# Minimal runtime - Alpine only for ngrok binary
FROM alpine:3.19

# Install ONLY ngrok binary (no supervisor!)
RUN apk add --no-cache ca-certificates \
    && wget -qO- https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tgz \
    | tar xz -C /usr/local/bin \
    && rm -rf /var/cache/apk/* /tmp/*

ENV PROVIDER=ngrok

# Copy Go binary
COPY --from=builder /build/agent /usr/local/bin/agent
COPY providers/shared/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Go binary manages everything (no supervisor!)
ENTRYPOINT ["/entrypoint.sh"]
