# Database

The gateway uses PostgreSQL as its primary database with Prisma ORM for type-safe database operations.

## Overview

The database schema includes:

- **Partners**: API clients/partners
- **Wallets**: User wallet accounts
- **Transfers**: Fund transfer records
- **Transactions**: General ledger transactions
- **Audit Logs**: Security and activity audit trail
- **Webhook Events**: Webhook processing tracking

## Schema

### Partners

Stores partner/client information for API authentication.

```prisma
model Partner {
  id            String   @id @default(uuid())
  name          String
  apiKey        String   @unique
  apiSecretHash String   @map("api_secret_hash")
  isActive      Boolean  @default(true) @map("is_active")
  permissions   String[] @default([])
  webhookUrl    String?  @map("webhook_url")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  wallets      Wallet[]
  transfers    Transfer[]
  transactions Transaction[]
  auditLogs    AuditLog[]
}
```

**Fields**:

- `id`: Unique identifier
- `name`: Partner name
- `apiKey`: API key for authentication
- `apiSecretHash`: Bcrypt hash of API secret
- `isActive`: Whether partner is active
- `permissions`: Array of permission strings
- `webhookUrl`: Optional webhook URL for notifications

### Wallets

User wallet accounts linked to partners.

```prisma
model Wallet {
  id            String   @id @default(uuid())
  partnerId     String   @map("partner_id")
  accountNumber String   @unique @map("account_number")
  accountName   String   @map("account_name")
  balance       Decimal  @default(0) @db.Decimal(18, 2)
  currency      String   @default("PHP")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  partner      Partner      @relation(fields: [partnerId], references: [id])
  transfers    Transfer[]
  transactions Transaction[]
}
```

**Fields**:

- `id`: Unique identifier
- `partnerId`: Associated partner
- `accountNumber`: Unique account number
- `accountName`: Account holder name
- `balance`: Current balance (Decimal 18,2)
- `currency`: Currency code (default: PHP)
- `isActive`: Whether wallet is active

### Transfers

Fund transfer records (InstaPay/PESONet).

```prisma
model Transfer {
  id                      String            @id @default(uuid())
  referenceId             String            @unique @map("reference_id")
  externalReferenceId     String?           @map("external_reference_id")
  partnerId               String            @map("partner_id")
  walletId                String?          @map("wallet_id")
  type                    TransferType
  direction               TransferDirection
  status                  TransferStatus    @default(PENDING)
  senderName              String            @map("sender_name")
  senderAccountNumber     String?          @map("sender_account_number")
  beneficiaryName         String           @map("beneficiary_name")
  beneficiaryAccountNumber String           @map("beneficiary_account_number")
  receivingBank           String           @map("receiving_bank")
  amount                  Decimal          @db.Decimal(18, 2)
  currency                String           @default("PHP")
  fee                     Decimal          @default(0) @db.Decimal(18, 2)
  purpose                 String?
  statusMessage           String?          @map("status_message")
  failureReason           String?          @map("failure_reason")
  idempotencyKey          String?          @unique @map("idempotency_key")
  requestId               String?          @map("request_id")
  createdAt               DateTime          @default(now()) @map("created_at")
  updatedAt               DateTime         @updatedAt @map("updated_at")
  completedAt             DateTime?         @map("completed_at")

  partner Partner @relation(fields: [partnerId], references: [id])
  wallet  Wallet? @relation(fields: [walletId], references: [id])

  @@index([partnerId])
  @@index([status])
  @@index([createdAt])
}
```

**Enums**:

- `TransferType`: `INSTAPAY`, `PESONET`
- `TransferDirection`: `INBOUND`, `OUTBOUND`
- `TransferStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`

### Transactions

General ledger transactions.

```prisma
model Transaction {
  id           String            @id @default(uuid())
  referenceId  String            @unique @map("reference_id")
  partnerId    String            @map("partner_id")
  walletId     String?           @map("wallet_id")
  type         TransactionType
  status       TransactionStatus @default(PENDING)
  amount       Decimal           @db.Decimal(18, 2)
  currency     String            @default("PHP")
  balanceBefore Decimal?         @map("balance_before") @db.Decimal(18, 2)
  balanceAfter  Decimal?         @map("balance_after") @db.Decimal(18, 2)
  description  String?
  metadata     Json?
  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @updatedAt @map("updated_at")

  partner Partner @relation(fields: [partnerId], references: [id])
  wallet  Wallet? @relation(fields: [walletId], references: [id])

  @@index([partnerId])
  @@index([walletId])
  @@index([createdAt])
}
```

**Enums**:

- `TransactionType`: `CREDIT`, `DEBIT`, `TRANSFER_IN`, `TRANSFER_OUT`, `FEE`, `REFUND`, `ADJUSTMENT`
- `TransactionStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REVERSED`

