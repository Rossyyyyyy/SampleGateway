# Security

The gateway implements multiple security layers to protect sensitive data and ensure secure operations.

## Overview

Security features include:

- **JWT Authentication**: Token-based authentication
- **API Key Authentication**: Alternative authentication method
- **Encryption**: AES-256-GCM encryption for sensitive data
- **Signature Verification**: HMAC signature verification
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: Security event tracking

## Authentication

### JWT Authentication

JWT tokens are used for API authentication:

- **Algorithm**: HS256 (HMAC SHA-256)
- **Secret**: Configurable via `JWT_SECRET`
- **Expiration**: Configurable (default: 1 hour)
- **Refresh Tokens**: Long-lived tokens for token renewal

See [Authentication](authentication.md) for details.

### API Key Authentication

API keys provide alternative authentication:

- **Header**: `x-api-key`
- **Validation**: Validated against partner database
- **Use Cases**: Webhooks, public endpoints

## Encryption

### AES-256-GCM Encryption

Used for encrypting sensitive data, particularly uPay redirect payloads.

**Service**: `EncryptionService`

**Features**:

- AES-256-GCM algorithm
- Random IV generation
- Authentication tag for integrity
- Base64 encoding for transport

**Example**:

```typescript
const encrypted = encryptionService.encrypt(
  sensitiveData,
  encryptionKey
);

const decrypted = encryptionService.decrypt(
  encrypted,
  encryptionKey
);
```

### Key Management

- **Key Storage**: Environment variables or secure key management service
- **Key Rotation**: Regular key rotation recommended
- **Key Format**: 32-byte keys (hex or base64)

## Signature Verification

### HMAC Signature

HMAC signatures verify webhook authenticity.

**Service**: `SignatureService`

**Algorithm**: SHA-256

**Example**:

```typescript
// Generate signature
const signature = signatureService.sign(
  payload,
  secretKey
);

// Verify signature
const isValid = signatureService.verify(
  payload,
  signature,
  secretKey
);
```

### Webhook Signatures

Webhooks can include signatures for verification:

```typescript
const signature = req.headers['x-signature'];
const isValid = signatureService.verify(
  req.body,
  signature,
  webhookSecret
);
```

## Rate Limiting

Rate limiting protects against abuse and ensures fair usage.

### Configuration

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000,    // Time window (1 minute)
    limit: 100,    // Max requests per window
  },
])
```

### Per-Endpoint Limits

Override limits for specific endpoints:

```typescript
@Throttle(10, 60)  // 10 requests per 60 seconds
@Get('sensitive-endpoint')
getSensitiveData() { ... }
```

## Input Validation

All requests are validated using `class-validator`:

### DTO Validation

```typescript
export class CreateTransferDto {
  @IsEnum(TransferType)
  type: TransferType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  senderName: string;

  @IsNumber()
  @Min(1)
  amount: number;
}
```

### Validation Pipe

Global validation pipe configured in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Reject unknown properties
    transform: true,            // Transform to DTO instances
    transformOptions: {
      enableImplicitConversion: true,
    },
  })
);
```

## CORS Configuration

CORS is configured to restrict origins:

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') ?? '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-api-key',
    'x-idempotency-key',
    'x-request-id',
  ],
});
```

**Production**: Specify exact origins, avoid wildcards.

## Helmet Security Headers

Helmet adds security headers to responses:

```typescript
app.use(helmet());
```

Headers include:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

## Audit Logging

Security events are logged for audit purposes.

**Service**: `AuditService`

**Events Logged**:

- Authentication attempts
- Authorization failures
- Sensitive operations
- Data access
- Configuration changes

**Example**:

```typescript
await auditService.log({
  eventType: 'AUTHENTICATION',
  action: 'LOGIN_SUCCESS',
  resourceType: 'PARTNER',
  resourceId: partnerId,
  actorId: partnerId,
  actorType: 'PARTNER',
  metadata: { ipAddress, userAgent }
});
```

## Secure Storage

### Secrets Management

- **Environment Variables**: Use for configuration
- **Secret Management Services**: Use for production (AWS Secrets Manager, HashiCorp Vault)
- **Never Commit**: Never commit secrets to version control

### Database Security

- **Connection Encryption**: Use SSL/TLS for database connections
- **Credential Hashing**: Hash API secrets using bcrypt
- **Least Privilege**: Database user with minimal required permissions

## HTTPS

Always use HTTPS in production:

```typescript
// Production configuration
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/certificate.pem'),
};

const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
```

## Request ID Tracking

All requests include unique request IDs for tracking:

**Middleware**: `RequestIdMiddleware`

**Header**: `x-request-id`

**Usage**:

- Logging correlation
- Error tracking
- Request tracing

## Idempotency

Idempotency keys prevent duplicate operations:

**Header**: `x-idempotency-key`

**Behavior**:

- Same key returns same result
- Prevents duplicate transactions
- Stored in database

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Rotate Secrets**: Regularly rotate JWT secrets and API keys
3. **Validate Input**: Validate and sanitize all inputs
4. **Least Privilege**: Grant minimal required permissions
5. **Monitor Logs**: Monitor security logs for suspicious activity
6. **Update Dependencies**: Keep dependencies updated
7. **Error Handling**: Don't expose sensitive information in errors
8. **Rate Limiting**: Implement rate limiting on all endpoints
9. **Audit Logging**: Log all security-relevant events
10. **Penetration Testing**: Regular security audits

## Environment Security

### Development

- Use test credentials
- Enable detailed logging
- Relax CORS for local development

### Production

- Use production credentials
- Disable detailed logging
- Restrict CORS to known origins
- Enable all security headers
- Use secure key management
- Monitor security events

## Compliance

The gateway follows security best practices for:

- **PCI DSS**: Payment card industry standards
- **Data Privacy**: Protection of personal information
- **Audit Requirements**: Comprehensive logging

## Security Configuration

See [Configuration](configuration.md) for security-related configuration options.
