# UnionBank UPay Service Test Documentation

## Overview

This document describes the unit test suite for `UnionbankUpayService`, which tests the UPay transaction creation and status retrieval functionality. The tests use **mocked API clients** and do **not** access real UPay logs or the UnionBank API.

**Test File**: `src/integrations/unionbank/services/unionbank-upay.service.spec.ts`

**Total Tests**: 36 tests covering all major UPay transaction scenarios

## Test Architecture

### Mocking Strategy

The tests use Jest mocks to isolate the service from external dependencies:

- **Mocked**: `UnionbankApiClient` - All API calls are mocked
- **Real**: `UnionbankUpayService` - The service under test uses real implementation
- **No Real API Calls**: Tests do not make actual HTTP requests to UnionBank

### Test Structure

```typescript
describe('UnionbankUpayService', () => {
  // Mock setup
  const mockPost = jest.fn();
  const mockGet = jest.fn();
  const mockApiClient = { post: mockPost, get: mockGet };
  
  // Tests organized by feature
})
```

## Running the Tests

### Run All Tests

```bash
npm test -- unionbank-upay.service.spec.ts
```

### Run with Coverage

```bash
npm run test:cov
```

### Run in Watch Mode

```bash
npm run test:watch
```

## Test Coverage

### 1. Front End Reference Validation (UPAY-000 to UPAY-004)

Tests validation of required and optional reference fields in transaction requests.

#### UPAY-000: Include All Required References

- **Purpose**: Verifies that all mandatory references are included in the request
- **Validates**:
  - `firstName` (index: 1)
  - `accountNumber` (index: 2)
  - `userRef` (index: 3)
  - `lastName` (index: 4)
- **Expected**: Request contains all required references with correct indices

#### UPAY-001: Require All Mandatory References

- **Purpose**: Ensures missing mandatory fields trigger validation errors
- **Scenario**: Missing `firstName` field
- **Expected**: Throws `UnionbankApiException` with error code `TF`
- **Error Message**: "The PAYOR FIRST NAME is a required field."

#### UPAY-002: Validate All References Are Correct

- **Purpose**: Validates format and correctness of reference values
- **Scenario**: Invalid email address format
- **Expected**: Throws `UnionbankApiException` with error code `-1`
- **Error Message**: "You entered invalid email address"

#### UPAY-003: Handle Optional References Correctly

- **Purpose**: Verifies optional fields can be omitted or empty
- **Scenario**: Missing `accountNumber` and `userRef`
- **Expected**: Request succeeds with empty strings for optional references
- **Behavior**: Optional references are set to empty strings (`''`)

#### UPAY-004: Reject Incorrect References

- **Purpose**: Prevents injection attacks and invalid characters
- **Scenario**: XSS attempt in `accountNumber` field
- **Expected**: Throws `UnionbankApiException` with error code `-1`
- **Error Message**: "references.value you entered has invalid character(s)."

---

### 2. Visa/Mastercard Successful Transaction (UPAY-005 to UPAY-013)

Tests debit/credit card payment flow.

#### UPAY-005: Create Debit/Credit Card Transaction Successfully

- **Purpose**: Verifies successful debit/credit card transaction creation
- **Payment Method**: `debit/credit`
- **Expected Response**:
  - Code: `SP` (Sent for Processing)
  - Contains redirect URL in `message` field
  - URL format: `https://ubotpsentry-tst1.outsystemsenterprise.com/UPAY/WhiteLabel.aspx?BillerUuid=xxx&Cipher=yyy`
- **Validates**: Transaction ID and UUID are present

#### UPAY-008: Return Redirect URL for Acknowledgement Page

- **Purpose**: Ensures redirect URL is returned for payment page
- **Expected**:
  - `message` field contains URL
  - URL contains `/UPAY/` path
  - Response code is `SP`

#### UPAY-009: Include Correct Transaction Details

