# UnionBank Integration

The gateway integrates with UnionBank's payment APIs to provide InstaPay, PESONet, and uPay payment processing capabilities.

## Overview

The UnionBank integration module provides:

- **InstaPay Transfers**: Real-time fund transfers
- **PESONet Transfers**: Batch fund transfers
- **uPay Payments**: Payment processing via redirect or direct API
- **Account Inquiry**: Account validation and information retrieval
- **OAuth Authentication**: Token management for UnionBank API

## Services

### InstaPay Service

Handles real-time fund transfers via InstaPay network.

**Service**: `UnionbankInstapayService`

**Methods**:

- `createTransfer()`: Create InstaPay transfer
- `getTransferStatus()`: Get transfer status

**Example**:

```typescript
const transfer = await instapayService.createTransfer({
  senderRefId: 'TXN-001',
  senderName: 'John Doe',
  senderAccountNumber: '1234567890',
  beneficiaryName: 'Jane Smith',
  beneficiaryAccountNumber: '0987654321',
  receivingBank: 'BDO',
  amount: 1000.00,
  currency: 'PHP',
  purpose: 'Payment'
});
```

### PESONet Service

Handles batch fund transfers via PESONet network.

**Service**: `UnionbankPesonetService`

**Methods**:

- `createTransfer()`: Create PESONet transfer
- `getTransferStatus()`: Get transfer status

### uPay Service

Handles payment processing via UnionBank's uPay service.

**Service**: `UnionbankUpayService`

**Methods**:

- `createTransaction()`: Create uPay transaction (Direct API)
- `getTransactionStatus()`: Get transaction status

### uPay Redirect Service

Handles encrypted redirect URLs for uPay payments.

**Service**: `UnionbankUpayRedirectService`

**Methods**:

- `createRedirectUrl()`: Create encrypted redirect URL
- `encryptPayload()`: Encrypt payload for testing

**Example**:

```typescript
const redirectUrl = await upayRedirectService.createRedirectUrl({
  senderRefId: 'TXN-001',
  emailAddress: 'user@example.com',
  mobileNumber: '+639123456789',
  amount: 1000.00,
  paymentMethod: 'instapay',
  callbackUrl: 'https://partner.com/callback',
  firstName: 'John',
  lastName: 'Doe',
  accountNumber: '1234567890',
  userRef: 'USER-123'
});

// Redirect user to redirectUrl
```

### Account Inquiry Service

Validates and retrieves account information.

**Service**: `UnionbankAccountService`

**Methods**:

- `inquiry()`: Query account information

## uPay Redirect Encryption

The uPay redirect service uses AES-256-GCM encryption to secure payment data.

### Encryption Process

1. **Prepare JSON payload** with payment details
2. **Generate random IV** (16 bytes)
3. **Encrypt payload** using AES-256-GCM with key + IV
4. **Concatenate** IV + Ciphertext + AuthTag
5. **Base64 encode** the result
6. **URL encode** the Base64 string
7. **Construct URL**: `https://[Domain]/UPAY/WhiteLabel/[BillerUuid]?s=[Encrypted_String]`

### Payload Structure

```typescript
interface UpayRedirectPayload {
  senderRefId: string;
  tranRequestDate: string;        // ISO 8601 format
  emailAddress: string;
  mobileNumber?: string;
  amount: number;
  paymentMethod: 'paygate' | 'instapay' | 'pesonet';
  skipWhitelabelPage: 'true' | 'false';
  callbackUrl: string;
  references: Array<{
    index: number | string;
    value: string;
  }>;
}
```

### uPay Redirect Configuration

Required environment variables:

```env
UNIONBANK_UPAY_AES_KEY=your-32-byte-hex-key
UNIONBANK_UPAY_REDIRECT_DOMAIN=pay.unionbankph.com
UNIONBANK_UPAY_BILLER_UUID=your-biller-uuid
```

### AES Key Format

The AES key must be 32 bytes. Supported formats:

- **Hex string**: 64 hexadecimal characters
- **Base64 string**: Base64-encoded 32-byte key
- **Direct buffer**: 32-byte buffer (for programmatic use)

**Example**:

```bash
# Generate a 32-byte hex key
openssl rand -hex 32

# Or generate base64 key
openssl rand -base64 32
```

## OAuth Authentication

The gateway uses OAuth 2.0 to authenticate with UnionBank APIs.

### Token Management

**Service**: `UnionbankOauthClient`

**Methods**:

- `getAccessToken()`: Obtain access token
- `refreshToken()`: Refresh access token

### OAuth Configuration

```env
UNIONBANK_OAUTH_CLIENT_ID=your-oauth-client-id
UNIONBANK_USERNAME=your-username
UNIONBANK_PASSWORD=your-password
UNIONBANK_SCOPE=upay_payments
UNIONBANK_TOKEN_ENDPOINT=/ubp/uat/partners/v1/oauth2/token
```

### Token Caching

