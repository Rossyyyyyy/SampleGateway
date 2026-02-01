# API Reference

Complete reference for all API endpoints in the gateway.

## Base URL

```text
http://localhost:3000/api/v1
```

Production base URL will be provided separately.

## Authentication

Most endpoints require JWT authentication. Include the token in the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

See [Authentication](authentication.md) for details.

## Common Headers

- `Authorization: Bearer <token>` - JWT access token
- `Content-Type: application/json` - Request content type
- `x-api-key: <key>` - API key (alternative auth)
- `x-idempotency-key: <key>` - Idempotency key
- `x-request-id: <id>` - Request tracking ID

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success",
  "statusCode": 200
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## Authentication Endpoints

### Login

Authenticate and obtain access tokens.

**Endpoint**: `POST /auth/login`

**Public**: Yes

**Request Body**:

```json
{
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret"
}
```

**Response** (200):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Refresh Token

Obtain a new access token.

**Endpoint**: `POST /auth/refresh`

**Public**: Yes

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

## Transfer Endpoints

### Create Transfer

Create a new fund transfer (InstaPay or PESONet).

**Endpoint**: `POST /transfers`

**Headers**: `Authorization` required, `x-idempotency-key` recommended

**Request Body**:

```json
{
  "type": "INSTAPAY",
  "senderName": "John Doe",
  "senderAccountNumber": "1234567890",
  "beneficiaryName": "Jane Smith",
  "beneficiaryAccountNumber": "0987654321",
  "receivingBank": "BDO",
  "amount": 1000.00,
  "currency": "PHP",
  "purpose": "Payment for services"
}
```

**Response** (201):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "referenceId": "TXN-20240125-001",
  "externalReferenceId": "EXT-REF-123",
  "type": "INSTAPAY",
  "status": "PENDING",
  "senderName": "John Doe",
  "beneficiaryName": "Jane Smith",
  "beneficiaryAccountNumber": "0987654321",
  "receivingBank": "BDO",
  "amount": 1000.00,
  "currency": "PHP",
  "statusMessage": "Transfer initiated",
  "createdAt": "2024-01-25T10:00:00Z"
}
```

### Get Transfer Status

Get transfer status by reference ID.

**Endpoint**: `GET /transfers/:referenceId/status`

**Query Parameters**:

- `type`: Transfer type (`INSTAPAY` or `PESONET`)

**Response** (200):

```json
{
  "referenceId": "TXN-20240125-001",
  "status": "COMPLETED",
  "statusMessage": "Transfer completed successfully",
  "completedAt": "2024-01-25T10:05:00Z"
}
```

## Deposit Endpoints

### Create Deposit

Create a new deposit.

**Endpoint**: `POST /deposits`

**Request Body**:

```json
{
  "userId": "user-123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "amount": 100.00,
  "phpAmount": 5600.00,
  "currency": "USD",
  "type": "INSTAPAY"
}
```

**Response** (201):

```json
{
  "id": "deposit-550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "depositId": "DEP-20240125-001",
  "amount": 100.00,
  "phpAmount": 5600.00,
  "currency": "USD",
  "status": "PENDING",
  "type": "INSTAPAY",
  "createdAt": "2024-01-25T10:00:00Z",
  "time": "2024-01-25T10:00:00Z"
}
```

### Get Deposit by ID

Get deposit by internal ID.

**Endpoint**: `GET /deposits/:id`

**Response** (200): See Create Deposit response

### Get Deposit by Reference

Get deposit by deposit reference ID.

**Endpoint**: `GET /deposits/reference/:depositId`

**Response** (200): See Create Deposit response

### Query Deposits

Query deposits with filters.

**Endpoint**: `GET /deposits`

**Query Parameters**:

- `userId` (optional): Filter by user ID
- `status` (optional): Filter by status
- `limit` (optional): Limit results (default: 20)

**Response** (200):

```json
[
  {
    "id": "deposit-1",
    "userId": "user-123",
    "depositId": "DEP-20240125-001",
    "amount": 100.00,
    "phpAmount": 5600.00,
    "status": "PENDING",
    "type": "INSTAPAY",
    "createdAt": "2024-01-25T10:00:00Z"
  }
]
```

### Update Deposit Status

Update deposit status.

**Endpoint**: `PATCH /deposits/:id/status`

**Request Body**:

```json
{
  "status": "COMPLETED",
  "statusMessage": "Deposit processed successfully"
}
```

**Response** (200): See Create Deposit response

## Webhook Endpoints

### Receive UnionBank Webhook

Receive webhook notifications from UnionBank.

**Endpoint**: `POST /webhooks/unionbank`

**Public**: Yes (may require API key)

**Request Body**:

```json
{
  "eventId": "evt_1234567890",
  "eventType": "transfer.completed",
  "timestamp": "2024-01-25T10:00:00Z",
  "data": {
    "referenceId": "TXN-20240125-001",
    "status": "COMPLETED",
    "amount": 1000.00
  }
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Webhook received",
  "eventId": "evt_1234567890"
}
```

## Health Check Endpoints

### Health Check

Check application and infrastructure health.

**Endpoint**: `GET /health`

**Public**: Yes

**Response** (200):

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

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate idempotency key)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## Error Codes

Common error codes:

- `INVALID_CREDENTIALS`: Authentication failed
- `INVALID_REQUEST`: Request validation failed
- `RESOURCE_NOT_FOUND`: Resource not found
- `DUPLICATE_IDEMPOTENCY_KEY`: Idempotency key already used
- `INSUFFICIENT_FUNDS`: Insufficient funds
- `INVALID_ACCOUNT`: Invalid account number
- `TRANSFER_LIMIT_EXCEEDED`: Transfer amount exceeds limit
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `ERR_REFERENCE_VALIDATION`: UPay transaction reference validation failed

## Rate Limiting

Default rate limits:

- **Window**: 60 seconds
- **Limit**: 100 requests per window
- **Header**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Pagination

Pagination is supported for list endpoints:

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `offset`: Skip items (alternative to page)

**Response**:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Filtering and Sorting

Some endpoints support filtering and sorting:

**Query Parameters**:

- `filter[field]=value`: Filter by field
- `sort=field`: Sort by field
- `order=asc|desc`: Sort order

**Example**:

```http
GET /deposits?filter[status]=PENDING&sort=createdAt&order=desc
```

## Swagger Documentation

Interactive API documentation available at:

```text
http://localhost:3000/docs
```

Swagger UI provides:

- Complete endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication testing

## SDK Examples

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/v1/transfers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'x-idempotency-key': generateIdempotencyKey()
  },
  body: JSON.stringify({
    type: 'INSTAPAY',
    senderName: 'John Doe',
    beneficiaryName: 'Jane Smith',
    beneficiaryAccountNumber: '0987654321',
    receivingBank: 'BDO',
    amount: 1000.00,
    currency: 'PHP'
  })
});

const transfer = await response.json();
```

### cURL

```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: unique-key-123" \
  -d '{
    "type": "INSTAPAY",
    "senderName": "John Doe",
    "beneficiaryName": "Jane Smith",
    "beneficiaryAccountNumber": "0987654321",
    "receivingBank": "BDO",
    "amount": 1000.00,
    "currency": "PHP"
  }'
```

## Versioning

API versioning is handled via URL path:

- Current version: `/api/v1`
- Future versions: `/api/v2`, `/api/v3`, etc.

Version is configured via `API_VERSION` environment variable.

## Changelog

## UPay Endpoints

See [UPay](upay.md) for full details and examples.

API changes and deprecations will be documented in the changelog.