- **Purpose**: Verifies transaction response contains all required details
- **Validates**:
  - `senderRefId` matches request
  - `transactionId` is present
  - `uuid` is present

---

### 3. UB Online Successful Transaction (UPAY-021 to UPAY-030)

Tests UnionBank Online banking payment flow.

#### UPAY-021: Create UB Online Transaction Successfully

- **Purpose**: Verifies successful UB Online transaction creation
- **Payment Method**: `ub online`
- **Expected Response**:
  - Code: `200` (Success)
  - Contains redirect URL: `/UPAY/Redirect.aspx`
  - Transaction ID and UUID present
- **Note**: UB Online uses code `200` instead of `SP`

#### UPAY-022: Handle Realtime Debit for UB Online

- **Purpose**: Tests real-time account debit functionality
- **Scenario**: Transaction with amount 2000
- **Expected**:
  - Code: `200`
  - State: `Sent for Processing`
- **Behavior**: Immediate debit from UB Online account

#### UPAY-024: Include Correct Details in Response

- **Purpose**: Validates response structure for UB Online transactions
- **Validates**: All transaction identifiers are present

---

### 4. UB Online Insufficient Balance (UPAY-031 to UPAY-035)

Tests error handling for insufficient account balance.

#### UPAY-031: Handle Insufficient Balance Error

- **Purpose**: Verifies proper error handling when account has insufficient funds
- **Scenario**: Transaction amount exceeds available balance
- **Error Code**: `TF` (Transaction Failed)
- **Expected**: Throws `UnionbankApiException` with status code `400`
- **Error Message**: "Insufficient balance"

#### UPAY-033: Return Error Message for Insufficient Balance

- **Purpose**: Ensures error messages are properly propagated
- **Expected**: Exception message contains "insufficient"

---

### 5. InstaPay Successful Transaction (UPAY-046 to UPAY-054)

Tests InstaPay QR code payment flow.

#### UPAY-046: Create InstaPay Transaction Successfully

- **Purpose**: Verifies successful InstaPay transaction creation
- **Payment Method**: `instapay`
- **Special Parameter**: `skipWhitelabelPage: true`
- **Expected Response**:
  - Code: `SP`
  - Contains `qrCode` field with QR code string
  - Transaction ID present
- **QR Code Format**: Base64 encoded QR string

#### UPAY-048: Include Correct Details in InstaPay Response

- **Purpose**: Validates InstaPay response structure
- **Validates**: Transaction identifiers and QR code presence

---

### 6. InstaPay No Payment (UPAY-055 to UPAY-061)

Tests InstaPay transaction where no payment is received.

#### UPAY-055: Handle InstaPay Transaction with No Payment

- **Purpose**: Verifies handling of transactions where payment is not completed
- **Expected**: Transaction is created with code `SP` but no payment received
- **Use Case**: User scans QR but doesn't complete payment

---

### 7. InstaPay Underpayment (UPAY-062 to UPAY-070)

Tests InstaPay scenario where payment amount is less than required.

#### UPAY-062: Handle InstaPay Underpayment Scenario

- **Purpose**: Tests handling when payment is less than transaction amount
- **Scenario**: Amount 115 (includes fee), but payment is less
- **Expected**: Transaction created with code `SP`
- **Note**: Actual payment reconciliation handled separately

---

### 8. InstaPay Overpayment (UPAY-071 to UPAY-079)

Tests InstaPay scenario where payment amount exceeds required amount.

#### UPAY-071: Handle InstaPay Overpayment Scenario

- **Purpose**: Tests handling when payment exceeds transaction amount
- **Scenario**: Amount 115, but actual payment is 120
- **Expected**: Transaction created with code `SP`
- **Note**: Overpayment handling depends on business logic

---

### 9. InstaPay Multiple Payments (UPAY-080 to UPAY-088)

Tests handling of multiple payments for the same transaction.

#### UPAY-080: Handle Multiple Payments with Same QR/Reference

