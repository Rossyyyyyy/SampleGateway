# UPay Redirect Encryption - Test Documentation

This document describes the automated test suite for the UPay redirect encryption implementation.

## Overview

The test suite validates the UPay redirect encryption functionality, ensuring that:

- Encryption works correctly with AES-256-GCM
- Redirect URLs are properly formatted
- Configuration validation works as expected
- Error handling is robust
- Security features (random IV) are functioning

## Test Files

### 1. Utility Tests

**File:** `src/integrations/unionbank/utils/upay-redirect-encryption.util.spec.ts`

Tests the core encryption utility functions that handle the low-level encryption operations.

### 2. Service Tests

**File:** `src/integrations/unionbank/services/unionbank-upay-redirect.service.spec.ts`

Tests the high-level service that orchestrates the encryption and URL creation process.

## Test Coverage

### Utility Tests (`upay-redirect-encryption.util.spec.ts`)

#### encryptUpayRedirectPayload Function Tests

**What it tests:** The core encryption function that encrypts JSON payloads using AES-256-GCM.

**Test Cases:**

1. **Basic Encryption**
   - **Test:** `should encrypt a payload and return base64 string`
   - **What it validates:**
     - Function returns a defined result
     - Result is a string
     - Result is valid Base64 format (only contains `A-Za-z0-9+/=` characters)
   - **Code under test:** `encryptUpayRedirectPayload()` function
   - **Why it matters:** Ensures the encryption produces valid output that can be transmitted

2. **Random IV Generation**
   - **Test:** `should generate different encrypted strings for same payload`
   - **What it validates:**
     - Same payload encrypted twice produces different results
     - This is due to random IV generation (security feature)
   - **Code under test:** IV generation in `encryptUpayRedirectPayload()`
   - **Why it matters:** Prevents pattern analysis attacks - each encryption is
     unique even with the same data

3. **Complex Payloads**
   - **Test:** `should handle complex payloads with nested objects`
   - **What it validates:**
     - Encryption works with nested arrays and objects
     - JSON serialization handles complex structures correctly
   - **Code under test:** JSON.stringify and encryption of complex objects
   - **Why it matters:** Real-world payloads contain nested structures (like references array)

4. **Error Handling - Empty Key**
   - **Test:** `should throw error if AES key is empty`
   - **What it validates:**
     - Function throws appropriate error when key is missing
     - Error message is descriptive
   - **Code under test:** Input validation in `encryptUpayRedirectPayload()`
   - **Why it matters:** Prevents silent failures and provides clear error messages

5. **Hex Format Key Support**
   - **Test:** `should accept hex format AES key (64 characters)`
   - **What it validates:**
     - Function accepts 64-character hexadecimal strings as keys
     - Encryption works with hex format
   - **Code under test:** `parseAesKey()` function - hex parsing logic
   - **Why it matters:** UnionBank may provide keys in hex format

6. **Base64 Format Key Support**
   - **Test:** `should accept base64 format AES key`
   - **What it validates:**
     - Function accepts Base64-encoded keys
     - Encryption works with Base64 format
   - **Code under test:** `parseAesKey()` function - Base64 parsing logic
   - **Why it matters:** Keys might be provided in Base64 format

7. **Invalid Key Format Detection**
   - **Test:** `should throw error for invalid AES key format`
   - **What it validates:**
     - Function rejects keys that are too short or invalid format
     - Appropriate error message is thrown
   - **Code under test:** `parseAesKey()` function - validation logic
   - **Why it matters:** Prevents encryption with invalid keys that would cause failures

#### createUpayRedirectUrl Function Tests

**What it tests:** The function that creates the complete redirect URL with encrypted payload.

**Test Cases:**

1. **URL Creation**
   - **Test:** `should create a valid redirect URL`
   - **What it validates:**
     - URL contains `https://` protocol
     - URL contains the correct domain
     - URL contains `/UPAY/WhiteLabel/` path
     - URL contains the Biller UUID
     - URL contains the `?s=` query parameter with encrypted data
   - **Code under test:** `createUpayRedirectUrl()` function
   - **Why it matters:** Ensures the URL format matches UnionBank's requirements

