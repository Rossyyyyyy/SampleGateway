# Transfers

The transfers module handles fund transfers via InstaPay and PESONet payment networks in the Philippines.

## Overview

The gateway supports two types of fund transfers:

- **InstaPay**: Real-time, low-value transfers (up to PHP 50,000)
- **PESONet**: Batch, high-value transfers (PHP 50,000+)

## Create Transfer

Create a new fund transfer.

**Endpoint**: `POST /api/v1/transfers`

**Headers**:

- `Authorization: Bearer <access-token>` (required)
- `x-idempotency-key: <unique-key>` (optional, recommended)

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

**Response** (201 Created):

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

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: unique-request-id-123" \
  -d '{
    "type": "INSTAPAY",
    "senderName": "John Doe",
    "beneficiaryName": "Jane Smith",
    "beneficiaryAccountNumber": "0987654321",
    "receivingBank": "BDO",
    "amount": 1000.00,
    "currency": "PHP",
    "purpose": "Payment for services"
  }'
```

## Get Transfer Status

Retrieve the status of a transfer by reference ID.

**Endpoint**: `GET /api/v1/transfers/:referenceId/status?type=INSTAPAY`

**Headers**:

- `Authorization: Bearer <access-token>` (required)

**Path Parameters**:

- `referenceId`: Transfer reference ID

**Query Parameters**:

- `type`: Transfer type (`INSTAPAY` or `PESONET`)

**Response** (200 OK):

```json
{
  "referenceId": "TXN-20240125-001",
  "status": "COMPLETED",
  "statusMessage": "Transfer completed successfully",
  "completedAt": "2024-01-25T10:05:00Z"
}
```

**Example**:

```bash
curl -X GET "http://localhost:3000/api/v1/transfers/TXN-20240125-001/status?type=INSTAPAY" \
  -H "Authorization: Bearer <access-token>"
```

## Transfer Types

### InstaPay

- **Speed**: Real-time (within seconds)
- **Limit**: Up to PHP 50,000 per transaction
- **Operating Hours**: 24/7
- **Use Cases**: Small payments, urgent transfers

### PESONet

- **Speed**: Batch processing (next business day)
- **Limit**: PHP 50,000 and above
- **Operating Hours**: Business days only
- **Use Cases**: Large payments, payroll, bulk transfers

## Transfer Status

Transfers progress through the following statuses:

- `PENDING`: Transfer created, awaiting processing
- `PROCESSING`: Transfer being processed by UnionBank
- `COMPLETED`: Transfer completed successfully
- `FAILED`: Transfer failed
- `CANCELLED`: Transfer cancelled

## Transfer Direction

- `INBOUND`: Funds received
- `OUTBOUND`: Funds sent

## Idempotency

The transfers endpoint supports idempotency to prevent duplicate transfers. Include a unique `x-idempotency-key` header:

```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "x-idempotency-key: unique-request-id-123" \
  ...
```

If a transfer with the same idempotency key already exists, the existing transfer will be returned instead of creating a new one.

## Validation Rules

### Required Fields

- `type`: Must be `INSTAPAY` or `PESONET`
- `senderName`: Maximum 100 characters
- `beneficiaryName`: Maximum 100 characters
- `beneficiaryAccountNumber`: Required
- `receivingBank`: Bank code (e.g., "BDO", "BPI", "UBP")
- `amount`: Minimum 1 PHP

### Optional Fields

- `senderAccountNumber`: Sender's account number
- `currency`: Defaults to "PHP"
- `purpose`: Maximum 255 characters

## Error Responses

### Invalid Request (400)

```json
{
  "statusCode": 400,
  "message": ["amount must not be less than 1"],
  "error": "Bad Request"
}
```

### Unauthorized (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Transfer Not Found (404)

```json
{
  "statusCode": 404,
  "message": "Transfer not found",
  "error": "Not Found"
}
```

### Duplicate Idempotency Key (409)

```json
{
  "statusCode": 409,
  "message": "Transfer with this idempotency key already exists",
  "error": "Conflict"
}
```

## Bank Codes

Common receiving bank codes:

- `BDO` - Banco de Oro
- `BPI` - Bank of the Philippine Islands
- `UBP` - Union Bank of the Philippines
- `MBTC` - Metropolitan Bank and Trust Company
- `PNB` - Philippine National Bank
- `RCBC` - Rizal Commercial Banking Corporation
- `SECB` - Security Bank
- `CHIN` - China Banking Corporation

## Processing Flow

1. **Client creates transfer** via API
2. **Gateway validates** request and creates transfer record
3. **Transfer queued** for processing
4. **UnionBank API called** to execute transfer
5. **Status updated** based on UnionBank response
6. **Webhook sent** to partner (if configured) on completion/failure

## Best Practices

1. **Use idempotency keys** for all transfer requests
2. **Poll transfer status** instead of assuming completion
3. **Handle all statuses** including `FAILED` and `CANCELLED`
4. **Store reference IDs** for reconciliation
5. **Implement retry logic** for transient failures
6. **Monitor transfer status** via webhooks when possible
7. **Validate bank codes** before submission
8. **Check transfer limits** before creating transfers

## Integration Example

```typescript
// Create transfer
const transfer = await fetch('/api/v1/transfers', {
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

const { referenceId } = await transfer.json();

// Poll for status
const checkStatus = async () => {
  const response = await fetch(
    `/api/v1/transfers/${referenceId}/status?type=INSTAPAY`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );
  const status = await response.json();
  
  if (status.status === 'COMPLETED') {
    console.log('Transfer completed!');
  } else if (status.status === 'FAILED') {
    console.error('Transfer failed:', status.statusMessage);
  } else {
    // Still processing, check again later
    setTimeout(checkStatus, 5000);
  }
};

checkStatus();
```
