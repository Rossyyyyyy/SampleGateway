# File Structure

This document describes the organization and structure of the Inspire Wallet Payment Gateway codebase.

## Overview

The project follows NestJS conventions with a modular architecture. Code is organized into feature modules, shared utilities, infrastructure services, and integrations.

## Root Directory

```text
inspirewallet_gateway_upay_alpha/
├── __mocks__/              # Test mocks
├── data/                   # Local data storage (development/testing)
├── docs/                   # Documentation files
├── prisma/                 # Prisma ORM configuration and schema
├── src/                    # Source code
├── test/                   # End-to-end tests
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── eslint.config.mjs       # ESLint configuration
├── nest-cli.json           # NestJS CLI configuration
├── package.json            # Node.js dependencies and scripts
├── pnpm-lock.yaml         # pnpm lock file
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── README.md              # Project overview and quick start
├── tsconfig.json          # TypeScript configuration
└── tsconfig.build.json    # TypeScript build configuration
```

## Source Code (`src/`)

### Entry Point

- **`main.ts`**: Application entry point. Bootstraps NestJS application, configures middleware, CORS, Swagger, and starts the server.
- **`app.module.ts`**: Root application module. Imports all feature modules and global configurations.

### Core Directories

#### `audit/` - Audit Logging

Audit logging module for tracking security events and activities.

```text
audit/
├── audit.module.ts              # Audit module definition
├── audit.service.ts              # Audit service implementation
├── index.ts                      # Public exports
└── interfaces/
    └── audit-event.interface.ts  # Audit event interface definitions
```

**Purpose**: Logs authentication attempts, authorization failures, sensitive operations, and data access for security auditing.

#### `common/` - Shared Utilities

Reusable utilities, decorators, guards, interceptors, and DTOs used across the application.

```text
common/
├── constants/                    # Application constants
│   ├── error-codes.constant.ts   # Error code definitions
│   ├── transaction-status.constant.ts  # Transaction status constants
│   ├── unionbank-endpoints.constant.ts # UnionBank API endpoints
│   └── index.ts
├── decorators/                   # Custom decorators
│   ├── current-user.decorator.ts # Extract current user from request
│   ├── idempotency-key.decorator.ts # Extract idempotency key
│   ├── public.decorator.ts       # Mark endpoints as public
│   └── index.ts
├── dto/                          # Data Transfer Objects
│   ├── api-response.dto.ts       # Standard API response format
│   ├── pagination.dto.ts         # Pagination DTOs
│   └── index.ts
├── exceptions/                   # Custom exceptions
│   ├── base.exception.ts         # Base exception class
│   ├── transaction.exception.ts  # Transaction-related exceptions
│   ├── unionbank-api.exception.ts # UnionBank API exceptions
│   └── index.ts
├── filters/                      # Exception filters
│   ├── all-exceptions.filter.ts  # Global exception filter
│   └── index.ts
├── guards/                       # Authentication/authorization guards
│   ├── api-key.guard.ts         # API key authentication guard
│   ├── jwt-auth.guard.ts        # JWT authentication guard
│   └── index.ts
├── interceptors/                 # Request/response interceptors
│   ├── logging.interceptor.ts    # Request/response logging
│   ├── timeout.interceptor.ts    # Request timeout handling
│   ├── transform-response.interceptor.ts # Response transformation
│   └── index.ts
├── middleware/                   # HTTP middleware
│   ├── request-id.middleware.ts  # Generate unique request IDs
│   └── index.ts
├── pipes/                        # Validation pipes
│   ├── validation.pipe.ts        # Global validation pipe
│   └── index.ts
├── utils/                        # Utility functions
│   ├── crypto.util.ts            # Cryptographic utilities
│   ├── date.util.ts              # Date manipulation utilities
│   ├── reference-generator.util.ts # Reference ID generation
│   └── index.ts
└── index.ts                      # Public exports
```

**Purpose**: Provides shared functionality, utilities, and common patterns used throughout the application.