2. **URL Encoding**
   - **Test:** `should URL encode the encrypted parameter`
   - **What it validates:**
     - Encrypted parameter is properly URL encoded
     - No spaces in the encoded parameter
     - Base64 characters are correctly encoded for URL transmission
   - **Code under test:** `encodeURIComponent()` usage in `createUpayRedirectUrl()`
   - **Why it matters:** URLs must be properly encoded to avoid breaking the URL structure

3. **Domain Validation**
   - **Test:** `should throw error if domain is empty`
   - **What it validates:**
     - Function rejects empty domain
     - Clear error message provided
   - **Code under test:** Input validation in `createUpayRedirectUrl()`
   - **Why it matters:** Prevents creating invalid URLs

4. **Biller UUID Validation**
   - **Test:** `should throw error if biller UUID is empty`
   - **What it validates:**
     - Function rejects empty Biller UUID
     - Clear error message provided
   - **Code under test:** Input validation in `createUpayRedirectUrl()`
   - **Why it matters:** Biller UUID is required for the redirect URL path

5. **Random IV in URLs**
   - **Test:** `should create different URLs for same payload`
   - **What it validates:**
     - Same payload produces different URLs
     - This is due to random IV in encryption
   - **Code under test:** IV generation affecting final URL
   - **Why it matters:** Security - prevents URL replay attacks

### Service Tests (`unionbank-upay-redirect.service.spec.ts`)

#### createRedirectUrl Method Tests

**What it tests:** The service method that creates redirect URLs with proper payload construction.

**Test Cases:**

1. **Successful URL Creation**
   - **Test:** `should create a redirect URL successfully`
   - **What it validates:**
     - Service creates valid redirect URLs
     - All URL components are present
     - Payload is properly constructed from input parameters
   - **Code under test:** `UnionbankUpayRedirectService.createRedirectUrl()`
   - **Why it matters:** This is the main entry point for creating redirect URLs

2. **AES Key Configuration Validation**
   - **Test:** `should throw error if AES key is not configured`
   - **What it validates:**
     - Service checks for AES key configuration
     - Throws descriptive error if missing
   - **Code under test:** Configuration validation in `createRedirectUrl()`
   - **Why it matters:** Prevents runtime errors from missing configuration

3. **Redirect Domain Configuration Validation**
   - **Test:** `should throw error if redirect domain is not configured`
   - **What it validates:**
     - Service checks for domain configuration
     - Throws descriptive error if missing
   - **Code under test:** Configuration validation in `createRedirectUrl()`
   - **Why it matters:** Domain is required to construct valid URLs

4. **Biller UUID Configuration Validation**
   - **Test:** `should throw error if biller UUID is not configured`
   - **What it validates:**
     - Service checks for Biller UUID configuration
     - Throws descriptive error if missing
   - **Code under test:** Configuration validation in `createRedirectUrl()`
   - **Why it matters:** Biller UUID is required for the URL path

5. **Required Fields Handling**
   - **Test:** `should include all required fields in the payload`
   - **What it validates:**
     - All required fields are included in the encrypted payload
     - Payload structure matches UnionBank requirements
   - **Code under test:** Payload construction in `createRedirectUrl()`
   - **Why it matters:** Missing fields cause UnionBank to reject the request

6. **Optional Fields Handling**
   - **Test:** `should handle optional fields correctly`
   - **What it validates:**
     - Service works with minimal required fields
     - Optional fields (mobileNumber, accountNumber, userRef) are handled gracefully
   - **Code under test:** Optional parameter handling in `createRedirectUrl()`
   - **Why it matters:** Not all transactions require all fields

#### encryptPayload Method Tests

**What it tests:** The service method for direct payload encryption (useful for testing).

**Test Cases:**

1. **Payload Encryption**
   - **Test:** `should encrypt a payload and return base64 string`
   - **What it validates:**
     - Service can encrypt arbitrary payloads
     - Returns valid Base64 string
   - **Code under test:** `UnionbankUpayRedirectService.encryptPayload()`
   - **Why it matters:** Useful for testing and debugging encryption

2. **Configuration Check for Encryption**
   - **Test:** `should throw error if AES key is not configured`
   - **What it validates:**
     - Service validates configuration before encryption
     - Provides clear error message
   - **Code under test:** Configuration validation in `encryptPayload()`
   - **Why it matters:** Prevents encryption attempts without proper setup

