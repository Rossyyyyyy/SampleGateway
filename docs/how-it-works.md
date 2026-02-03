# How InspireWallet Payment Gateway Works

A simple guide explaining how the payment gateway processes payments through UnionBank.

## What Is This?

The **InspireWallet Payment Gateway** is a secure bridge between your application and UnionBank's payment services. It handles all the complexity of bank integration so you can easily accept payments and transfer funds.

```
┌─────────────────┐      ┌─────────────────────┐      ┌─────────────────┐
│  Your App/Web   │ ──▶  │  InspireWallet      │ ──▶  │   UnionBank     │
│                 │      │  Payment Gateway    │      │   (uPay)        │
│  Partners       │ ◀──  │                     │ ◀──  │                 │
└─────────────────┘      └─────────────────────┘      └─────────────────┘
```

## Key Features

| Feature                      | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| **uPay Payments**      | Accept payments via cards, InstaPay, GCash, GrabPay, and more |
| **InstaPay Transfers** | Real-time fund transfers (within seconds)                     |
| **PESONet Transfers**  | Same-day batch transfers                                      |
| **Webhooks**           | Get notified when payments complete                           |
| **Security**           | Encrypted data, signed requests, JWT authentication           |

---

## How Payments Flow

### Step 1: Create a Payment Request

Your app calls the gateway to create a payment:

```
POST /api/v1/upay/transactions
```

```json
{
  "emailAddress": "customer@email.com",
  "mobileNumber": "9171234567",
  "amount": 500.00,
  "paymentMethod": "instapay",
  "callbackUrl": "https://yourapp.com/payment-complete",
  "firstName": "Juan",
  "lastName": "Dela Cruz"
}
```

### Step 2: Gateway Validates & Forwards

The gateway:

1. ✅ Validates your request
2. ✅ Checks biller/payment method availability
3. ✅ Encrypts sensitive data
4. ✅ Sends to UnionBank

### Step 3: Customer Pays

UnionBank returns either:

- **A QR Code** (for InstaPay) → Customer scans to pay
- **A Redirect URL** (for cards, e-wallets) → Customer is redirected to complete payment

### Step 4: Payment Confirmation

When payment completes, UnionBank sends a **webhook** to the gateway, which then:

1. Verifies the notification
2. Updates the transaction status
3. Notifies your app (if configured)

---

## Payment Methods Available

| Method           | Use Case                        |
| ---------------- | ------------------------------- |
| `debit/credit` | Visa/Mastercard payments        |
| `instapay`     | Real-time bank transfers via QR |
| `paygate`      | PESONet payments                |
| `gcash`        | GCash e-wallet                  |
| `grabpay`      | GrabPay e-wallet                |
| `ub online`    | UnionBank Online Banking        |
| `bayad_center` | Over-the-counter                |
| `ecpay`        | ECPay outlets                   |

---

## Authentication

Every request to the gateway requires:

1. **JWT Token** - Your access token in the header:

   ```
   Authorization: Bearer <your-access-token>
   ```
2. **Idempotency Key** (recommended) - Prevents duplicate transactions:

   ```
   x-idempotency-key: unique-key-123
   ```

---

## Simple Example Flow

### Creating an InstaPay Payment

```bash
# 1. Call the gateway
curl -X POST https://gateway.example.com/api/v1/upay/transactions \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "emailAddress": "juan@email.com",
    "mobileNumber": "9171234567",
    "amount": 100.00,
    "paymentMethod": "instapay",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "callbackUrl": "https://myapp.com/callback"
  }'
```

```json
// 2. Response with QR code
{
  "code": "SP",
  "senderRefId": "TXN-20260203-001",
  "uuid": "abc123-def456",
  "state": "Sent for Processing",
  "qrCode": "0002010102..."
}
```

```bash
# 3. Check payment status later
curl https://gateway.example.com/api/v1/upay/transactions/TXN-20260203-001/status \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## Webhook Notifications

When UnionBank confirms a payment, your app gets notified:

```json
{
  "transactionId": "8834702211220159287",
  "senderRefId": "TXN-20260203-001",
  "status": "COMPLETED",
  "amount": 100.00,
  "paymentMethod": "instapay"
}
```

---

## Error Handling

The gateway returns clear error messages:

| Error Code                        | Meaning                             |
| --------------------------------- | ----------------------------------- |
| `ERR_REFERENCE_VALIDATION`      | Missing or invalid reference fields |
| `ERR_PAYMENT_METHOD_VALIDATION` | Payment method not available        |
| `INVALID_CREDENTIALS`           | Authentication failed               |
| `INSUFFICIENT_FUNDS`            | Not enough balance                  |

**Example Error Response:**

```json
{
  "code": "ERR_PAYMENT_METHOD_VALIDATION",
  "message": "Payment method 'gcash' is not enabled for this biller",
  "details": {
    "requestedMethod": "gcash",
    "availableMethods": ["instapay", "ub online", "paygate"]
  }
}
```

---

## Quick Reference

### Base URL

```
Production:  https://gateway.inspirewallet.com/api/v1
Development: http://localhost:3000/api/v1
```

### Main Endpoints

| Endpoint                                      | Purpose                       |
| --------------------------------------------- | ----------------------------- |
| `POST /upay/transactions`                   | Create a payment              |
| `POST /upay/transactions/debit-credit-card` | Create card payment           |
| `GET /upay/transactions/:id/status`         | Check payment status          |
| `GET /upay/billers/:id`                     | Get biller details            |
| `GET /upay/payments/v1/instapay/banks`      | List InstaPay banks           |
| `POST /webhooks/unionbank/autopost`         | Receive payment notifications |

---

## Security Features

| Feature                      | Description                     |
| ---------------------------- | ------------------------------- |
| **AES-256 Encryption** | All sensitive data is encrypted |
| **HMAC Signatures**    | Webhook requests are signed     |
| **JWT Authentication** | Secure API access               |
| **Rate Limiting**      | Protection against abuse        |
| **Audit Logging**      | All transactions are logged     |

---

## Summary

1. **Your app** sends a payment request to the gateway
2. **Gateway** validates, encrypts, and forwards to UnionBank
3. **Customer** pays via their chosen method
4. **UnionBank** confirms payment via webhook
5. **Gateway** notifies your app of completion

That's it! The gateway handles all the complex bank integration, security, and compliance so you can focus on your application.

---

## Need More Details?

- [Full API Reference](api-reference.md)
- [UnionBank Integration Details](unionbank-integration.md)
- [uPay Endpoints](upay.md)
- [Authentication Guide](authentication.md)
- [Webhook Setup](webhooks.md)
