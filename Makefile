# LocalRun Agent - Makefile

.PHONY: help
help:
	@echo "LocalRun Agent - Build System"
	@echo "=============================="
	@echo ""
	@echo "CLI Commands:"
	@echo "  install           - Install dependencies"
	@echo "  build             - Build TypeScript to dist/"
	@echo "  dev               - Run in development mode"
	@echo "  test              - Run tests"
	@echo "  lint              - Run linter"
	@echo ""
	@echo "Docker Commands:"
	@echo "  docker-build-all  - Build all provider images"
	@echo "  docker-build-ngrok      - Build ngrok image"
	@echo "  docker-build-cloudflared - Build cloudflared image"
	@echo "  docker-push-all   - Push all images to registry"
	@echo ""

# Variables
REGISTRY ?= localrun
TAG ?= latest

# CLI targets
.PHONY: install
install:
	npm install

.PHONY: build
build:
	npm run build

.PHONY: dev
dev:
	npm run dev

.PHONY: test
test:
	npm test

.PHONY: lint
lint:
	npm run lint

# Docker targets
.PHONY: docker-build-all
docker-build-all: build docker-build-ngrok docker-build-cloudflared
	@echo "✅ All Docker images built"

.PHONY: docker-build-ngrok
docker-build-ngrok: build
	@echo "🔨 Building ngrok image..."
	docker build \
		-t $(REGISTRY)/ngrok:$(TAG) \
		-f providers/ngrok/Dockerfile \
		.
	@echo "✅ Built: $(REGISTRY)/ngrok:$(TAG)"

.PHONY: docker-build-cloudflared
docker-build-cloudflared: build
	@echo "🔨 Building cloudflared image..."
	docker build \
		-t $(REGISTRY)/cloudflared:$(TAG) \
		-f providers/cloudflared/Dockerfile \
		.
	@echo "✅ Built: $(REGISTRY)/cloudflared:$(TAG)"

.PHONY: docker-push-all
docker-push-all:
	docker push $(REGISTRY)/ngrok:$(TAG)
	docker push $(REGISTRY)/cloudflared:$(TAG)

.PHONY: docker-clean
docker-clean:
	docker rmi -f $(REGISTRY)/ngrok:$(TAG) || true
	docker rmi -f $(REGISTRY)/cloudflared:$(TAG) || true

# Clean
.PHONY: clean
clean:
	rm -rf dist node_modules

.PHONY: clean-all
clean-all: clean docker-clean