#### `config/` - Configuration

Configuration modules for loading and validating environment variables.

```text
config/
├── app.config.ts                 # Application configuration
├── config.module.ts              # Config module definition
├── database.config.ts            # Database configuration
├── firebase.config.ts            # Firebase configuration
├── redis.config.ts               # Redis configuration
├── security.config.ts            # Security configuration (JWT, encryption)
├── unionbank.config.ts           # UnionBank API configuration
└── index.ts                      # Public exports
```

**Purpose**: Centralized configuration management using NestJS ConfigModule. Validates and provides type-safe access to environment variables.

#### `infrastructure/` - Infrastructure Services

Services for external infrastructure components (database, cache, queues, etc.).

```text
infrastructure/
├── database/                     # Database service
│   ├── database.module.ts        # Database module
│   ├── prisma.service.ts         # Prisma service wrapper
│   └── index.ts
├── firebase/                     # Firebase Admin SDK
│   ├── firebase.module.ts        # Firebase module
│   ├── firebase.service.ts       # Firebase service
│   └── index.ts
├── http/                         # HTTP client service
│   ├── http.module.ts            # HTTP module
│   ├── http.service.ts           # Axios-based HTTP service
│   └── index.ts
├── local-storage/                # In-memory storage (dev/testing)
│   ├── local-storage.module.ts   # Local storage module
│   ├── local-storage.service.ts  # In-memory storage implementation
│   ├── local-storage.service.spec.ts # Tests
│   ├── interfaces/
│   │   └── local-storage.interface.ts
│   └── index.ts
├── queue/                        # Bull queue processors
│   ├── queue.module.ts           # Queue module
│   ├── processors/
│   │   ├── transaction.processor.ts # Transaction queue processor
│   │   └── webhook.processor.ts      # Webhook queue processor
│   └── index.ts
├── redis/                        # Redis service
│   ├── redis.module.ts          # Redis module
│   ├── redis.service.ts          # Redis service wrapper
│   └── index.ts
└── index.ts                      # Public exports
```

**Purpose**: Abstracts external infrastructure services (database, cache, queues) and provides consistent interfaces for the application.

#### `integrations/` - Third-Party Integrations

External service integrations, primarily UnionBank API.

```text
integrations/
├── unionbank/                    # UnionBank API integration
│   ├── client/                   # API clients
│   │   ├── unionbank-api.client.ts    # Main API client
│   │   ├── unionbank-oauth.client.ts  # OAuth client
│   │   └── index.ts
│   ├── dto/                      # Data Transfer Objects
│   │   ├── request/              # Request DTOs
│   │   │   ├── account-inquiry.request.dto.ts
│   │   │   ├── instapay-transfer.request.dto.ts
│   │   │   ├── oauth-token.request.dto.ts
│   │   │   ├── pesonet-transfer.request.dto.ts
│   │   │   ├── upay-transaction.request.dto.ts
│   │   │   └── index.ts
│   │   ├── response/             # Response DTOs
│   │   │   ├── account-inquiry.response.dto.ts
│   │   │   ├── instapay-transfer.response.dto.ts
│   │   │   ├── oauth-token.response.dto.ts
│   │   │   ├── pesonet-transfer.response.dto.ts
│   │   │   ├── upay-transaction.response.dto.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── interfaces/               # TypeScript interfaces
│   │   ├── unionbank-config.interface.ts
│   │   ├── unionbank-response.interface.ts
│   │   └── index.ts
│   ├── services/                 # Business logic services
│   │   ├── unionbank-account.service.ts      # Account inquiry service
│   │   ├── unionbank-instapay.service.ts     # InstaPay service
│   │   ├── unionbank-pesonet.service.ts      # PESONet service
│   │   ├── unionbank-upay.service.ts         # uPay direct API service
│   │   ├── unionbank-upay-redirect.service.ts # uPay redirect service
│   │   ├── unionbank-upay-redirect.service.spec.ts # Tests
│   │   └── index.ts
│   ├── utils/                    # Utility functions
│   │   ├── upay-redirect-encryption.util.ts  # uPay encryption utilities
│   │   ├── upay-redirect-encryption.util.spec.ts # Tests
│   │   └── index.ts
│   ├── unionbank.module.ts       # UnionBank module
│   └── index.ts                  # Public exports
└── index.ts                      # Public exports
```

