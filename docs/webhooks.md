# Webhooks

The webhooks module handles incoming webhook notifications from UnionBank and other external systems, processing them asynchronously via queue workers.

## Overview

Webhooks allow external systems to notify the gateway about events (e.g., payment completion, transfer status updates). The gateway processes webhooks asynchronously to ensure reliability and prevent timeouts.

## Receive UnionBank Webhook

Receive webhook notifications from UnionBank.

**Endpoint**: `POST /api/v1/webhooks/unionbank`

**Headers**:

- `Content-Type: application/json` (required)
- `x-api-key: <api-key>` (optional, for additional security)

## Receive UnionBank UPay Autopost (Biller Autopost)

UnionBank calls this endpoint whenever there is a successful UPay transaction, so the biller can automatically post/credit the payment (per UPay documentation, Biller Autopost).

**Endpoint**: `POST /api/v1/webhooks/unionbank/autopost`

**Headers**:

- `Content-Type: application/json` (required)
- `x-unionbank-autopost-signature: <hmac-sha256-hex>` (required; HMAC-SHA256 of raw request body using the shared secret agreed with UnionBank)

**Request Body** (structure agreed with UnionBank; typical fields):

```json
{
  "transactionId": "8834702211220159287",
  "senderRefId": "TXN-20240125-001",
  "uuid": "df920b19-c0fa-4ff8-a9d2-195c202e4771",
  "amount": 100,
  "status": "COMPLETED",
  "transactionDateTime": "2024-01-25T10:00:00Z",
  "paymentMethod": "instapay",
  "billerPostStatus": "SUCCESS",
  "references": []
}
```

**Response** (200 OK):

```json
{
  "received": true,
  "idempotencyKey": "8834702211220159287:TXN-20240125-001",
  "message": "Already processed"
}
```

**Behavior**:

- **Verification**: Request is accepted only if `x-unionbank-autopost-signature` matches HMAC-SHA256 of the raw body with `UNIONBANK_UPAY_AUTOPOST_WEBHOOK_SECRET`.
- **Idempotency**: Notifications with the same `transactionId` and `senderRefId` are deduplicated (Redis key, 7-day TTL); duplicates return 200 with `message: "Already processed"`.
- **Audit**: Each received autopost is logged via `AuditService` (`eventType: WEBHOOK`, `resourceType: upay_autopost`).

**Example**:

```bash
# Sign the body with your shared secret (HMAC-SHA256, hex), then:
curl -X POST http://localhost:3000/api/v1/webhooks/unionbank/autopost \
  -H "Content-Type: application/json" \
  -H "x-unionbank-autopost-signature: <signature>" \
  -d '{"transactionId":"...","senderRefId":"...","uuid":"...","amount":100,"status":"COMPLETED","transactionDateTime":"2024-01-25T10:00:00Z"}'
```

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

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Webhook received",
  "eventId": "evt_1234567890"
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/unionbank \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "eventId": "evt_1234567890",
    "eventType": "transfer.completed",
    "timestamp": "2024-01-25T10:00:00Z",
    "data": {
      "referenceId": "TXN-20240125-001",
      "status": "COMPLETED",
      "amount": 1000.00
    }
  }'
```

## Webhook Processing

Webhooks are processed asynchronously using Bull queues:

1. **Receive**: Webhook endpoint receives notification
2. **Validate**: Payload is validated
3. **Queue**: Webhook is added to processing queue
4. **Process**: Queue worker processes webhook
5. **Update**: Related entities (transfers, deposits) are updated
6. **Notify**: Partner webhook URL is called (if configured)

## Webhook Event Types

Common webhook event types:

- `transfer.completed`: Transfer completed successfully
- `transfer.failed`: Transfer failed
- `transfer.processing`: Transfer being processed
- `payment.completed`: Payment completed
- `payment.failed`: Payment failed
- `deposit.completed`: Deposit completed
- `deposit.failed`: Deposit failed

## Webhook Payload Structure

```typescript
interface WebhookPayload {
  eventId: string;           // Unique event identifier
  eventType: string;          // Event type
  timestamp: string;          // ISO 8601 timestamp
  data: Record<string, any>;  // Event-specific data
  signature?: string;         // Optional signature for verification
}
```

## Webhook Handlers

The gateway uses handler classes to process different webhook types:

### Base Webhook Handler

All handlers extend `BaseWebhookHandler`:

```typescript
abstract class BaseWebhookHandler {
  abstract handle(payload: WebhookPayload): Promise<void>;
  abstract validate(payload: WebhookPayload): boolean;
}
```

### Transfer Webhook Handler

Handles transfer-related webhooks:

- Updates transfer status
- Records completion timestamp
- Updates transaction records
- Triggers partner notifications

## Webhook Security

### Signature Verification

Webhooks can include signatures for verification:

```typescript
// Verify webhook signature
const isValid = verifyWebhookSignature(
  payload,
  signature,
  webhookSecret
);
```

### API Key Authentication

Use API key header for additional security:

```bash
curl -X POST ... \
  -H "x-api-key: your-api-key"
