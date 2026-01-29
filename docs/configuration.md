# Configuration

The gateway uses environment variables for configuration. All configuration is loaded via NestJS ConfigModule.

## Overview

Configuration is organized into modules:

- **Application**: General application settings
- **Database**: PostgreSQL configuration
- **Redis**: Redis cache/queue configuration
- **Security**: JWT, encryption, rate limiting
- **UnionBank**: UnionBank API integration
- **Firebase**: Firebase Admin SDK

## Application Configuration

### Environment Variables

```env
# Environment
NODE_ENV=development|production|test

# Server
PORT=3000
API_PREFIX=api
API_VERSION=v1
APP_NAME=inspirewallet-gateway

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Configuration Interface

```typescript
interface AppConfigType {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  name: string;
}
```

## Database Configuration

### Database Environment Variables

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@localhost:5432/database?schema=public

# Connection Pool
DATABASE_MAX_CONNECTIONS=10

# SSL
DATABASE_SSL_ENABLED=false
```

### Database Configuration Interface

```typescript
interface DatabaseConfigType {
  url: string;
  maxConnections: number;
  sslEnabled: boolean;
}
```

### Connection String Format

```text
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

**Parameters**:

- `schema`: Database schema (default: public)
- `sslmode`: SSL mode (require, prefer, disable)
- `connection_limit`: Connection pool size

## Redis Configuration

### Redis Environment Variables

```env
# Redis Connection
REDIS_URL=redis://localhost:6379
# Or separate config:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_KEY_PREFIX=inspirewallet:
```

### Redis Configuration Interface

```typescript
interface RedisConfigType {
  host: string;
  port: number;
  password: string;
  db: number;
  keyPrefix: string;
}
```

### Connection URL Format

```text
redis://[password@]host:port[/db]
```

## Security Configuration

### Security Environment Variables

```env
# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key
ENCRYPTION_ALGORITHM=aes-256-gcm

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
API_KEY_HEADER=x-api-key
```

### Security Configuration Interface

```typescript
interface SecurityConfigType {
  jwtSecret: string;
  jwtExpiresIn: string;          // e.g., "1h", "15m", "7d"
  jwtRefreshExpiresIn: string;
  encryptionKey: string;
  encryptionAlgorithm: string;
  rateLimitTtl: number;          // Time window in seconds
  rateLimitMax: number;         // Max requests per window
  apiKeyHeader: string;
}
```

### JWT Expiration Formats

- `s`: Seconds (e.g., "900s")
- `m`: Minutes (e.g., "15m")
- `h`: Hours (e.g., "1h")
- `d`: Days (e.g., "7d")

## UnionBank Configuration

### UnionBank Environment Variables

```env
# Environment routing (defaults to uat; also accepts "sb" as sandbox alias)
# - sandbox/sb: routes under /partners/sb/...
# - uat: token under /ubp/uat/... and most APIs under /ubp/external/...
UNIONBANK_ENV=uat|sandbox|sb

# Base URL
UNIONBANK_BASE_URL=https://api-uat.unionbankph.com

# API Credentials
UNIONBANK_CLIENT_ID=your-client-id
UNIONBANK_CLIENT_SECRET=your-client-secret
UNIONBANK_PARTNER_ID=your-partner-id

# OAuth Credentials
UNIONBANK_OAUTH_CLIENT_ID=your-oauth-client-id
UNIONBANK_USERNAME=your-username
UNIONBANK_PASSWORD=your-password
UNIONBANK_SCOPE=upay_payments

# Endpoints
# If unset, token endpoint defaults based on UNIONBANK_ENV:
# - uat: /ubp/uat/partners/v1/oauth2/token
# - sandbox/sb: /partners/sb/partners/v1/oauth2/token
UNIONBANK_TOKEN_ENDPOINT=/ubp/uat/partners/v1/oauth2/token
#
# UPay APIs are under /ubp/external/... (even when using the UAT base domain)
UNIONBANK_UPAY_ENDPOINT=/ubp/external/upay/payments/v1/transactions

# UPay Redirect
UNIONBANK_UPAY_REDIRECT_DOMAIN=pay.unionbankph.com
UNIONBANK_UPAY_BILLER_UUID=your-biller-uuid
UNIONBANK_UPAY_AES_KEY=your-32-byte-hex-aes-key

# Request Settings
UNIONBANK_TIMEOUT=30000
UNIONBANK_RETRY_ATTEMPTS=3
UNIONBANK_RETRY_DELAY=1000
```

### UnionBank Configuration Interface

```typescript
interface UnionbankConfigType {
  env: 'sandbox' | 'uat';
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  oauthClientId: string;
  partnerId: string;
  username: string;
  password: string;
  scope: string;
  tokenEndpoint: string;
  upayEndpoint: string;
  upayRedirectDomain?: string;
  upayBillerUuid?: string;
  upayAesKey?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}
