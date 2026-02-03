# Getting Started

This guide will help you set up and run the Inspire Wallet Payment Gateway application.

## Prerequisites

- **Node.js**: v18.x or higher
- **pnpm**: v8.x or higher (or npm/yarn)
- **PostgreSQL**: v12.x or higher
- **Redis**: v6.x or higher
- **Firebase Admin SDK**: Service account credentials (optional, for Firebase features)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd inspirewallet_gateway_upay_alpha
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure the following required environment variables:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api
API_VERSION=v1
UNIONBANK_APP_NAME=inspirewallet-gateway

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/inspirewallet?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# UnionBank API
UNIONBANK_BASE_URL=https://api-uat.unionbankph.com
UNIONBANK_CLIENT_ID=your-client-id
UNIONBANK_CLIENT_SECRET=your-client-secret
UNIONBANK_OAUTH_CLIENT_ID=your-oauth-client-id
UNIONBANK_PARTNER_ID=your-partner-id
UNIONBANK_USERNAME=your-username
UNIONBANK_PASSWORD=your-password
UNIONBANK_SCOPE=upay_payments
UNIONBANK_UPAY_AES_KEY=your-32-byte-hex-aes-key
UNIONBANK_UPAY_REDIRECT_DOMAIN=pay.unionbankph.com
UNIONBANK_UPAY_BILLER_ID=your-biller-id

# Firebase (optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Database Setup

Generate Prisma client:

```bash
pnpm prisma generate
```

Run database migrations:

```bash
pnpm prisma migrate dev
```

Or if you prefer to use Prisma Studio to manage your database:

```bash
pnpm prisma studio
```

### 5. Start Redis

Make sure Redis is running:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or using system service
redis-server
```

### 6. Start the Application

**Development mode** (with hot reload):

```bash
pnpm run start:dev
```

**Production mode**:

```bash
pnpm run build
pnpm run start:prod
```

**Debug mode**:

```bash
pnpm run start:debug
```

## Verification

Once the application is running, verify it's working:

1. **Health Check**: Visit `http://localhost:3000/api/v1/health`
2. **Swagger Documentation**: Visit `http://localhost:3000/docs`
3. **API Base**: `http://localhost:3000/api/v1`

## Initial Setup

### Create a Partner

Partners are required to authenticate and use the API. You'll need to create a partner record in the database:

```sql
INSERT INTO partners (id, name, api_key, api_secret_hash, is_active, permissions, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Test Partner',
  'test-api-key-123',
  '$2b$10$hashed-secret-here', -- Use bcrypt to hash your secret
  true,
  ARRAY['transfers', 'deposits', 'webhooks'],
  NOW(),
  NOW()
);
```

Or use Prisma Studio to create partners through the UI.

### Generate API Secret Hash

You can use Node.js to generate the bcrypt hash:

```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('your-secret-key', 10);
console.log(hash);
```

## Development Workflow

### Running Tests

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov

# E2E tests
pnpm run test:e2e
```

### Code Quality

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format
```

### Database Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name migration-name

# Apply migrations in production
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset
```

## Troubleshooting

### Common Issues

#### Database Connection Error

- Verify PostgreSQL is running
- Check `DATABASE_URL` is correct
- Ensure database exists

#### Redis Connection Error

- Verify Redis is running
- Check `REDIS_URL` is correct
- Test connection: `redis-cli ping`

#### Port Already in Use

- Change `PORT` in `.env`
- Or kill the process using the port: `lsof -ti:3000 | xargs kill`

#### Prisma Client Not Generated

- Run `pnpm prisma generate`
- Restart your IDE/editor

#### Module Not Found Errors

- Delete `node_modules` and `.pnpm-store`
- Run `pnpm install` again

## Next Steps

- Read the [Authentication](authentication.md) guide to understand how to authenticate
- Check the [API Reference](api-reference.md) for available endpoints
- Review [Configuration](configuration.md) for advanced configuration options
- Explore [UnionBank Integration](unionbank-integration.md) for integration details
