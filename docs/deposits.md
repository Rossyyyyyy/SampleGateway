# Deposits

The deposits module manages deposit transactions, allowing users to deposit funds into their accounts through various payment methods.

## Overview

Deposits represent incoming funds from users. The module supports multiple deposit types and provides status tracking throughout the deposit lifecycle.

## Create Deposit

Create a new deposit record.

**Endpoint**: `POST /api/v1/deposits`

**Headers**:

- `Authorization: Bearer <access-token>` (required)

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

**Response** (201 Created):

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

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/deposits \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "amount": 100.00,
    "phpAmount": 5600.00,
    "currency": "USD",
    "type": "INSTAPAY"
  }'
```

## Get Deposit by ID

Retrieve a deposit by its internal ID.

**Endpoint**: `GET /api/v1/deposits/:id`

**Headers**:

- `Authorization: Bearer <access-token>` (required)

**Response** (200 OK):

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
  "status": "COMPLETED",
  "type": "INSTAPAY",
  "externalReferenceId": "EXT-REF-123",
  "statusMessage": "Deposit completed successfully",
  "completedAt": "2024-01-25T10:05:00Z",
  "createdAt": "2024-01-25T10:00:00Z",
  "time": "2024-01-25T10:00:00Z"
}
```

**Example**:

```bash
curl -X GET http://localhost:3000/api/v1/deposits/deposit-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <access-token>"
```

## Get Deposit by Reference ID

Retrieve a deposit by its deposit reference ID.

**Endpoint**: `GET /api/v1/deposits/reference/:depositId`

**Headers**:

- `Authorization: Bearer <access-token>` (required)

**Example**:

```bash
curl -X GET http://localhost:3000/api/v1/deposits/reference/DEP-20240125-001 \
  -H "Authorization: Bearer <access-token>"
```

## Query Deposits

Query deposits with filters.

**Endpoint**: `GET /api/v1/deposits`

**Headers**:

- `Authorization: Bearer <access-token>` (required)

**Query Parameters**:

- `userId` (optional): Filter by user ID
- `status` (optional): Filter by status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`)
- `limit` (optional): Limit results (default: 20)

**Response** (200 OK):

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
  },
  {
    "id": "deposit-2",
    "userId": "user-123",
    "depositId": "DEP-20240125-002",
    "amount": 200.00,
    "phpAmount": 11200.00,
    "status": "COMPLETED",
    "type": "PESONET",
    "createdAt": "2024-01-25T09:00:00Z"
  }
]
```

**Examples**:

```bash
# Get deposits by user
curl -X GET "http://localhost:3000/api/v1/deposits?userId=user-123" \
  -H "Authorization: Bearer <access-token>"

# Get pending deposits
curl -X GET "http://localhost:3000/api/v1/deposits?status=PENDING" \
  -H "Authorization: Bearer <access-token>"

# Get deposits with limit
curl -X GET "http://localhost:3000/api/v1/deposits?limit=50" \
  -H "Authorization: Bearer <access-token>"
```

## Update Deposit Status

Update the status of a deposit.

**Endpoint**: `PATCH /api/v1/deposits/:id/status`

**Headers**:

- `Authorization: Bearer <access-token>` (required)

**Request Body**:

```json
{
  "status": "COMPLETED",
  "statusMessage": "Deposit processed successfully"
}
```

**Response** (200 OK):

```json
{
  "id": "deposit-550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "statusMessage": "Deposit processed successfully",
  "completedAt": "2024-01-25T10:05:00Z",
  ...
}
```

**Example**:

```bash
curl -X PATCH http://localhost:3000/api/v1/deposits/deposit-550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "statusMessage": "Deposit processed successfully"
  }'
```

## Deposit Types

- `INSTAPAY`: Real-time deposit via InstaPay
- `PESONET`: Batch deposit via PESONet
- `BANK_TRANSFER`: Direct bank transfer
- `CASH_IN`: Cash deposit at partner location

## Deposit Status

Deposits progress through the following statuses:

- `PENDING`: Deposit created, awaiting processing
- `PROCESSING`: Deposit being processed
- `COMPLETED`: Deposit completed successfully
- `FAILED`: Deposit failed
- `CANCELLED`: Deposit cancelled

## Validation Rules

### Required Fields

- `userId`: User identifier
- `firstName`: User's first name
- `lastName`: User's last name
- `email`: Valid email address
- `amount`: Original amount (minimum 0)
- `phpAmount`: Amount in PHP (minimum 0)
- `currency`: Currency code (e.g., "USD", "PHP")
- `type`: Deposit type enum

### Optional Fields

- `externalReferenceId`: External system reference
- `statusMessage`: Status description
- `metadata`: Additional metadata

## Error Responses

### Invalid Request (400)

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### Deposit Not Found (404)

```json
{
  "statusCode": 404,
  "message": "Deposit not found",
  "error": "Not Found"
}
```

## Deposit Lifecycle

1. **Create**: Deposit created with `PENDING` status
2. **Process**: Status updated to `PROCESSING` when processing begins
3. **Complete**: Status updated to `COMPLETED` with `completedAt` timestamp
4. **Fail**: Status updated to `FAILED` with `failureReason` if processing fails
5. **Cancel**: Status updated to `CANCELLED` if deposit is cancelled

## Integration with uPay

Deposits can be integrated with UnionBank's uPay service for payment processing. When a deposit is created, you can:

1. Generate a uPay redirect URL for the user to complete payment
2. Update deposit status based on webhook notifications
3. Link external reference IDs for reconciliation

See [UnionBank Integration](unionbank-integration.md) for details.

## Best Practices

1. **Generate unique deposit IDs** for tracking and reconciliation
2. **Store both original and PHP amounts** for multi-currency support
3. **Update status promptly** when deposit is processed
4. **Include status messages** for better user experience
5. **Handle all status transitions** including failures
6. **Use external reference IDs** to link with external systems
7. **Query deposits by user** for user-facing dashboards
8. **Monitor pending deposits** for timely processing

## Example Integration

```typescript
// Create deposit
const deposit = await fetch('/api/v1/deposits', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    amount: 100.00,
    phpAmount: 5600.00,
    currency: 'USD',
    type: 'INSTAPAY'
  })
});

const depositData = await deposit.json();

// Update status when payment is confirmed
await fetch(`/api/v1/deposits/${depositData.id}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'COMPLETED',
    statusMessage: 'Payment confirmed via InstaPay'
  })
});
```
