# Infrastructure

The gateway uses various infrastructure components to support its operations, including database, caching, queues, and external service integrations.

## Overview

Infrastructure components:

- **Database**: PostgreSQL with Prisma ORM (with environment-based logging)
- **Cache**: Local in-memory cache with AES-256-GCM encryption
- **Queue**: Redis with Bull queues (queue constants extracted)
- **Firebase**: Firebase Admin SDK integration
- **HTTP Client**: Axios-based HTTP service

## Database

### Prisma ORM

The gateway uses Prisma as the ORM for database operations.

**Service**: `PrismaService`

**Features**:

- Type-safe database queries
- Migration management
- Connection pooling
- Transaction support

**Usage**:

```typescript
// Query
const partner = await prisma.partner.findUnique({
  where: { apiKey: 'key-123' }
});

// Create
const transfer = await prisma.transfer.create({
  data: { ... }
});

// Transaction
await prisma.$transaction([
  prisma.transfer.create({ data: {...} }),
  prisma.transaction.create({ data: {...} })
]);
```

### Connection Management

Prisma handles connection pooling automatically:

- **Connection Pool**: Configured via `DATABASE_URL`
- **Max Connections**: Set in connection string
- **Connection Timeout**: Default 10 seconds

### Migrations

```bash
# Create migration
pnpm prisma migrate dev --name migration-name

# Apply migrations
pnpm prisma migrate deploy

# Reset database
pnpm prisma migrate reset
```

### Prisma Logging

Prisma logging is configured based on the environment:

- **Development**: Logs queries, info, warnings, and errors
- **Production**: Logs only errors

```typescript
constructor() {
  super({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });
}
```

See [Database](database.md) for schema details.

## Local Cache

### Cache Service

The gateway uses a high-performance local in-memory cache with encryption support. This replaces Redis for general caching purposes while Redis is retained for Bull queue management.

**Service**: `CacheService`

**Features**:

- AES-256-GCM authenticated encryption
- LRU (Least Recently Used) eviction policy
- TTL (Time-To-Live) support
- Circuit breaker pattern for resilience
- Single-flight pattern to prevent cache stampede
- Automatic cleanup of expired entries
- Statistics and memory usage tracking

**Usage**:

```typescript
// Basic operations
await cacheService.set('key', 'value', { ttl: 3600 }); // TTL: 1 hour
const value = await cacheService.get<string>('key');

// Encrypted storage (for sensitive data)
await cacheService.set('token:123', sensitiveData, {
  ttl: 3600,
  encrypt: true
});

// Get with fallback (single-flight pattern)
const data = await cacheService.getOrSet('user:123', async () => {
  return await fetchFromDatabase();
}, { ttl: 300 });

// Delete operations
await cacheService.delete('key');
await cacheService.deleteByPrefix('user:'); // Delete by pattern

// Statistics
const stats = cacheService.getStats();
// { hits, misses, hitRate, entries, evictions, encryptedEntries, memoryUsageEstimate, circuitState }
```

### Cache Configuration

Cache behavior is controlled via constants in `cache.constants.ts`:

```typescript
const CACHE_CONSTANTS = {
  DEFAULT_TTL: 300,        // 5 minutes (seconds)
  SHORT_TTL: 60,           // 1 minute
  LONG_TTL: 3600,          // 1 hour
  MAX_ENTRIES: 10000,      // Maximum cache size
  EVICTION_THRESHOLD: 0.1, // Evict 10% when full
  CIRCUIT_BREAKER_THRESHOLD: 5,  // Failures before opening
  CIRCUIT_BREAKER_TIMEOUT: 30000, // 30s before half-open
  SINGLE_FLIGHT_TIMEOUT: 5000,   // 5s timeout for in-flight requests
};
```

### Cache Encryption

Sensitive data can be encrypted at rest using AES-256-GCM:

```env
# Optional: 64-char hex key or 32-char string
CACHE_ENCRYPTION_KEY=your-32-byte-or-64-hex-encryption-key
```

If not provided, a random key is generated (suitable for single-instance deployments).

### Cache Key Prefixes

Predefined prefixes for organizing cache entries:

```typescript
const CACHE_PREFIXES = {
  SESSION: 'session:',
  TOKEN: 'token:',
  RATE_LIMIT: 'ratelimit:',
  BILLER: 'biller:',
  TRANSACTION: 'tx:',
  WEBHOOK: 'webhook:',
  CONFIG: 'config:',
};
```

### Circuit Breaker

The cache includes a circuit breaker to handle failures gracefully:

- **CLOSED**: Normal operation
- **OPEN**: After threshold failures, rejects all requests
- **HALF_OPEN**: After timeout, allows one test request

## Redis

### Redis for Queues

Redis is used as the backend for Bull queue management (not for general caching).

**Note**: General caching has been moved to the local `CacheService`. Redis is retained for queue storage due to its distributed nature and Bull queue requirements.

