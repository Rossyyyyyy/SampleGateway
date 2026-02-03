# UnionBank Integration

The gateway integrates with UnionBank's payment APIs to provide InstaPay, PESONet, and uPay payment processing capabilities.

**Reference**: U Pay (UnionBank Payments and Collections) behaviour and parameters follow [UB_UPay_documentation.txt](UB_UPay_documentation.txt).

## Overview

The UnionBank integration module provides:

- **InstaPay Transfers**: Real-time fund transfers
- **PESONet Transfers**: Batch fund transfers
- **uPay Payments**: Payment processing via redirect or direct API
  - **Debit/Credit Card**: Visa and Mastercard payments
  - **UB Online**: UnionBank Online Banking payments
  - **InstaPay**: QR code and reference number payments
  - **PCHC PayGate**: PesoNet payments
  - **E-Wallets**: GCash, GrabPay, and other e-wallet providers
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
- `createDebitCreditCardTransaction()`: Create debit/credit card payment transaction
- `getTransactionStatus()`: Get transaction status
- `getBillerReferences()`: Fetch reference definitions for a biller

#### Payment Methods

The uPay service supports multiple payment methods:

- **`debit/credit`**: Visa and Mastercard debit/credit card payments
- **`ub online`**: UnionBank Online Banking payments
- **`instapay`**: InstaPay QR code or reference number payments
- **`instapay p2b`**: InstaPay Person-to-Business payments
- **`paygate`**: PCHC PayGate via PesoNet payments
- **`gcash`**: GCash e-wallet payments
- **`grabpay`**: GrabPay e-wallet payments
- **`bayad_center`**: Bayad Center OTC payments
- **`cebl`**: Cebuana Lhuillier payments
- **`ecpay`**: ECPay payments
- **`plwn`**: Palawan Pawnshop payments
- **`mlh`**: M Lhuillier payments
- **`smr`**: SM Retail payments
- **`rds`**: RD Pawnshop payments

#### Debit/Credit Card Payments

For debit/credit card payments, you can use the dedicated method:

```typescript
const response = await upayService.createDebitCreditCardTransaction({
  senderRefId: 'TXN-001',
  emailAddress: 'user@example.com',
  mobileNumber: '9123456789',
  amount: 1000.00,
  callbackUrl: 'https://partner.com/callback',
  firstName: 'John',
  lastName: 'Doe',
  accountNumber: '1234567890',
  userRef: 'USER-123'
});

// Response includes redirect URL in message field
// Redirect user to response.message for payment processing
if (response.message) {
  window.location.href = response.message;
}
```

#### Generic Transaction Creation

You can also use the generic method with any payment method:

```typescript
const response = await upayService.createTransaction({
  senderRefId: 'TXN-001',
  emailAddress: 'user@example.com',
  mobileNumber: '9123456789',
  amount: 1000.00,
  paymentMethod: 'debit/credit', // or 'ub online', 'instapay', etc.
  skipWhitelabelPage: false,
  callbackUrl: 'https://partner.com/callback',
  firstName: 'John',
  lastName: 'Doe',
  accountNumber: '1234567890'
});
```

#### Response Structure

The transaction response includes:

```typescript
interface UpayTransactionResponse {
  code?: string;              // Response code (e.g., "SP", "200")
  senderRefId: string;       // Your transaction reference
  uuid: string;               // UnionBank transaction UUID
  state?: string;             // Transaction state (e.g., "Sent for Processing")
  transactionId?: string;     // Transaction ID for tracking
  qrCode?: string;            // QR code string (for InstaPay)
  message?: string;           // Redirect URL (for debit/credit, UB Online, PayGate)
}
```

**For Debit/Credit Card Payments:**

- The `message` field contains the redirect URL to UnionBank's payment page
- Redirect the user to this URL to complete the payment
- After payment, the user will be redirected to your `callbackUrl`

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

### Reference Validation Service

Provides dynamic validation for UPay transaction references based on biller-defined rules.

**Service**: `ReferenceValidationService`

**Methods**:

- `validateReferences()`: Validates an array of references against biller definitions
- `validateReferencesFromResponse()`: Helper to validate using a raw biller references API response

**Validations Performed**:

- **Required Fields**: Ensures mandatory references are present
- **Length Constraints**: Validates `minCharLength` and `maxCharLength`
- **Field Types**: Validates `NUMERIC`, `ALPHABETIC`, or `ALPHANUMERIC` constraints
- **Pattern Matching**: Validates specific formats like `Email`, `Simple`, etc.

**Example**:

```typescript
const result = validationService.validateReferences(
  billerReferences, // From UnionbankUpayService
  [{ index: 1, value: 'John' }, { index: 2, value: '123456789' }]
);

if (!result.isValid) {
  throw new ReferenceValidationException(result.errors);
}
```

### Payment Method Validation Service

