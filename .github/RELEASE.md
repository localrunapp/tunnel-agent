# Release Process

## Automated Releases

This repository uses GitHub Actions to automatically build and publish Docker images.

## Workflows

### 1. CI (`ci.yml`)
- **Triggers**: Every push to `main`, all PRs
- **Actions**: Lint, build, test
- **Purpose**: Ensure code quality

### 2. Docker Publish (`docker-publish.yml`)
- **Triggers**: Push to `main`, tags `v*`, PRs, manual
- **Registry**: GitHub Container Registry (ghcr.io)
- **Images**: 
  - `ghcr.io/localrunapp/ngrok`
  - `ghcr.io/localrunapp/cloudflared`
- **Platforms**: linux/amd64, linux/arm64
- **Tags**:
  - `latest` - Latest build from main
  - `v1.2.3` - Semantic version from git tag
  - `main-sha-abc123` - Branch + commit SHA
- **Authentication**: Uses `GITHUB_TOKEN` (automatic)

### 3. Docker Hub Publish (`dockerhub-publish.yml`) - Optional
- **Triggers**: Tags `v*`, manual dispatch
- **Registry**: Docker Hub
- **Images**:
  - `localrunapp/ngrok`
  - `localrunapp/cloudflared`
- **Authentication**: Requires secrets (see below)

## Creating a Release

### Using Makefile (Recommended)

The easiest way to create a release is using the Makefile commands:

```bash
# Patch release (1.0.0 → 1.0.1) - Bug fixes
make release-patch

# Minor release (1.0.0 → 1.1.0) - New features, backward compatible
make release-minor

# Major release (1.0.0 → 2.0.0) - Breaking changes
make release-major
```

**What happens:**
1. ✅ Bumps version in `package.json`
2. ✅ Creates git commit with version bump
3. ✅ Creates git tag (e.g., `v1.0.1`)
4. ✅ Pushes commit and tag to GitHub
5. ✅ Creates GitHub Release with auto-generated changelog
6. ✅ Marks release as "latest"
7. ✅ Triggers Docker image build and publish workflow

### Manual Process

If you prefer manual control:

```bash
# 1. Bump version
npm version patch  # or minor, major

# 2. Push changes
git push origin main --tags

# 3. Create GitHub release
gh release create v1.0.1 \
  --title "Release v1.0.1" \
  --generate-notes \
  --latest
```

### Manual Dispatch

You can manually trigger builds from GitHub Actions UI:
- Go to Actions → Docker Publish → Run workflow
- Select branch and click "Run workflow"

## Required Secrets (Docker Hub Only)

If you want to publish to Docker Hub, add these secrets in repository settings:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Add:
   - `DOCKERHUB_USERNAME` - Your Docker Hub username
   - `DOCKERHUB_TOKEN` - Docker Hub access token ([create here](https://hub.docker.com/settings/security))

## Image Tags Strategy

| Event | Tags Generated |
|-------|----------------|
| Push to `main` | `latest`, `main-sha-abc123` |
| Tag `v1.2.3` | `v1.2.3`, `1.2`, `1`, `latest` |
| PR #42 | `pr-42` |
| Manual | Based on input |

## Testing Images Locally

```bash
# Pull from GHCR
docker pull ghcr.io/localrunapp/ngrok:latest

# Run
docker run -d \
  --name ngrok-test \
  -e PROVIDER=ngrok \
  -e TUNNEL_PORT=8000 \
  -e BACKEND_URL=http://backend:8000 \
  ghcr.io/localrunapp/ngrok:latest \
  http host.docker.internal:8000
```

## Troubleshooting

### Build Fails
- Check that `npm run build` works locally
- Ensure all dependencies are in `package.json`
- Check workflow logs in Actions tab

### Permission Denied (GHCR)
- GHCR uses `GITHUB_TOKEN` automatically
- Ensure workflow has `packages: write` permission (already configured)

### Docker Hub Push Fails
- Verify secrets are set correctly
- Check Docker Hub token hasn't expired
- Ensure organization/username matches `DOCKERHUB_ORG` in workflow