```

### UnionBank UPay Autopost

The `/webhooks/unionbank/autopost` endpoint requires `x-unionbank-autopost-signature` (HMAC-SHA256 of raw body). This header is included in CORS `allowedHeaders` in the application.

### IP Whitelisting

Configure IP whitelisting for webhook endpoints in production.

## Webhook Event Tracking

Webhook events are tracked in the database:

- `eventId`: Unique event identifier
- `eventType`: Type of event
- `payload`: Full webhook payload (JSON)
- `status`: Processing status (`RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`)
- `attempts`: Number of processing attempts
- `lastError`: Last error message (if failed)
- `processedAt`: Processing completion timestamp

## Webhook Retry Logic

Failed webhooks are automatically retried:

- **Initial attempt**: Immediate
- **Retry attempts**: 3 retries with exponential backoff
- **Retry delays**: 1s, 2s, 4s
- **Max attempts**: 4 total attempts

## Partner Webhook Notifications

When a webhook is processed, the gateway can notify partners via their configured webhook URL:

**Partner Configuration**:

```sql
UPDATE partners 
SET webhook_url = 'https://partner.com/webhooks'
WHERE id = 'partner-id';
```

**Notification Payload**:

```json
{
  "eventId": "evt_1234567890",
  "eventType": "transfer.completed",
  "timestamp": "2024-01-25T10:00:00Z",
  "data": {
    "referenceId": "TXN-20240125-001",
    "status": "COMPLETED"
  }
}
```

## Webhook Status

Webhook processing statuses:

- `RECEIVED`: Webhook received, queued for processing
- `PROCESSING`: Webhook being processed
- `PROCESSED`: Webhook processed successfully
- `FAILED`: Webhook processing failed

## Error Handling

### Invalid Payload (400)

```json
{
  "statusCode": 400,
  "message": "Invalid webhook payload",
  "error": "Bad Request"
}
```

### Processing Error (500)

```json
{
  "statusCode": 500,
  "message": "Webhook processing failed",
  "error": "Internal Server Error"
}
```

## Testing Webhooks

### Local Testing

Use tools like ngrok to expose local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use ngrok URL for webhook configuration
# https://abc123.ngrok.io/api/v1/webhooks/unionbank
```

### Webhook Testing Tools

- **Postman**: Create webhook test requests
- **curl**: Command-line testing
- **Webhook.site**: Public webhook testing endpoint

## Best Practices

1. **Idempotency**: Handle duplicate webhooks gracefully
2. **Validation**: Always validate webhook payloads
3. **Signature Verification**: Verify webhook signatures when available
4. **Async Processing**: Process webhooks asynchronously
5. **Retry Logic**: Implement retry for failed webhooks
6. **Logging**: Log all webhook events for debugging
7. **Monitoring**: Monitor webhook processing success rates
8. **Error Handling**: Handle all error scenarios
9. **Rate Limiting**: Implement rate limiting for webhook endpoints
10. **Security**: Use HTTPS and verify webhook sources

## Webhook Queue Configuration

Webhook processing uses Bull queues with Redis:

```typescript
// Queue configuration
{
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
}
```

## Monitoring Webhooks

Monitor webhook processing:

```sql
-- Check webhook processing status
SELECT 
  event_type,
  status,
  COUNT(*) as count
FROM webhook_events
GROUP BY event_type, status;

-- Find failed webhooks
SELECT * FROM webhook_events
WHERE status = 'FAILED'
ORDER BY created_at DESC
LIMIT 10;
```

## Example Integration

```typescript
// Partner webhook handler
app.post('/webhooks/gateway', async (req, res) => {
  const { eventId, eventType, data } = req.body;
  
  // Verify signature
  const signature = req.headers['x-signature'];
  if (!verifySignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Handle event
  switch (eventType) {
    case 'transfer.completed':
      await handleTransferCompleted(data);
      break;
    case 'deposit.completed':
      await handleDepositCompleted(data);
      break;
  }
  
  res.json({ success: true });
});
```