Validates that a requested payment method is enabled and availed by the biller.

**Service**: `PaymentMethodValidationService`

**Methods**:

- `validatePaymentMethod()`: Validates a payment method against a biller's channels (using raw API response)
- `validateAgainstBillerChannels()`: Validates against a specific biller object

**Validations Performed**:

- **Existence**: Checks if the method is configured for the biller
- **Enabled Status**: Verifies `isEnabled` is true
- **Availed Status**: Verifies `isAvailed` is true

**Example**:

```typescript
const result = paymentMethodValidationService.validatePaymentMethod(
  billerDetails, // From UnionbankUpayService.getBillerDetails
  'instapay'
);

if (!result.isValid) {
  throw new PaymentMethodValidationException(result.error);
}
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
  paymentMethod: UpayPaymentMethod; // See Payment Methods section
  skipWhitelabelPage: 'true' | 'false';
  callbackUrl: string;
  references: Array<{
    index: number | string;
    value: string;
  }>;
}

// Supported payment methods
type UpayPaymentMethod =
  | 'debit/credit'      // Visa/Mastercard
  | 'ub online'         // UnionBank Online
  | 'instapay'          // InstaPay
  | 'instapay p2b'      // InstaPay P2B
  | 'paygate'           // PCHC PayGate
  | 'gcash'             // GCash
  | 'grabpay'           // GrabPay
  | 'bayad_center'      // Bayad Center
  | 'cebl'              // Cebuana Lhuillier
  | 'ecpay'             // ECPay
  | 'plwn'              // Palawan Pawnshop
  | 'mlh'               // M Lhuillier
  | 'smr'               // SM Retail
  | 'rds';              // RD Pawnshop
```

### uPay Redirect Configuration

Required environment variables (aligned with UB UPay doc):

```env
# Application name (UnionBank / UPay context)
UNIONBANK_APP_NAME=inspirewallet-gateway

# UnionBank-provided values (see UB_UPay_documentation.txt)
UNIONBANK_ACCOUNT_NUMBER=your-account-number
UNIONBANK_API_LIST=UPay-Status-Inquiry-by-UnionBank

# UPay Redirect / White Label (per UB UPay doc: BillerUuid string in API)
UNIONBANK_UPAY_AES_KEY=your-32-byte-hex-key
UNIONBANK_UPAY_REDIRECT_DOMAIN=pay.unionbankph.com
# Biller ID: integer provided by UnionBank, retained as string (e.g. "4446" or UUID string)
UNIONBANK_UPAY_BILLER_ID=your-biller-id
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
# Environment routing (defaults to uat; also accepts "sb" as sandbox alias)
UNIONBANK_ENV=uat|sandbox|sb

UNIONBANK_OAUTH_CLIENT_ID=your-oauth-client-id
UNIONBANK_USERNAME=your-username
UNIONBANK_PASSWORD=your-password
UNIONBANK_SCOPE=upay_payments
# If unset, token endpoint defaults based on UNIONBANK_ENV:
# - uat: /ubp/uat/partners/v1/oauth2/token
# - sandbox/sb: /partners/sb/partners/v1/oauth2/token
UNIONBANK_TOKEN_ENDPOINT=/ubp/uat/partners/v1/oauth2/token
```

Note: the OAuth token request is `application/x-www-form-urlencoded` and does **not** use `x-ibm-client-id` / `x-ibm-client-secret` headers (those are for actual API calls).

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
  - Supports all payment methods: `debit/credit`, `ub online`, `instapay`, `paygate`, etc.
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

- Client ID and Secret (`x-ibm-client-id`, `x-ibm-client-secret` per UB UPay doc)
- OAuth credentials (username, password)
- Test account numbers
- Test biller ID (integer from UnionBank, set as string in `UNIONBANK_UPAY_BILLER_ID`)

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
// InstaPay redirect
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

### Create Debit/Credit Card Payment

```typescript
// Using Direct API (recommended for debit/credit card)
const response = await upayService.createDebitCreditCardTransaction({
  senderRefId: generateReferenceId(),
  emailAddress: 'user@example.com',
  mobileNumber: '9123456789',
  amount: 1000.00,
  callbackUrl: 'https://partner.com/callback',
  firstName: 'John',
  lastName: 'Doe',
  accountNumber: '1234567890',
  userRef: 'USER-123'
});

// Redirect user to payment page
if (response.message) {
  window.location.href = response.message;
}

// Or using redirect service
const redirectUrl = upayRedirectService.createRedirectUrl({
  senderRefId: generateReferenceId(),
  emailAddress: 'user@example.com',
  mobileNumber: '9123456789',
  amount: 1000.00,
  paymentMethod: 'debit/credit',
  callbackUrl: 'https://partner.com/callback',
  firstName: 'John',
  lastName: 'Doe',
  accountNumber: '1234567890'
});

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
