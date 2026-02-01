# ====================================
# InspireWallet Gateway UPay Alpha
# Multi-stage Dockerfile
# Supports: macOS, Windows, Linux (including Arch)
# ====================================

# ---- Base Stage ----
FROM node:22-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Install system dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    openssl

# ---- Dependencies Stage ----
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# ---- Build Stage ----
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# ---- Production Dependencies Stage ----
FROM base AS prod-deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma client for production
RUN pnpm prisma generate

# ---- Production Stage ----
FROM node:22-alpine AS production

LABEL maintainer="InspireWallet Team"
LABEL description="InspireWallet Gateway UPay Alpha - Production Image"
LABEL version="0.0.1"

# Install essential runtime dependencies
RUN apk add --no-cache \
    openssl \
    tini \
    curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy built assets from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/main.js"]

# ---- Development Stage ----
FROM base AS development

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000

# Expose port and debug port
EXPOSE 3000 9229

# Start in development mode with hot reload
CMD ["pnpm", "start:dev"]
