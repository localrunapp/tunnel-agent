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
# Release Commands
	@echo "  release-patch     - Create patch release (0.0.X)"
	@echo "  release-minor     - Create minor release (0.X.0)"
	@echo "  release-major     - Create major release (X.0.0)"
	@echo ""

# Variables
BINARY_NAME=agent
DIST_DIR=dist
VERSION ?= $(shell cat VERSION)

# Go targets
.PHONY: build
build:
	@echo "Building Go binary..."
	@mkdir -p $(DIST_DIR)
	@go build -ldflags "-X 'github.com/localrunapp/tunnel-agent/internal/version.Version=$(VERSION)'" -o $(DIST_DIR)/$(BINARY_NAME) ./cmd/agent
	@echo "Built: $(DIST_DIR)/$(BINARY_NAME) (v$(VERSION))"

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
	docker build -t ghcr.io/localrunapp/ngrok:dev -f providers/ngrok/Dockerfile .
	@echo "Built: ghcr.io/localrunapp/ngrok:dev"

.PHONY: build-cloudflared
build-cloudflared:
	@echo "Building cloudflared image..."
	docker build -t ghcr.io/localrunapp/cloudflared:dev -f providers/cloudflared/Dockerfile .
	@echo "Built: ghcr.io/localrunapp/cloudflared:dev"

.PHONY: build-pinggy
build-pinggy:
	@echo "Building pinggy image..."
	docker build -t ghcr.io/localrunapp/pinggy:dev -f providers/pinggy/Dockerfile .
	@echo "Built: ghcr.io/localrunapp/pinggy:dev"

.PHONY: build-all
build-all: build-ngrok build-cloudflared build-pinggy
	@echo "All images built"

# Release management
.PHONY: release-patch
release-patch:
	@$(MAKE) bump-version TYPE=patch

.PHONY: release-minor
release-minor:
	@$(MAKE) bump-version TYPE=minor

.PHONY: release-major
release-major:
	@$(MAKE) bump-version TYPE=major

.PHONY: bump-version
bump-version:
	@if [ -z "$(TYPE)" ]; then echo "TYPE is not set"; exit 1; fi
	@echo "Current version: $(VERSION)"
	@# Calculate new version using awk
	@NEW_VERSION=$$(echo $(VERSION) | awk -F. -v type=$(TYPE) 'OFS="." { \
		if (type == "major") { $$1++; $$2=0; $$3=0 } \
		else if (type == "minor") { $$2++; $$3=0 } \
		else { $$3++ } \
		print $$0 \
	}'); \
	echo "New version: $$NEW_VERSION"; \
	echo "$$NEW_VERSION" > VERSION; \
	echo "Updating Go version file..."; \
	echo "package version" > internal/version/version.go; \
	echo "" >> internal/version/version.go; \
	echo "// Version is the current version of the application" >> internal/version/version.go; \
	echo "const Version = \"$$NEW_VERSION\"" >> internal/version/version.go; \
	echo "Committing versions..."; \
	git add VERSION internal/version/version.go; \
	git commit -m "chore: release v$$NEW_VERSION"; \
	git push origin main; \
	echo "Creating GitHub Release..."; \
	gh release create v$$NEW_VERSION --generate-notes; \
	echo "Released v$$NEW_VERSION"; \
	echo "Tag pushed successfully. GitHub Actions will create the release with binaries."