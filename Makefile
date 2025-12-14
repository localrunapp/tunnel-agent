# LocalRun Agent (Go) - Makefile

.PHONY: help
help:
	@echo "LocalRun Agent (Go) - Build System"
	@echo "=================================="
	@echo ""
	@echo "Go Commands:"
	@echo "  build             - Build Go binary locally"
	@echo "  run               - Run agent locally"
	@echo "  clean             - Clean build artifacts"
	@echo ""
	@echo "Docker Commands:"
	@echo "  build-ngrok       - Build ngrok image"
	@echo "  build-cloudflared - Build cloudflared image"
	@echo "  build-pinggy      - Build pinggy image"
	@echo "  build-all         - Build all images"
	@echo ""
	@echo "Release Commands:"
	@echo "  release-patch     - Create patch release"
	@echo "  release-minor     - Create minor release"
	@echo "  release-major     - Create major release"
	@echo ""

# Variables
BINARY_NAME=agent
DIST_DIR=dist

# Go targets
.PHONY: build
build:
	@echo "Building Go binary..."
	@mkdir -p $(DIST_DIR)
	@go build -o $(DIST_DIR)/$(BINARY_NAME) ./cmd/agent
	@echo "✅ Built: $(DIST_DIR)/$(BINARY_NAME)"

.PHONY: run
run: build
	@./$(DIST_DIR)/$(BINARY_NAME)

.PHONY: clean
clean:
	@rm -rf $(DIST_DIR)
	@echo "Cleaned build artifacts"

# Docker targets
.PHONY: build-ngrok
build-ngrok:
	@echo "Building ngrok image..."
	docker build -t ghcr.io/localrunapp/ngrok-go:dev -f providers/ngrok/Dockerfile .
	@echo "✅ Built: ghcr.io/localrunapp/ngrok-go:dev"

.PHONY: build-cloudflared
build-cloudflared:
	@echo "Building cloudflared image..."
	docker build -t ghcr.io/localrunapp/cloudflared-go:dev -f providers/cloudflared/Dockerfile .
	@echo "✅ Built: ghcr.io/localrunapp/cloudflared-go:dev"

.PHONY: build-pinggy
build-pinggy:
	@echo "Building pinggy image..."
	docker build -t ghcr.io/localrunapp/pinggy-go:dev -f providers/pinggy/Dockerfile .
	@echo "✅ Built: ghcr.io/localrunapp/pinggy-go:dev"

.PHONY: build-all
build-all: build-ngrok build-cloudflared build-pinggy
	@echo "✅ All images built"

# Release management
.PHONY: release-patch
release-patch:
	@echo "Creating patch release..."
	@# We use a file for versioning since we don't have package.json anymore
	@# Or we can just rely on git tags
	@$(MAKE) create-release TYPE=patch

.PHONY: release-minor
release-minor:
	@echo "Creating minor release..."
	@$(MAKE) create-release TYPE=minor

.PHONY: release-major
release-major:
	@echo "Creating major release..."
	@$(MAKE) create-release TYPE=major

.PHONY: create-release
create-release:
	@echo "Creating GitHub release..."
	@# Get current version from git tag or default to v0.0.0
	@LAST_TAG=$$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"); \
	echo "Last tag: $$LAST_TAG"; \
	# Logic to increment version would go here, but for now we'll let user handle tagging or use a script
	# For simplicity in this migration, we'll ask user to tag manually or use a script
	@echo "Automatic version bumping for Go project requires a script."
	@echo "Please run: git tag v2.0.0 && git push origin v2.0.0"