Access tokens are cached in Redis to avoid unnecessary token requests.

## API Client

The `UnionbankApiClient` handles all HTTP requests to UnionBank APIs.

### Features

- **Automatic OAuth**: Handles token acquisition and refresh
- **Request ID**: Includes unique request IDs for tracking
- **Retry Logic**: Automatic retry on transient failures
- **Error Handling**: Standardized error responses
- **Logging**: Comprehensive request/response logging

### Headers

All requests include:

- `x-ibm-client-id`: Client ID
- `x-ibm-client-secret`: Client secret
- `x-partner-id`: Partner ID
- `Authorization`: OAuth access token
- `x-request-id`: Unique request identifier

## Endpoints

### InstaPay

- `POST /ubp/external/instapay/v1/transfers`: Create transfer
- `GET /ubp/external/instapay/v1/transfers/{referenceId}/status`: Get status

### PESONet

- `POST /ubp/external/pesonet/v1/transfers`: Create transfer
- `GET /ubp/external/pesonet/v1/transfers/{referenceId}/status`: Get status

### uPay

- `POST /ubp/external/upay/payments/v1/transactions`: Create transaction
- `GET /ubp/external/upay/payments/v1/transactions/{referenceId}`: Get status

### Account Inquiry

- `POST /ubp/external/accounts/v1/inquiry`: Account inquiry

## Error Handling

### UnionBank API Errors

The gateway maps UnionBank API errors to standardized exceptions:

```typescript
class UnionbankApiException extends BaseException {
  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    details?: any
  ) {
    super(message, statusCode, errorCode, details);
  }
}
```

### Common Error Codes

- `INVALID_CREDENTIALS`: Authentication failed
- `INSUFFICIENT_FUNDS`: Account has insufficient funds
- `INVALID_ACCOUNT`: Account number is invalid
- `TRANSFER_LIMIT_EXCEEDED`: Transfer amount exceeds limit
- `NETWORK_ERROR`: Network or timeout error

## Retry Logic

The API client implements automatic retry for transient failures:

- **Max Attempts**: 3 (configurable)
- **Retry Delay**: Exponential backoff (1s, 2s, 4s)
- **Retryable Errors**: Network errors, 5xx status codes, timeouts

## Request/Response Logging

All UnionBank API requests and responses are logged:

- Request URL, method, headers, body
- Response status, headers, body
- Request duration
- Error details (if any)

## Testing

### Test Environment

Use UnionBank's UAT environment:

```env
UNIONBANK_BASE_URL=https://api-uat.unionbankph.com
```

### Test Credentials

Obtain test credentials from UnionBank for:

- Client ID and Secret
- OAuth credentials
- Test account numbers
- Test biller UUID

### Mock Responses

The gateway includes test utilities for mocking UnionBank responses:

```typescript
// Mock InstaPay response
const mockResponse = {
  ubpTranId: 'TXN-001',
  status: 'PENDING',
  referenceId: 'REF-001'
};
```

## Best Practices

1. **Token Management**: Cache tokens and refresh before expiration
2. **Error Handling**: Handle all error scenarios gracefully
3. **Idempotency**: Use unique reference IDs for all transactions
4. **Logging**: Log all API interactions for debugging
5. **Retry Logic**: Implement retry for transient failures
6. **Rate Limiting**: Respect UnionBank's rate limits
7. **Security**: Never log sensitive data (secrets, tokens)
8. **Validation**: Validate all inputs before API calls
9. **Monitoring**: Monitor API success rates and response times
10. **Testing**: Test thoroughly in UAT before production

## Configuration Reference

See [Configuration](configuration.md) for complete configuration options.

## Integration Examples

### Create InstaPay Transfer

```typescript
const transfer = await instapayService.createTransfer({
  senderRefId: generateReferenceId(),
  senderName: 'John Doe',
  beneficiaryName: 'Jane Smith',
  beneficiaryAccountNumber: '0987654321',
  receivingBank: 'BDO',
  amount: 1000.00,
  currency: 'PHP',
  purpose: 'Payment for services'
}, requestId);

// Poll for status
const status = await instapayService.getTransferStatus(
  transfer.referenceId,
  requestId
);
```

### Create uPay Redirect

```typescript
const redirectUrl = upayRedirectService.createRedirectUrl({
  senderRefId: generateReferenceId(),
  emailAddress: 'user@example.com',
  amount: 1000.00,
  paymentMethod: 'instapay',
  callbackUrl: 'https://partner.com/callback',
  firstName: 'John',
  lastName: 'Doe',
  accountNumber: '1234567890'
});

// Redirect user
window.location.href = redirectUrl;
```

### Account Inquiry Example

```typescript
const accountInfo = await accountService.inquiry({
  accountNumber: '1234567890',
  bankCode: 'BDO'
}, requestId);

if (accountInfo.isValid) {
  console.log('Account Name:', accountInfo.accountName);
}
```