### Audit Logs

Security and activity audit trail.

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  eventType   String   @map("event_type")
  action      String
  resourceType String   @map("resource_type")
  resourceId  String   @map("resource_id")
  actorId     String   @map("actor_id")
  actorType   String   @map("actor_type")
  partnerId   String?  @map("partner_id")
  metadata    Json?
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent")
  requestId   String?  @map("request_id")
  createdAt   DateTime @default(now()) @map("created_at")

  partner Partner? @relation(fields: [partnerId], references: [id])

  @@index([eventType])
  @@index([resourceType, resourceId])
  @@index([actorId])
  @@index([createdAt])
}
```

### Webhook Events

Webhook processing tracking.

```prisma
model WebhookEvent {
  id          String        @id @default(uuid())
  eventId     String        @unique @map("event_id")
  eventType   String        @map("event_type")
  payload     Json
  status      WebhookStatus @default(RECEIVED)
  attempts    Int           @default(0)
  lastError   String?       @map("last_error")
  processedAt DateTime?     @map("processed_at")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  @@index([eventType])
  @@index([status])
  @@index([createdAt])
}
```

**Enum**:

- `WebhookStatus`: `RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`

## Relationships

- **Partner** → **Wallets** (one-to-many)
- **Partner** → **Transfers** (one-to-many)
- **Partner** → **Transactions** (one-to-many)
- **Partner** → **AuditLogs** (one-to-many)
- **Wallet** → **Transfers** (one-to-many)
- **Wallet** → **Transactions** (one-to-many)

## Indexes

Indexes are created for:

- **Partners**: `apiKey` (unique)
- **Wallets**: `accountNumber` (unique)
- **Transfers**: `referenceId` (unique), `partnerId`, `status`, `createdAt`, `idempotencyKey` (unique)
- **Transactions**: `referenceId` (unique), `partnerId`, `walletId`, `createdAt`
- **AuditLogs**: `eventType`, `resourceType + resourceId`, `actorId`, `createdAt`
- **WebhookEvents**: `eventId` (unique), `eventType`, `status`, `createdAt`

## Migrations

### Create Migration

```bash
pnpm prisma migrate dev --name migration-name
```

### Apply Migrations

```bash
# Development
pnpm prisma migrate dev

# Production
pnpm prisma migrate deploy
```

### Reset Database

```bash
# Development only - deletes all data
pnpm prisma migrate reset
```

## Prisma Client

### Generate Client

```bash
pnpm prisma generate
```

### Usage

```typescript
import { PrismaService } from './prisma.service';

// Query
const partner = await prisma.partner.findUnique({
  where: { apiKey: 'key-123' },
  include: { wallets: true }
});

// Create
const transfer = await prisma.transfer.create({
  data: {
    referenceId: 'TXN-001',
    partnerId: partner.id,
    type: 'INSTAPAY',
    direction: 'OUTBOUND',
    senderName: 'John Doe',
    beneficiaryName: 'Jane Smith',
    beneficiaryAccountNumber: '1234567890',
    receivingBank: 'BDO',
    amount: 1000.00,
    currency: 'PHP'
  }
});

// Update
await prisma.transfer.update({
  where: { id: transfer.id },
  data: { status: 'COMPLETED', completedAt: new Date() }
});

// Transaction
await prisma.$transaction([
  prisma.transfer.update({
    where: { id: transfer.id },
    data: { status: 'COMPLETED' }
  }),
  prisma.transaction.create({
    data: { ... }
  })
]);
```

## Prisma Studio

Visual database browser:

```bash
pnpm prisma studio
```

Opens at `http://localhost:5555`

## Best Practices

1. **Use Transactions**: For related operations
2. **Indexes**: Add indexes for frequently queried fields
3. **Migrations**: Review migrations before applying
4. **Backups**: Regular database backups
5. **Connection Pooling**: Configure appropriate pool size
6. **Query Optimization**: Use `select` to fetch only needed fields
7. **Relations**: Use `include` or `select` for relations
8. **Error Handling**: Handle Prisma errors appropriately
9. **Type Safety**: Use generated Prisma types
10. **Schema Validation**: Validate schema changes in development

## Connection String

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database?schema=public
```

**Parameters**:

- `user`: Database user
- `password`: Database password
- `localhost:5432`: Database host and port
- `database`: Database name
- `schema`: Schema name (default: public)

## Production Considerations

1. **SSL**: Use SSL for production connections
2. **Connection Pooling**: Configure pool size
3. **Read Replicas**: Use read replicas for queries
4. **Backups**: Automated backups
5. **Monitoring**: Monitor database performance
6. **Migrations**: Test migrations in staging first
7. **Indexes**: Monitor and optimize indexes
8. **Queries**: Monitor slow queries