- **Purpose**: Verifies system handles multiple payment attempts
- **Scenario**: Same QR code/reference used for multiple payments
- **Expected**: Transaction created successfully
- **Use Case**: User makes multiple partial payments

---

### 10. PCHC PayGate Successful Transaction (UPAY-089 to UPAY-098)

Tests PCHC PayGate payment flow.

#### UPAY-089: Create PCHC PayGate Transaction Successfully

- **Purpose**: Verifies successful PayGate transaction creation
- **Payment Method**: `paygate`
- **Expected Response**:
  - Code: `SP`
  - Transaction ID: UUID format (e.g., `c4fdf908-43ea-6913-b5fa-7e64625aa859`)
  - Callback URL in `message` field
  - URL contains `pchc` domain

#### UPAY-092: Include Correct Details in PayGate Response

- **Purpose**: Validates PayGate response structure
- **Validates**: All transaction identifiers present

---

### 11. eWallet Successful Transaction (UPAY-103 to UPAY-114)

Tests eWallet payment methods (GCash, GrabPay, etc.).

#### UPAY-103: Create eWallet Transaction Successfully

- **Purpose**: Verifies successful eWallet transaction creation
- **Payment Method**: `gcash`
- **Expected Response**:
  - Code: `SP`
  - Transaction ID and UUID present

#### UPAY-107: Include Correct Details in eWallet Response

- **Purpose**: Validates eWallet response structure
- **Payment Method**: `grabpay`
- **Validates**: All transaction identifiers present

---

### 12. Error Handling

Tests various error scenarios and exception handling.

#### Duplicate senderRefId Error (-20)

- **Purpose**: Prevents duplicate transaction creation
- **Error Code**: `-20`
- **Scenario**: Attempting to create transaction with existing `senderRefId`
- **Expected**: Throws `UnionbankApiException`
- **Error Message**: "senderRefId already exist"

#### Network Error (NC)

- **Purpose**: Handles network connectivity issues
- **Error Code**: `NC` (Network Issue - Core)
- **Expected**: Throws `UnionbankApiException` with status code `500`

#### Account Not Active Error (TF)

- **Purpose**: Handles inactive account scenarios
- **Error Code**: `TF`
- **Expected**: Throws `UnionbankApiException` with status code `400`
- **Error Message**: "Account is not active"

#### Maximum Amount Validation Error

- **Purpose**: Enforces transaction amount limits
- **Scenario**: Amount exceeds maximum (e.g., 100000 > 50000)
- **Error Code**: `TF`
- **Expected**: Throws `UnionbankApiException`
- **Error Message**: "Maximum amount is set at 50000"

#### Invalid Date Format Error

- **Purpose**: Validates date format in requests
- **Error Code**: `-1`
- **Field**: `tranRequestDate`
- **Expected**: Throws `UnionbankApiException`
- **Error Message**: "You entered invalid date"

---

### 13. Request ID Handling

Tests request ID propagation for tracing and logging.

#### Pass RequestId to API Client (createTransaction)

- **Purpose**: Ensures request IDs are properly passed through
- **Scenario**: Custom `requestId` provided
- **Validates**: Request ID is included in API client call
- **Use Case**: Request tracing and correlation

---

### 14. createDebitCreditCardTransaction Method

Tests the convenience method for debit/credit card transactions.

#### Set PaymentMethod to Debit/Credit

- **Purpose**: Verifies method automatically sets payment method
- **Expected**: `paymentMethod` is set to `'debit/credit'` automatically
- **Note**: Method wraps `createTransaction` with payment method preset

---

### 15. getTransactionStatus Method

Tests transaction status retrieval functionality.

#### Get Transaction Status Successfully

- **Purpose**: Verifies successful status retrieval
- **Status**: `SUCCESS`
- **Response Includes**:
  - `senderRefId`
  - `uuid`
  - `status`
  - `amount`
  - `paidAt` (timestamp)
  - `paymentMethod`

#### Handle PENDING Status

