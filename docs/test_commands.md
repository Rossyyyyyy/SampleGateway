# Test Commands Documentation

This document provides comprehensive information about running tests for the UnionBank UPay Gateway integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Automated Test Commands](#automated-test-commands)
- [Manual UPay Test Script](#manual-upay-test-script)
- [Test Cases Overview](#test-cases-overview)
- [Environment Setup](#environment-setup)

## Prerequisites

Before running tests, ensure you have:

1. **Dependencies installed:**

   ```bash
   npm install
   ```

2. **Environment variables configured:**
   - Set up your `.env` file with required UnionBank UPay credentials
   - Ensure `unionbank.config` is properly configured

3. **Whitelisted test credentials (for UAT/Staging):**
   - Email addresses and mobile numbers must be whitelisted by UnionBank to receive notifications

## Automated Test Commands

The project uses Jest as the testing framework. The following commands are available:

### Run All Tests

```bash
npm test
```

Runs all test files matching the pattern `*.spec.ts` in the `src` directory.

### Watch Mode

```bash
npm run test:watch
```

Runs tests in watch mode, automatically re-running tests when files change.

### Coverage Report

```bash
npm run test:cov
```

Runs all tests and generates a coverage report in the `coverage` directory.

### Debug Mode

```bash
npm run test:debug
```

Runs tests in debug mode with Node.js inspector. Useful for debugging test failures.

### End-to-End Tests

```bash
npm run test:e2e
```

Runs end-to-end tests using the configuration in `test/jest-e2e.json`.

### Run Specific Validation Tests

To run the Reference Validation tests:

```bash
pnpm test reference-validation
```

To run the Payment Method Validation tests:

```bash
pnpm test payment-method-validation
```

## Manual UPay Test Script

The project includes a manual test script for testing UPay integration directly.

### Running the Manual Test

```bash
npx ts-node test/test-upay.ts
```

Or if you have `ts-node` installed globally:

```bash
ts-node test/test-upay.ts
```

### What the Script Does

The manual test script (`test/test-upay.ts`) performs the following operations:

1. **Creates a Transaction:**
   - Generates a unique `senderRefId` with timestamp
   - Creates a UPay transaction with sample data:
     - User ID: `B3nCv3Ed5FVwWUxxcZiw7MDCF0p2`
     - Name: Brian Perez
     - Email: `perezbrian.developer@gmail.com`
     - Amount: 100 PHP
     - Payment Method: `paygate`
   - Uses callback URL: `https://google.com` (for testing)

2. **Checks Transaction Status:**
   - Retrieves the transaction status using the `senderRefId`
   - Logs the status response

### Sample Request Data

The test script uses the following sample data:

```typescript
{
  userId: 'B3nCv3Ed5FVwWUxxcZiw7MDCF0p2',
  firstName: 'Brian',
  lastName: 'Perez',
  email: 'perezbrian.developer@gmail.com',
  amount: 100,
  phpAmount: 100,
  currency: 'PHP',
  senderRefId: `TEST-${Date.now()}`
}
```

### Customizing the Test

To modify the test data, edit the `sampleRequest` object in `test/test-upay.ts`:

```typescript
const sampleRequest = {
  userId: 'YOUR_USER_ID',
  firstName: 'Your',
  lastName: 'Name',
  email: 'your.email@example.com',
  amount: 100,
  phpAmount: 100,
  currency: 'PHP',
  senderRefId: `TEST-${Date.now()}`,
};
```

## Test Cases Overview

The following test cases are documented for UPay integration testing. These should be executed manually or integrated into automated test suites.

### Front End Tests

- **UPAY-000**: Verify all references are displayed correctly
- **UPAY-001**: Validate mandatory fields are required
- **UPAY-002**: Validate all reference formats
- **UPAY-003**: Verify editable references can be modified
- **UPAY-004**: Verify incorrect references prevent progression

### Visa/Mastercard Channel Tests

- **UPAY-005 to UPAY-013**: Successful transaction flow
  - Fee amount validation
  - Redirect to acknowledgement page
  - Correct details display
  - SMS and email notifications
  - Biller notifications (if applicable)

**Note for UAT/Staging:** If you encounter a "Processing Error" when going to the acknowledgement page, change the URL from `ubotpsentry-tst1` to `ubpcommon-staging` to proceed.

### UB Online Channel Tests

- **UPAY-021 to UPAY-030**: Successful transaction flow
  - Real-time debit/credit validation
  - Acknowledgement page details
  - Notification delivery
  - DigiOps dashboard verification
  - Autopost notification (if applicable)

- **UPAY-031 to UPAY-035**: Insufficient balance scenario
  - No debit/credit verification
  - Error message display
  - Transaction absence in DigiOps
  - Failed autopost handling

**Note for UAT/Staging:** If you encounter a "Processing Error", edit the link from `ubotpsentry-tst1` to `ubpcommon-staging`.

### InstaPay Channel Tests

- **UPAY-046 to UPAY-054**: Successful transaction (QR - Production only)
  - Real-time debit/credit
  - Acknowledgement page
  - Delayed notifications (5 minutes)
  - DigiOps dashboard
  - Autopost notification

- **UPAY-055 to UPAY-061**: No payment scenario
  - No debit/credit
  - Delayed notifications (30 mins to 1 hour)
  - Unpaid status in DigiOps
  - No autopost triggered

- **UPAY-062 to UPAY-070**: Underpayment scenario
  - Actual amount debit
  - Correct credit amount
  - Acknowledgement with amount due
  - Delayed notifications

- **UPAY-071 to UPAY-079**: Overpayment scenario
  - Actual amount debit
  - Correct credit amount
  - Acknowledgement with amount due
  - Delayed notifications

- **UPAY-080 to UPAY-088**: Multiple payments scenario
  - Multiple successful transactions
  - Duplicate entries in DigiOps
  - Notification handling

### PCHC PayGate Channel Tests

- **UPAY-089 to UPAY-098**: Successful transaction
  - Fee amount validation
  - Real-time debit
  - Scheduled credit (PesoNet schedule)
  - Acknowledgement page
  - Notifications
  - DigiOps dashboard
  - Autopost notification

### eWallet Channel Tests

- **UPAY-103 to UPAY-114**: Successful transaction
  - Fee amount validation
  - Real-time debit
  - T+1 credit schedule
  - Acknowledgement page
  - Notifications (Production only)
  - DigiOps dashboard
  - Settlement status change
  - Autopost notification

## Environment Setup

### UAT/Staging Environment

**Important Notes:**

1. **Whitelisting Required:**
   - Email addresses and mobile numbers must be whitelisted by UnionBank to receive notifications

2. **URL Fix for Processing Errors:**
   - For Visa/Mastercard and UB Online channels, if you encounter a "Processing Error" when accessing the acknowledgement page:
     - Change URL from: `ubotpsentry-tst1`
     - To: `ubpcommon-staging`

3. **Test Data:**
   - Use test credentials provided by UnionBank
   - Ensure callback URLs are accessible for testing

### Production Environment

- Use production credentials from UnionBank
- Ensure all webhooks and callback URLs are properly configured
- Test with real payment methods (use small amounts)
- Verify notification delivery mechanisms

## Troubleshooting

### Common Issues

1. **Test fails with authentication error:**
   - Verify environment variables are set correctly
   - Check UnionBank credentials in configuration

2. **Notifications not received:**
   - Ensure email/mobile is whitelisted (UAT/Staging)
   - Check notification settings in UnionBank dashboard

3. **Processing Error on acknowledgement page:**
   - Apply URL fix: change `ubotpsentry-tst1` to `ubpcommon-staging`

4. **Transaction status not found:**
   - Verify `senderRefId` is correct
   - Check transaction was created successfully
   - Ensure proper time has elapsed for status updates

## Additional Resources

- UnionBank UPay Documentation: `docs/UB_UPay_documentation.txt`
- Compiled Documentation: `docs/UB_compiled_documentation.yaml`
- Test Scripts Reference: `docs/UB_TEST_SCRIPTS_TEXT.txt`

## Support

For issues related to:

- **Integration code:** Check service implementations in `src/integrations/unionbank/`
- **UnionBank API:** Refer to UnionBank's Merchant Acquiring Team
- **Test cases:** Refer to the test scripts documentation provided by UnionBank
