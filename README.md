# Inspire Wallet - UnionBank Payment Gateway

A NestJS-based payment gateway application that integrates with UnionBank's uPay service, providing secure payment processing, fund transfers (InstaPay and PESONet), and deposit management capabilities.

## Overview

This gateway serves as a middleware between partners/clients and UnionBank's payment services, offering:

- **Payment Processing**: Secure payment transactions via UnionBank uPay
- **Fund Transfers**: InstaPay and PESONet transfer capabilities
- **Deposit Management**: Deposit creation and tracking
- **Webhook Handling**: Asynchronous event processing
- **Multi-tenant Support**: Partner-based API key authentication
- **Audit Logging**: Comprehensive activity tracking
- **Security**: Encryption, signature verification, and JWT authentication

## Features

- 🔐 JWT-based authentication with API key support
- 💸 InstaPay and PESONet fund transfers
- 💰 Deposit management with status tracking
- 🔔 Webhook event processing
- 🔒 End-to-end encryption for sensitive data
- 📊 Comprehensive audit logging
- 🏥 Health check endpoints
- 📝 Swagger API documentation
- ⚡ Queue-based asynchronous processing
- 🔄 Idempotency support for safe retries

## Technology Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Local in-memory cache with AES-256 encryption
- **Queues**: Redis with Bull (for transaction/webhook processing)
- **Authentication**: JWT (Passport)
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Validation**: class-validator, class-transformer

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
pnpm prisma generate
pnpm prisma migrate dev

# Start development server
pnpm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`  
Swagger documentation at `http://localhost:3000/docs`

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Getting Started](docs/getting-started.md) - Setup and installation guide
- [Authentication](docs/authentication.md) - Authentication and authorization
- [Transfers](docs/transfers.md) - Fund transfer operations
- [Deposits](docs/deposits.md) - Deposit management
- [Webhooks](docs/webhooks.md) - Webhook handling
- [UnionBank Integration](docs/unionbank-integration.md) - UnionBank API integration details
- [Security](docs/security.md) - Security features and best practices
- [Infrastructure](docs/infrastructure.md) - Infrastructure components
- [Database](docs/database.md) - Database schema and models
- [Configuration](docs/configuration.md) - Configuration guide
- [API Reference](docs/api-reference.md) - Complete API endpoint reference

## Project Structure

```text
src/
├── app.module.ts           # Root application module
├── main.ts                 # Application entry point
├── audit/                  # Audit logging module
├── common/                 # Shared utilities, guards, interceptors
├── config/                 # Configuration modules
├── infrastructure/         # External service integrations
│   ├── cache/             # Local in-memory cache with encryption
│   ├── database/           # Prisma database service
│   ├── redis/             # Redis service (for queues)
│   ├── firebase/          # Firebase service
│   ├── http/              # HTTP client service
│   └── queue/             # Bull queue processors (constants extracted)
├── integrations/          # Third-party integrations
│   └── unionbank/         # UnionBank API integration
├── modules/               # Feature modules
│   ├── auth/              # Authentication
│   ├── deposits/          # Deposit management
│   ├── transfers/        # Fund transfers
│   ├── webhooks/          # Webhook processing
│   └── health/            # Health checks
└── security/              # Security services (encryption, signatures)
```

## Environment Variables

Key environment variables (see [Configuration](docs/configuration.md) for complete list):

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host (for Bull queues)
- `JWT_SECRET` - JWT signing secret
- `CACHE_ENCRYPTION_KEY` - Optional AES key for cache encryption
- `UNIONBANK_CLIENT_ID` - UnionBank API client ID
- `UNIONBANK_CLIENT_SECRET` - UnionBank API client secret
- `UNIONBANK_UPAY_AES_KEY` - AES key for uPay redirect encryption

## Scripts

```bash
# Development
pnpm run start:dev      # Start with hot reload
pnpm run start:debug    # Start with debugger

# Production
pnpm run build          # Build application
pnpm run start:prod     # Start production server

# Testing
pnpm run test           # Run unit tests
pnpm run test:watch     # Run tests in watch mode
pnpm run test:cov       # Run tests with coverage
pnpm run test:e2e       # Run end-to-end tests

# Code Quality
pnpm run lint           # Run ESLint
pnpm run format         # Format code with Prettier
```

## License

UNLICENSED - Private project