### Redis Configuration

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_KEY_PREFIX=inspirewallet:
```

## Queue System

### Bull Queues

Bull provides job queue functionality with Redis backend.

**Module**: `QueueModule`

### Queue Constants

Queue names are extracted to `queue.constants.ts` to avoid circular dependency issues:

```typescript
// queue.constants.ts
export const QUEUE_NAMES = {
  TRANSACTION: 'transaction',
  WEBHOOK: 'webhook',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
```

**Queues**:

- `transaction`: Transaction processing
- `webhook`: Webhook processing

**Usage**:

```typescript
import { QUEUE_NAMES } from './queue.constants';

// Inject queue
constructor(
  @InjectQueue(QUEUE_NAMES.TRANSACTION)
  private transactionQueue: Queue
) {}

// Add job
await this.transactionQueue.add('process', {
  transferId: 'transfer-123',
  amount: 1000
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000
  }
});
```

### Queue Processors

**Transaction Processor**: Processes transaction jobs

```typescript
@Processor(QUEUE_NAMES.TRANSACTION)
export class TransactionProcessor {
  @Process('process')
  async handleTransaction(job: Job) {
    const { transferId } = job.data;
    // Process transaction
  }
}
```

**Webhook Processor**: Processes webhook jobs

```typescript
@Processor(QUEUE_NAMES.WEBHOOK)
export class WebhookProcessor {
  @Process('process')
  async handleWebhook(job: Job) {
    const { payload } = job.data;
    // Process webhook
  }
}
```

### Queue Configuration

- **Retry Attempts**: 3 attempts
- **Backoff Strategy**: Exponential (1s, 2s, 4s)
- **Job Removal**: Completed jobs removed, failed jobs retained
- **Concurrency**: Configurable per processor

## Firebase

### Firebase Admin SDK

Firebase integration for additional services.

**Service**: `FirebaseService`

**Features**:

- Firebase Admin SDK initialization
- Service account authentication
- Firestore access (if needed)

**Configuration**:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
```

**Usage**:

```typescript
const firebaseApp = firebaseService.getApp();
// Use Firebase Admin SDK
```

## HTTP Client

### HTTP Service

Axios-based HTTP client for external API calls.

**Service**: `HttpService`

**Features**:

- Request/response interceptors
- Automatic retry logic
- Timeout handling
- Error transformation
- Request ID tracking

**Usage**:

```typescript
// GET request
const response = await httpService.get('https://api.example.com/data', {
  headers: { 'Authorization': 'Bearer token' }
});

// POST request
const response = await httpService.post('https://api.example.com/data', {
  data: { ... }
}, {
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});
```

### HTTP Client Configuration

- **Timeout**: Configurable per request
- **Retry**: Automatic retry on failures
- **Interceptors**: Request/response logging

## Local Storage

### In-Memory Storage

**Note**: The `LocalStorageService` has been superseded by the `CacheService` for most use cases. The `CacheService` provides additional features like encryption, circuit breakers, and LRU eviction.

For temporary data storage with advanced features, use `CacheService` instead.

**Use Cases for CacheService**:

- OAuth token caching (encrypted)
- Session storage
- Rate limiting data
- Biller configuration caching
- Transaction state caching

## Health Checks

### Health Indicators

Health check endpoints monitor infrastructure status.

**Module**: `HealthModule`

**Indicators**:

- **Database**: PostgreSQL connection via Prisma
- **Cache**: Local in-memory cache circuit breaker state
- **Redis**: Redis connection (for queues)
- **Firebase**: Firebase connection

**Endpoint**: `GET /api/v1/health`

**Response**:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up", "database": "postgresql" },
    "cache": { "status": "up" },
    "redis": { "status": "up" },
    "firebase": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up", "database": "postgresql" },
    "cache": { "status": "up" },
    "redis": { "status": "up" },
    "firebase": { "status": "up" }
  }
}
```

## Monitoring

### Logging

Winston logger for application logging.

**Configuration**:

- **Levels**: error, warn, log, debug, verbose
- **Format**: JSON in production, readable in development
- **Transports**: Console, file (optional)

**Usage**:

```typescript
this.logger.log('Info message');
this.logger.error('Error message', error.stack);
this.logger.debug('Debug message', { data });
```

### Metrics

Consider integrating metrics collection:

- **Prometheus**: Metrics endpoint
- **StatsD**: StatsD client
- **Custom Metrics**: Application-specific metrics

## Error Handling

### Global Exception Filter

All exceptions are caught and transformed:

**Filter**: `AllExceptionsFilter`

**Features**:

- Standardized error responses
- Error logging
- Stack trace in development
- Error code mapping

### Timeout Interceptor

Request timeout handling:

**Interceptor**: `TimeoutInterceptor`

**Configuration**: 30 seconds default

## Best Practices

1. **Connection Pooling**: Configure appropriate pool sizes
2. **Health Checks**: Monitor all infrastructure components
3. **Error Handling**: Handle connection failures gracefully
4. **Retry Logic**: Implement retry for transient failures
5. **Monitoring**: Monitor infrastructure health and performance
6. **Scaling**: Design for horizontal scaling
7. **Caching**: Use Redis for frequently accessed data
8. **Queue Management**: Monitor queue lengths and processing times
9. **Resource Cleanup**: Properly close connections on shutdown
10. **Configuration**: Use environment variables for all settings

## Configuration

See [Configuration](configuration.md) for infrastructure configuration options.
