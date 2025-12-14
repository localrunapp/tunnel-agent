# ULTRA-minimal Pinggy image
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

# Install openssh-client (required for Pinggy)
RUN apk add --no-cache openssh-client ca-certificates \
    && rm -rf /var/cache/apk/* /tmp/*

ENV PROVIDER=pinggy

# Copy Go binary
COPY --from=builder /build/agent /usr/local/bin/agent
COPY providers/shared/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Go binary manages everything
ENTRYPOINT ["/entrypoint.sh"]