```

### OAuth token request (UPay)

The token request uses **`application/x-www-form-urlencoded`** form data with:

- `grant_type=password`
- `client_id` = `UNIONBANK_OAUTH_CLIENT_ID`
- `username` / `password`
- `scope`

The OAuth token endpoint **does not require** `x-ibm-client-id` / `x-ibm-client-secret` headers (those are for actual API calls, not the token request).

### UPay AES Key

The AES key must be 32 bytes. Generate using:

```bash
# Hex format (64 characters)
openssl rand -hex 32

# Base64 format
openssl rand -base64 32
```

### Troubleshooting OAuth outside the app

Use `test/test-oauth-curl.sh` to hit the configured token endpoint with curl. It loads values from `.env` and will automatically pick the default token endpoint based on `UNIONBANK_ENV` if `UNIONBANK_TOKEN_ENDPOINT` is not set.

## Firebase Configuration

### Firebase Environment Variables

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### Firebase Configuration Interface

```typescript
interface FirebaseConfigType {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}
```

### Private Key Format

The private key should include newlines. In `.env`:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/inspirewallet_dev
REDIS_URL=redis://localhost:6379
UNIONBANK_BASE_URL=https://api-uat.unionbankph.com
```

### Production

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@db.example.com:5432/inspirewallet?sslmode=require
REDIS_URL=redis://redis.example.com:6379
UNIONBANK_BASE_URL=https://api.unionbankph.com
CORS_ORIGINS=https://partner1.com,https://partner2.com
```

### Testing

```env
NODE_ENV=test
DATABASE_URL=postgresql://localhost:5432/inspirewallet_test
REDIS_URL=redis://localhost:6379/1
```

## Configuration Loading

Configuration is loaded via NestJS ConfigModule:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
  expandVariables: true,
})
```

**Priority**:

1. Environment variables (highest)
2. `.env.local` file
3. `.env` file (lowest)

## Validation

Configuration values are validated at startup:

- **Required**: Critical values must be present
- **Format**: Values must match expected format
- **Type**: Values are coerced to correct types

## Secrets Management

### Development Secrets

Use `.env` file (never commit to version control):

```bash
# .env
JWT_SECRET=dev-secret-key
DATABASE_URL=postgresql://...
```

### Production Secrets

Use secret management services:

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Secret Manager**

**Example (AWS)**:

```typescript
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });
const secret = await client.getSecretValue({ SecretId: 'gateway/secrets' });
const config = JSON.parse(secret.SecretString);
```

## Configuration Best Practices

1. **Never Commit Secrets**: Use `.env` files and `.gitignore`
2. **Use Strong Secrets**: Generate strong random secrets
3. **Rotate Secrets**: Regularly rotate secrets
4. **Environment Variables**: Prefer environment variables over files
5. **Validation**: Validate configuration at startup
6. **Defaults**: Provide sensible defaults for development
7. **Documentation**: Document all configuration options
8. **Type Safety**: Use TypeScript interfaces for type safety
9. **Separate Environments**: Use different configs per environment
10. **Secret Management**: Use proper secret management in production

## Example .env File

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api
API_VERSION=v1
APP_NAME=inspirewallet-gateway

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/inspirewallet?schema=public
DATABASE_MAX_CONNECTIONS=10
DATABASE_SSL_ENABLED=false

# Redis
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=inspirewallet:

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-byte-key
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# UnionBank
UNIONBANK_BASE_URL=https://api-uat.unionbankph.com
UNIONBANK_CLIENT_ID=your-client-id
UNIONBANK_CLIENT_SECRET=your-client-secret
UNIONBANK_OAUTH_CLIENT_ID=your-oauth-client-id
UNIONBANK_PARTNER_ID=your-partner-id
UNIONBANK_USERNAME=your-username
UNIONBANK_PASSWORD=your-password
UNIONBANK_SCOPE=upay_payments
UNIONBANK_UPAY_AES_KEY=your-32-byte-hex-key
UNIONBANK_UPAY_REDIRECT_DOMAIN=pay.unionbankph.com
UNIONBANK_UPAY_BILLER_UUID=your-biller-uuid

# Firebase (optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Troubleshooting

### Configuration Not Loading

- Check `.env` file exists and is readable
- Verify environment variable names match exactly
- Check for typos in variable names
- Ensure `.env` is in project root

### Invalid Configuration Values

- Check value formats (e.g., JWT expiration)
- Verify numeric values are valid numbers
- Ensure required values are present
- Check connection strings are valid

### Secret Management Issues

- Verify secrets are properly loaded
- Check secret format (e.g., private key newlines)
- Ensure secrets have correct permissions
- Test secret access in development first