**Purpose**: Encapsulates all UnionBank API integration logic, including OAuth authentication, API clients, request/response DTOs, and business services.

#### `modules/` - Feature Modules

Business logic modules organized by feature domain.

```text
modules/
├── auth/                         # Authentication module
│   ├── auth.controller.ts       # Authentication endpoints
│   ├── auth.module.ts            # Auth module definition
│   ├── auth.service.ts           # Authentication business logic
│   ├── dto/
│   │   └── auth.dto.ts          # Authentication DTOs
│   ├── strategies/
│   │   └── jwt.strategy.ts      # Passport JWT strategy
│   ├── index.ts
│   └── ...
├── deposits/                     # Deposit management module
│   ├── deposits.controller.ts    # Deposit endpoints
│   ├── deposits.module.ts        # Deposits module
│   ├── deposits.service.ts       # Deposit business logic
│   ├── dto/
│   │   └── deposit.dto.ts       # Deposit DTOs
│   ├── entities/
│   │   └── deposit.entity.ts    # Deposit entity
│   ├── repositories/
│   │   ├── deposit.repository.ts           # Deposit repository interface
│   │   ├── deposit.local.repository.ts     # Local storage implementation
│   │   ├── deposit.local.repository.spec.ts # Tests
│   │   └── ...
│   ├── index.ts
│   └── ...
├── health/                       # Health check module
│   ├── health.controller.ts      # Health check endpoints
│   ├── health.module.ts          # Health module
│   ├── indicators/
│   │   ├── database.indicator.ts # Database health indicator
│   │   ├── firebase.indicator.ts # Firebase health indicator
│   │   └── redis.indicator.ts    # Redis health indicator
│   ├── index.ts
│   └── ...
├── transfers/                    # Fund transfer module
│   ├── transfers.controller.ts   # Transfer endpoints
│   ├── transfers.module.ts       # Transfers module
│   ├── transfers.service.ts      # Transfer business logic
│   ├── dto/
│   │   └── transfer.dto.ts      # Transfer DTOs
│   ├── enums/
│   │   └── transfer.enum.ts     # Transfer enums
│   ├── index.ts
│   └── ...
├── webhooks/                     # Webhook processing module
│   ├── webhooks.controller.ts    # Webhook endpoints
│   ├── webhooks.module.ts        # Webhooks module
│   ├── webhooks.service.ts       # Webhook business logic
│   ├── dto/
│   │   └── webhook.dto.ts       # Webhook DTOs
│   ├── handlers/
│   │   ├── base-webhook.handler.ts      # Base webhook handler
│   │   ├── transfer-webhook.handler.ts  # Transfer webhook handler
│   │   └── ...
│   ├── index.ts
│   └── ...
└── index.ts                      # Public exports
```

**Purpose**: Contains feature-specific business logic, controllers, services, and DTOs. Each module is self-contained and can be independently developed and tested.

#### `security/` - Security Services

Security-related services for encryption and signature verification.

```text
security/
├── encryption.service.ts         # AES encryption service
├── signature.service.ts          # HMAC signature service
├── security.module.ts            # Security module
└── index.ts                      # Public exports
```

**Purpose**: Provides encryption and signature verification services for securing sensitive data and verifying webhook authenticity.

## Configuration Files

### Prisma (`prisma/`)

```text
prisma/
├── schema.prisma                 # Database schema definition
└── prisma.config.ts              # Prisma configuration
```

**Purpose**: Defines database schema, models, and relationships using Prisma ORM.

### Test Files (`test/`)

