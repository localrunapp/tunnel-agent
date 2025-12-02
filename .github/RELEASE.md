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

### Automatic (Recommended)

1. **Update version** in `package.json`:
   ```bash
   npm version patch  # or minor, major
   ```

2. **Push the tag**:
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions will**:
   - Build TypeScript CLI
   - Build Docker images for both providers
   - Push to GHCR with version tags
   - (Optional) Push to Docker Hub if secrets are configured

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
