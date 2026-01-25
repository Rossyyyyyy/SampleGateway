# Authentication

The gateway uses JWT (JSON Web Tokens) for authentication. Partners authenticate using API keys and receive access tokens for subsequent API requests.

## Authentication Flow

1. Partner sends API key and secret to `/auth/login`
2. Gateway validates credentials and returns JWT access token and refresh token
3. Partner includes access token in `Authorization` header for protected endpoints
4. When access token expires, partner uses refresh token to obtain a new access token

## Login

Authenticate and obtain access tokens.

**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:

```json
{
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret"
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "test-api-key-123",
    "apiSecret": "test-secret-456"
  }'
```

## Using Access Tokens

Include the access token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Refresh Token

Obtain a new access token using a refresh token.

**Endpoint**: `POST /api/v1/auth/refresh`

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## API Key Authentication (Alternative)

Some endpoints support API key authentication via the `x-api-key` header. This is useful for webhook endpoints or public APIs.

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/unionbank \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## Public Endpoints

Endpoints marked with `@Public()` decorator don't require authentication:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/webhooks/unionbank` (may require API key)

## Token Expiration

- **Access Token**: Default 1 hour (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: Default 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)

## Error Responses

### Invalid Credentials (401)

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Expired Token (401)

```json
{
  "statusCode": 401,
  "message": "Token expired",
  "error": "Unauthorized"
}
```

### Missing Token (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Partner Management

Partners are stored in the database with the following structure:

- `id`: Unique partner identifier
- `name`: Partner name
- `apiKey`: API key for authentication
- `apiSecretHash`: Bcrypt hash of API secret
- `isActive`: Whether partner account is active
- `permissions`: Array of permission strings
- `webhookUrl`: Optional webhook URL for notifications

### Creating a Partner

Partners must be created in the database. Example SQL:

```sql
INSERT INTO partners (id, name, api_key, api_secret_hash, is_active, permissions, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'My Company',
  'my-api-key-123',
  '$2b$10$hashedSecretHere', -- Use bcrypt to hash secret
  true,
  ARRAY['transfers:read', 'transfers:write', 'deposits:read', 'deposits:write'],
  NOW(),
  NOW()
);
```

### Generating Secret Hash

Use bcrypt to hash the API secret:

```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('your-secret-key', 10);
console.log(hash);
```

## Permissions

Permissions are stored as an array of strings. Common permissions:

- `transfers:read` - Read transfer information
- `transfers:write` - Create transfers
- `deposits:read` - Read deposit information
- `deposits:write` - Create deposits
- `webhooks:read` - Read webhook events
- `accounts:read` - Read account information

## Security Best Practices

1. **Never expose API secrets** in client-side code
2. **Use HTTPS** in production
3. **Rotate secrets** periodically
4. **Store tokens securely** (use httpOnly cookies or secure storage)
5. **Implement token refresh** before expiration
6. **Monitor token usage** for suspicious activity
7. **Use environment variables** for sensitive configuration

## Current User

The authenticated partner information is available via the `@CurrentUser()` decorator:

```typescript
@Get('profile')
getProfile(@CurrentUser() user: JwtPayload) {
  return {
    partnerId: user.partnerId,
    permissions: user.permissions
  };
}
```

The `JwtPayload` includes:

- `sub`: Partner ID
- `partnerId`: Partner identifier
- `permissions`: Array of permission strings
