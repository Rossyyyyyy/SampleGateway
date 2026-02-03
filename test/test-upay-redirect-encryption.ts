/**
 * UPay Redirect Encryption Test
 *
 * Tests the UPay redirect encryption using sample data from UB_testScript_copy.xlsx
 *
 * Run: npx ts-node test/test-upay-redirect-encryption.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UnionbankModule } from '../src/integrations/unionbank/unionbank.module';
import { UnionbankUpayRedirectService } from '../src/integrations/unionbank/services/unionbank-upay-redirect.service';
import {
  unionbankConfig,
  UnionbankConfigType,
} from '../src/config/unionbank.config';
import { Logger } from '@nestjs/common';

/**
 * Sample test data based on UB_testScript_copy.xlsx structure
 *
 * Note: Replace these with actual values from your Excel file
 * The Excel file should contain columns like:
 * - Amount
 * - Email
 * - Mobile
 * - References (various fields)
 * - etc.
 */
const TEST_DATA = [
  {
    senderRefId: `TEST-${Date.now()}-1`,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    mobile: '09171234567',
    amount: 1000,
    accountNumber: '1234567890',
    userRef: 'USER-001',
  },
  {
    senderRefId: `TEST-${Date.now()}-2`,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    mobile: '09187654321',
    amount: 2500,
    accountNumber: '0987654321',
    userRef: 'USER-002',
  },
  {
    senderRefId: `TEST-${Date.now()}-3`,
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    mobile: '09123456789',
    amount: 500,
    accountNumber: '1122334455',
    userRef: 'USER-003',
  },
];

async function runTest() {
  const logger = new Logger('UpayRedirectEncryptionTest');

  logger.log('=== UPay Redirect Encryption Test ===\n');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [unionbankConfig],
        envFilePath: ['.env', '.env.development', '.env.test'],
      }),
      UnionbankModule,
    ],
  }).compile();

  const redirectService = moduleFixture.get<UnionbankUpayRedirectService>(
    UnionbankUpayRedirectService,
  );

  // Check configuration
  logger.log('Checking configuration...');
  const configService = moduleFixture.get<ConfigService>(ConfigService);
  const unionbankConfigValue =
    configService.get<UnionbankConfigType>('unionbank');

  if (!unionbankConfigValue?.upayAesKey) {
    logger.error(
      'ERROR: UNIONBANK_UPAY_AES_KEY is not set in environment variables',
    );
    logger.error('Please set it in your .env file');
    process.exit(1);
  }

  if (!unionbankConfigValue?.upayRedirectDomain) {
    logger.error('ERROR: UNIONBANK_UPAY_REDIRECT_DOMAIN is not set');
    logger.error('Please set it in your .env file');
    process.exit(1);
  }

  if (!unionbankConfigValue?.upayBillerUuid) {
    logger.error('ERROR: UNIONBANK_UPAY_BILLER_ID is not set');
    logger.error('Please set it in your .env file');
    process.exit(1);
  }

  logger.log('✓ Configuration validated\n');

  // Test each sample data
  for (let i = 0; i < TEST_DATA.length; i++) {
    const testData = TEST_DATA[i];
    logger.log(`\n--- Test Case ${i + 1} ---`);
    logger.log(`Sender Ref ID: ${testData.senderRefId}`);
    logger.log(`Name: ${testData.firstName} ${testData.lastName}`);
    logger.log(`Email: ${testData.email}`);
    logger.log(`Mobile: ${testData.mobile}`);
    logger.log(`Amount: ${testData.amount}`);

    try {
      // Create redirect URL
      const redirectUrl = redirectService.createRedirectUrl({
        senderRefId: testData.senderRefId,
        emailAddress: testData.email,
        mobileNumber: testData.mobile,
        amount: testData.amount,
        callbackUrl: 'https://example.com/callback',
        firstName: testData.firstName,
        lastName: testData.lastName,
        accountNumber: testData.accountNumber,
        userRef: testData.userRef,
        paymentMethod: 'paygate',
        skipWhitelabelPage: false,
      });

      logger.log('\n✓ Redirect URL created successfully!');
      logger.log(`URL: ${redirectUrl}`);
      logger.log(`URL Length: ${redirectUrl.length} characters`);

      // Extract the encrypted parameter
      const urlObj = new URL(redirectUrl);
      const encryptedParam = urlObj.searchParams.get('s');
      if (encryptedParam) {
        logger.log(
          `Encrypted Parameter Length: ${encryptedParam.length} characters`,
        );
        logger.log(
          `Encrypted Parameter (first 50 chars): ${encryptedParam.substring(0, 50)}...`,
        );
      }

      // Test encryption directly
      const testPayload = {
        senderRefId: testData.senderRefId,
        amount: testData.amount,
        email: testData.email,
      };
      const encrypted = redirectService.encryptPayload(testPayload);
      logger.log(`Direct Encryption Test: ${encrypted.substring(0, 50)}...`);
    } catch (error) {
      logger.error(`\n✗ Test Case ${i + 1} Failed!`);
      if (error instanceof Error) {
        logger.error(`Error: ${error.message}`);
        if (error.stack) {
          logger.error(`Stack: ${error.stack}`);
        }
      } else {
        logger.error(`Error: ${String(error)}`);
      }
    }
  }

  logger.log('\n=== Test Complete ===');
  logger.log('\nNext Steps:');
  logger.log('1. Verify the redirect URLs are correctly formatted');
  logger.log(
    '2. Test the URLs in a browser to ensure they work with UnionBank',
  );
  logger.log(
    '3. Check UnionBank logs for any error codes (Processing Error, TF, -1, NC, -20)',
  );
  logger.log(
    '4. Ensure References array matches your onboarding configuration',
  );

  await moduleFixture.close();
}

// Run the test
void runTest().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
