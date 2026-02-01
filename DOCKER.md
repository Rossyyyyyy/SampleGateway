# Docker Integration

The InspireWallet Gateway uses Docker and Docker Compose to provide a consistent, reproducible development and production environment. This guide covers the setup, usage, and architecture of the containerized infrastructure.

## Overview

The Docker integration supports multiple operating systems and provides:

- **Consistency**: Identical environments across macOS, Windows, and Linux.
- **Dependency Management**: Automatically manages PostgreSQL, Redis, and development tools.
- **Isolation**: Keeps project dependencies separate from your host system.
- **Production Readiness**: Multi-stage builds for minimal, secure production images.

## Prerequisites

Before using the Docker setup, ensure you have:

- **Docker**: Latest version of Docker Desktop (macOS/Windows) or Docker Engine (Linux).
- **Docker Compose**: v2.x or higher.
- **pnpm**: v9.x or higher (for local environment synchronization).

## Quick Start

The easiest way to get started is to use the platform-specific setup scripts provided in the `scripts/` directory.

### macOS

```bash
chmod +x scripts/setup-macos.sh
./scripts/setup-macos.sh
```

### Windows (PowerShell Administrator)

```powershell
Set-ExecutionPolicy Bypass -Scope Process
.\scripts\setup-windows.ps1
```

### Arch Linux

```bash
chmod +x scripts/setup-arch.sh
./scripts/setup-arch.sh
```

### Other Linux (Ubuntu, Fedora, etc.)

```bash
chmod +x scripts/setup-linux.sh
./scripts/setup-linux.sh
```

## Docker Services

The `docker-compose.yml` file defines the following services:

### Core Services

- **Application**: The NestJS gateway service on port `3000`.
- **Database**: PostgreSQL 16 on port `5432`.
- **Redis**: Redis 7 on port `6379`.

### Optional Tools

Available when running with the `tools` profile:

- **pgAdmin**: Database management UI on port `8082`.
- **Redis Commander**: Redis UI on port `8081`.
- **Prisma Studio**: Database explorer on port `5555`.

## Docker Helper Script

A unified helper script is provided at `scripts/docker-helper.sh` for common operations.

**Usage**: `./scripts/docker-helper.sh [command]`

| Command | Description |
|---------|-------------|
| `up` | Start development environment |
| `up:tools` | Start services with development tools |
| `up:prod` | Start production environment |
| `down` | Stop all services |
| `logs [service]` | View logs for a specific service |
| `shell [service]` | Open a shell in a service container |
| `db:migrate` | Sync database schema via Prisma |
| `health` | Check health status of all services |

## Configuration

### Environment Variables

The Docker setup reads configuration from environment files:

- **Development**: Uses `.env`
- **Production**: Uses `.env.production`

Key variables for Docker:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/inspirewallet?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
```

### Build Context

The `.dockerignore` file ensures only necessary files are sent to the Docker daemon, excluding:

- `node_modules`
- `dist` and `coverage`
- Local environment files (except examples)
- Version control and IDE-specific files

## Multi-Stage Build

The `Dockerfile` performs a multi-stage build to optimize image size and security:

1. **base**: Node.js 22 Alpine with pnpm and essential build tools.
2. **deps**: Installs all dependencies and generates Prisma client.
3. **builder**: Compiles TypeScript to JavaScript.
4. **prod-deps**: Installs only production dependencies.
5. **production**: Minimal runtime image with non-root user and health checks.
6. **development**: Development image with devDependencies and hot-reload.

## Resource Management

Production services are configured with resource limits in `docker-compose.prod.yml`:

- **Application**: 1GB Limit / 256MB Reservation
- **Postgres**: 2GB Limit / 512MB Reservation
- **Redis**: 768MB Limit / 256MB Reservation

## Troubleshooting

### Common Commands

**Restarting Services**:
```bash
docker compose restart
```

**Viewing Logs**:
```bash
docker compose logs -f app
```

**Cleaning Up**:
```bash
docker system prune -a --volumes
```

### Troubleshooting Tips

1. **Port Conflicts**: Ensure ports 3000, 5432, and 6379 are not occupied by local services.
2. **Permission Denied**: On Linux, ensure your user is in the `docker` group.
3. **Database Sync**: If the database is out of sync, run `./scripts/docker-helper.sh db:migrate`.

## Next Steps

- Read the [Getting Started](docs/getting-started.md) guide for local setup info.
- Review [Infrastructure](docs/infrastructure.md) for more architecture details.
- Check [Configuration](docs/configuration.md) for available environment variables.