```text
test/
├── app.e2e-spec.ts                # End-to-end tests
├── jest-e2e.json                  # Jest E2E configuration
├── local-storage.example.ts       # Local storage example
├── test-upay-redirect-encryption.ts # uPay encryption tests
└── test-upay.ts                  # uPay integration tests
```

**Purpose**: End-to-end tests and integration test utilities.

### Documentation (`docs/`)

```text
docs/
├── api-reference.md               # Complete API endpoint reference
├── authentication.md              # Authentication guide
├── configuration.md              # Configuration guide
├── database.md                   # Database schema documentation
├── deposits.md                   # Deposit management guide
├── file-structure.md             # This file
├── getting-started.md            # Setup and installation
├── infrastructure.md              # Infrastructure components
├── security.md                   # Security features
├── transfers.md                  # Transfer operations guide
├── unionbank-integration.md      # UnionBank integration details
├── upay-redirect-encryption-tests.md # Encryption test documentation
└── webhooks.md                   # Webhook handling guide
```

**Purpose**: Comprehensive documentation for developers and API consumers.

## Architecture Patterns

### Module Organization

- **Feature Modules**: Each business domain (auth, deposits, transfers, webhooks) has its own module
- **Shared Modules**: Common functionality is in `common/` and `infrastructure/`
- **Integration Modules**: External service integrations are in `integrations/`

### Dependency Flow

```text
Feature Modules (modules/)
    ↓
Business Services (services/)
    ↓
Infrastructure Services (infrastructure/)
    ↓
External Services (integrations/)
```

### File Naming Conventions

- **Modules**: `*.module.ts`
- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **DTOs**: `*.dto.ts`
- **Entities**: `*.entity.ts`
- **Interfaces**: `*.interface.ts`
- **Guards**: `*.guard.ts`
- **Interceptors**: `*.interceptor.ts`
- **Filters**: `*.filter.ts`
- **Pipes**: `*.pipe.ts`
- **Tests**: `*.spec.ts` or `*.test.ts`
- **Index files**: `index.ts` for public exports

### Export Strategy

Each directory typically has an `index.ts` file that exports public APIs, allowing for clean imports:

```typescript
// Instead of:
import { Service } from './modules/auth/services/auth.service';

// Use:
import { Service } from './modules/auth';
```

## Key Files

### Application Entry

- **`src/main.ts`**: Application bootstrap, middleware setup, Swagger configuration
- **`src/app.module.ts`**: Root module that imports all feature modules

### Configuration

- **`src/config/*.config.ts`**: Environment variable configuration
- **`.env.example`**: Template for environment variables
- **`nest-cli.json`**: NestJS CLI configuration

### Database

- **`prisma/schema.prisma`**: Database schema definition
- **`src/infrastructure/database/prisma.service.ts`**: Database service

### Testing

- **`test/`**: End-to-end tests
- **`*.spec.ts`**: Unit tests (co-located with source files)

## Best Practices

1. **Module Boundaries**: Keep modules independent and focused on a single domain
2. **Dependency Injection**: Use NestJS DI for all dependencies
3. **Type Safety**: Use TypeScript interfaces and DTOs for all data structures
4. **Error Handling**: Use custom exceptions and global exception filters
5. **Validation**: Validate all inputs using DTOs and class-validator
6. **Testing**: Write unit tests for services and E2E tests for endpoints
7. **Documentation**: Keep documentation in `docs/` directory up to date
8. **Code Organization**: Follow NestJS conventions and project structure

## Adding New Features

When adding a new feature:

1. Create a new module in `modules/`
2. Define DTOs in `dto/` subdirectory
3. Implement service logic in `*.service.ts`
4. Create controller endpoints in `*.controller.ts`
5. Register module in `app.module.ts`
6. Add tests in `*.spec.ts` files
7. Update documentation in `docs/`

## Related Documentation

- [Getting Started](getting-started.md) - Setup and installation
- [Configuration](configuration.md) - Environment configuration
- [Database](database.md) - Database schema and models
- [API Reference](api-reference.md) - Complete API documentation
