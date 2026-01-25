# Infrastructure

The gateway uses various infrastructure components to support its operations, including database, caching, queues, and external service integrations.

## Overview

Infrastructure components:

- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with Bull queues
- **Firebase**: Firebase Admin SDK integration
- **HTTP Client**: Axios-based HTTP service
- **Local Storage**: In-memory storage service

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

See [Database](database.md) for schema details.

## Redis

### Redis Service

Redis is used for caching and queue management.

**Service**: `RedisService`

**Features**:

- Key-value storage
- TTL support
- JSON serialization
- Health checks
- Automatic reconnection

**Usage**:

```typescript
// String operations
await redisService.set('key', 'value', 3600); // TTL: 1 hour
const value = await redisService.get('key');

// JSON operations
await redisService.setJson('user:123', { name: 'John' }, 3600);
const user = await redisService.getJson<User>('user:123');

// Existence check
const exists = await redisService.exists('key');

// Delete
await redisService.delete('key');
```

### Redis Configuration

```env
REDIS_URL=redis://localhost:6379
# Or separate config:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_KEY_PREFIX=gateway:
```

### Use Cases

- **Token Caching**: OAuth access tokens
- **Session Storage**: User sessions
- **Rate Limiting**: Request rate tracking
- **Queue Backend**: Bull queue storage

## Queue System

### Bull Queues

Bull provides job queue functionality with Redis backend.

**Module**: `QueueModule`

**Queues**:

- `transaction`: Transaction processing
- `webhook`: Webhook processing

**Usage**:

```typescript
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

In-memory storage service for temporary data.

**Service**: `LocalStorageService`

**Features**:

- Key-value storage
- TTL support
- Automatic cleanup
- Type-safe operations

**Usage**:

```typescript
// Set with TTL
await localStorageService.set('key', 'value', 3600);

// Get
const value = await localStorageService.get('key');

// Delete
await localStorageService.delete('key');

// Exists
const exists = await localStorageService.exists('key');
```

**Use Cases**:

- Temporary data storage
- Development/testing
- Cache fallback

## Health Checks

### Health Indicators

Health check endpoints monitor infrastructure status.

**Module**: `HealthModule`

**Indicators**:

- **Database**: PostgreSQL connection
- **Redis**: Redis connection
- **Firebase**: Firebase connection

**Endpoint**: `GET /api/v1/health`

**Response**:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "firebase": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
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