## Test Execution

### Running All UPay Redirect Tests

```bash
npm test -- --testPathPatterns="upay-redirect"
```

### Running with Coverage

```bash
npm test -- --testPathPatterns="upay-redirect" --coverage
```

### Running in Watch Mode

```bash
npm test -- --testPathPatterns="upay-redirect" --watch
```

### Running Individual Test Files

```bash
# Utility tests only
npm test -- src/integrations/unionbank/utils/upay-redirect-encryption.util.spec.ts

# Service tests only
npm test -- src/integrations/unionbank/services/unionbank-upay-redirect.service.spec.ts
```

## Test Results

### Current Status

**All tests passing** (20/20 tests)

```text
Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
Time:        ~0.5-0.6s
```

### Test Breakdown

| Test Suite     | Tests | Status         |
|----------------|-------|----------------|
| Utility Tests  | 12    | Passing        |
| Service Tests  | 8     | Passing        |
| **Total**      | **20**| **All Passing**|

## What Each Test Validates

### Security Validations

- Random IV generation (prevents pattern analysis)
- Proper encryption algorithm (AES-256-GCM)
- Key format validation
- Unique encryption per request

### Functionality Validations

- Encryption produces valid Base64 output
- URL construction follows UnionBank format
- Payload serialization handles complex objects
- URL encoding preserves data integrity

### Configuration Validations

- Required configuration parameters are checked
- Clear error messages for missing configuration
- Multiple key formats supported (hex, base64)

### Integration Validations

- Service properly uses utility functions
- Payload structure matches UnionBank requirements
- Optional fields handled correctly

## Code Coverage

The tests cover:

1. **Encryption Utility** (`upay-redirect-encryption.util.ts`)

   - `encryptUpayRedirectPayload()` - All code paths
   - `createUpayRedirectUrl()` - All code paths
   - `parseAesKey()` - All key format branches

2. **Redirect Service** (`unionbank-upay-redirect.service.ts`)

   - `createRedirectUrl()` - All validation and creation logic
   - `encryptPayload()` - Encryption and validation

## Test Data

Tests use mock data that simulates real-world scenarios:

- **Test AES Key:** 64-character hex string (32 bytes)
- **Test Domain:** `pay.unionbankph.com`
- **Test Biller UUID:** `test-biller-uuid-12345`
- **Sample Payloads:** Include all required and optional fields

## Continuous Integration

These tests should be run:

- Before every commit
- In CI/CD pipeline
- Before deploying to production
- When modifying encryption logic

## Maintenance

### Adding New Tests

When adding new functionality:

1. **Add utility tests** if modifying encryption logic
2. **Add service tests** if modifying service behavior
3. **Update this documentation** with new test cases

### Test Naming Convention

- Use descriptive names: `should [expected behavior]`
- Group related tests in `describe` blocks
- Use `it` for individual test cases

### Example Test Structure

```typescript
describe('FeatureName', () => {
  it('should handle normal case', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBeDefined();
  });
});
```

## Related Documentation

- [UPay Redirect Encryption Implementation](./upay-redirect-encryption.md) -
  Main implementation guide
- [UnionBank UPay API Documentation](../UB_copy.pdf) - Official API documentation

## Troubleshooting

### Common Test Failures

1. **"AES key is required"**
   - **Cause:** Test configuration missing AES key
   - **Fix:** Ensure test setup includes `upayAesKey` in config mock

2. **"Invalid AES key format"**
   - **Cause:** Test key doesn't match expected format
   - **Fix:** Use 64-character hex string or valid Base64 key

3. **Type errors in tests**
   - **Cause:** TypeScript type mismatches
   - **Fix:** Ensure test mocks match expected types

### Debugging Tests

Run tests with verbose output:

```bash
npm test -- --testPathPatterns="upay-redirect" --verbose
```

Run a specific test:

```bash
npm test -- --testPathPatterns="upay-redirect" -t "should encrypt a payload"
```

## Conclusion

The test suite provides comprehensive coverage of the UPay redirect
encryption functionality, ensuring:

- Security features work correctly
- Error handling is robust
- Configuration validation prevents runtime errors
- Integration with UnionBank's system will work as expected

All 20 tests are currently passing, providing confidence in the
implementation's correctness and reliability.