- **Purpose**: Tests pending transaction status
- **Status**: `PENDING`
- **Use Case**: Transaction created but payment not yet completed

#### Handle FAILED Status

- **Purpose**: Tests failed transaction status
- **Status**: `FAILED`
- **Response Includes**: Error `message` field

#### Handle EXPIRED Status

- **Purpose**: Tests expired transaction status
- **Status**: `EXPIRED`
- **Use Case**: Transaction timeout before payment completion

#### Pass RequestId to API Client (getTransactionStatus)

- **Purpose**: Ensures request IDs are passed for status queries
- **Validates**: Request ID included in status API call

#### Handle API Errors When Getting Status

- **Purpose**: Handles errors during status retrieval
- **Scenario**: Transaction not found (404)
- **Expected**: Throws `UnionbankApiException`

---

## Test Data

### Base Parameters

All tests use a common set of base parameters:

```typescript
const baseParams = {
  senderRefId: 'TEST-001',
  emailAddress: 'test@example.com',
  mobileNumber: '09171234567',
  amount: 1000,
  callbackUrl: 'https://example.com/callback',
  firstName: 'John',
  lastName: 'Doe',
  accountNumber: '1234567890',
  userRef: 'USER-001',
};
```

### Reference Mapping

The service maps parameters to reference indices:

- **Index 1**: `firstName` (PAYOR FIRST NAME)
- **Index 2**: `accountNumber` (optional)
- **Index 3**: `userRef` (optional)
- **Index 4**: `lastName` (PAYOR LAST NAME)

---

## Response Codes

### Success Codes

- **`SP`**: Sent for Processing (most payment methods)
- **`200`**: Success (UB Online)

### Error Codes

- **`-1`**: Missing/Invalid Parameters
- **`-20`**: Duplicate senderRefId
- **`TF`**: Transaction Failed / Account not active
- **`NC`**: Network Issue - Core

---

## Payment Methods Tested

1. **`debit/credit`**: Visa/Mastercard payments
2. **`ub online`**: UnionBank Online banking
3. **`instapay`**: InstaPay QR code payments
4. **`paygate`**: PCHC PayGate payments
5. **`gcash`**: GCash eWallet
6. **`grabpay`**: GrabPay eWallet

---

## Important Notes

### ⚠️ These Are Unit Tests

- **No Real API Calls**: All tests use mocked API clients
- **No Network Requests**: Tests run completely isolated
- **Fast Execution**: Tests complete in < 1 second
- **No Credentials Required**: Tests don't need UnionBank API credentials

### Integration Testing

For testing against the real UnionBank UAT API, use:

- **Manual Script**: `test/test-upay.ts` (requires real credentials)
- **Integration Tests**: Create separate integration test suite (not yet implemented)

### Test Isolation

Each test:

- Clears mocks after execution (`afterEach`)
- Uses independent test data
- Doesn't affect other tests
- Can run in any order

---

## Test Execution Results

```plaintext
Test Suites: 1 passed, 1 total
Tests:       36 passed, 36 total
Snapshots:   0 total
Time:        0.451 s
```

All 36 tests pass successfully, covering:

- ✅ Reference validation (5 tests)
- ✅ Payment method flows (15 tests)
- ✅ Error handling (5 tests)
- ✅ Status retrieval (6 tests)
- ✅ Request ID handling (2 tests)
- ✅ Method-specific tests (3 tests)

---

## Maintenance

### Adding New Tests

When adding new test cases:

1. Follow existing test structure
2. Use `baseParams` for common parameters
3. Mock API responses appropriately
4. Test both success and error scenarios
5. Include UPAY error code if applicable

### Test Naming Convention

- Use UPAY error codes when available (e.g., `UPAY-000`)
- Descriptive test names: `should [action] [expected result]`
- Group related tests in `describe` blocks

---

## Related Documentation

- [UnionBank Integration Guide](./unionbank-integration.md)
- [Configuration](./configuration.md)
- [API Reference](./api-reference.md)
