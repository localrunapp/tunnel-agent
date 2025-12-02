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
	@echo "For release commands, run: make help-release"
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

# Release management
.PHONY: release-patch
release-patch:
	@echo "Creating patch release..."
	@npm version patch
	@$(MAKE) create-release

.PHONY: release-minor
release-minor:
	@echo "Creating minor release..."
	@npm version minor
	@$(MAKE) create-release

.PHONY: release-major
release-major:
	@echo "Creating major release..."
	@npm version major
	@$(MAKE) create-release

.PHONY: create-release
create-release:
	@echo "Pushing tags and creating GitHub release..."
	@git push origin main --tags
	@VERSION=$$(node -p "require('./package.json').version"); \
	TAG="v$$VERSION"; \
	echo "Creating release $$TAG..."; \
	gh release create $$TAG \
		--title "$$TAG" \
		--generate-notes \
		--latest \
		--verify-tag

.PHONY: help-release
help-release:
	@echo "Release Commands:"
	@echo "  release-patch     - Bump patch version (1.0.0 -> 1.0.1) and create release"
	@echo "  release-minor     - Bump minor version (1.0.0 -> 1.1.0) and create release"
	@echo "  release-major     - Bump major version (1.0.0 -> 2.0.0) and create release"
	@echo ""
	@echo "Example: make release-patch"

