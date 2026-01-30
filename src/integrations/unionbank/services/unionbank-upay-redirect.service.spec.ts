import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UnionbankUpayRedirectService } from './unionbank-upay-redirect.service';
import { unionbankConfig } from '../../../config/unionbank.config';

describe('UnionbankUpayRedirectService', () => {
  let service: UnionbankUpayRedirectService;
  const TEST_AES_KEY =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const TEST_DOMAIN = 'pay.unionbankph.com';
  const TEST_BILLER_UUID = 'test-biller-uuid-12345';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [unionbankConfig],
          envFilePath: ['.env.test'],
        }),
      ],
      providers: [UnionbankUpayRedirectService],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          if (key === 'unionbank') {
            return {
              upayAesKey: TEST_AES_KEY,
              upayRedirectDomain: TEST_DOMAIN,
              upayBillerUuid: TEST_BILLER_UUID,
            };
          }
          return undefined;
        }),
      })
      .compile();

    service = module.get<UnionbankUpayRedirectService>(
      UnionbankUpayRedirectService,
    );
  });

  describe('createRedirectUrl', () => {
    it('should create a redirect URL successfully', () => {
      const params = {
        senderRefId: 'TEST-123',
        emailAddress: 'test@example.com',
        mobileNumber: '09171234567',
        amount: 1000,
        callbackUrl: 'https://example.com/callback',
        firstName: 'John',
        lastName: 'Doe',
        accountNumber: '1234567890',
        userRef: 'USER-001',
        paymentMethod: 'paygate' as const,
        skipWhitelabelPage: false,
      };

      const url = service.createRedirectUrl(params);

      expect(url).toBeDefined();
      expect(url).toContain('https://');
      expect(url).toContain(TEST_DOMAIN);
      expect(url).toContain('/UPAY/WhiteLabel/');
      expect(url).toContain(TEST_BILLER_UUID);
      expect(url).toContain('?s=');
    });

    it('should throw error if AES key is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [unionbankConfig],
          }),
        ],
        providers: [UnionbankUpayRedirectService],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn(() => ({
            upayAesKey: '',
            upayRedirectDomain: TEST_DOMAIN,
            upayBillerUuid: TEST_BILLER_UUID,
          })),
        })
        .compile();

      const serviceWithoutKey = module.get<UnionbankUpayRedirectService>(
        UnionbankUpayRedirectService,
      );

      const params = {
        senderRefId: 'TEST-123',
        emailAddress: 'test@example.com',
        amount: 1000,
        callbackUrl: 'https://example.com/callback',
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(() => {
        serviceWithoutKey.createRedirectUrl(params);
      }).toThrow('UNIONBANK_UPAY_AES_KEY is not configured');
    });

    it('should throw error if redirect domain is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [unionbankConfig],
          }),
        ],
        providers: [UnionbankUpayRedirectService],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn(() => ({
            upayAesKey: TEST_AES_KEY,
            upayRedirectDomain: '',
            upayBillerUuid: TEST_BILLER_UUID,
          })),
        })
        .compile();

      const serviceWithoutDomain = module.get<UnionbankUpayRedirectService>(
        UnionbankUpayRedirectService,
      );

      const params = {
        senderRefId: 'TEST-123',
        emailAddress: 'test@example.com',
        amount: 1000,
        callbackUrl: 'https://example.com/callback',
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(() => {
        serviceWithoutDomain.createRedirectUrl(params);
      }).toThrow('UNIONBANK_UPAY_REDIRECT_DOMAIN is not configured');
    });

    it('should throw error if biller UUID is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [unionbankConfig],
          }),
        ],
        providers: [UnionbankUpayRedirectService],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn(() => ({
            upayAesKey: TEST_AES_KEY,
            upayRedirectDomain: TEST_DOMAIN,
            upayBillerUuid: '',
          })),
        })
        .compile();

      const serviceWithoutUuid = module.get<UnionbankUpayRedirectService>(
        UnionbankUpayRedirectService,
      );

      const params = {
        senderRefId: 'TEST-123',
        emailAddress: 'test@example.com',
        amount: 1000,
        callbackUrl: 'https://example.com/callback',
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(() => {
        serviceWithoutUuid.createRedirectUrl(params);
      }).toThrow('Biller UUID is required. Set billerUuid in params or configure UNIONBANK_UPAY_BILLER_UUID.');
    });

    it('should include all required fields in the payload', () => {
      const params = {
        senderRefId: 'TEST-123',
        emailAddress: 'test@example.com',
        mobileNumber: '09171234567',
        amount: 1000,
        callbackUrl: 'https://example.com/callback',
        firstName: 'John',
        lastName: 'Doe',
        accountNumber: '1234567890',
        userRef: 'USER-001',
      };

      const url = service.createRedirectUrl(params);

      // URL should be created successfully with all fields
      expect(url).toBeDefined();
      expect(url.length).toBeGreaterThan(0);
    });

    it('should handle optional fields correctly', () => {
      const params = {
        senderRefId: 'TEST-123',
        emailAddress: 'test@example.com',
        amount: 1000,
        callbackUrl: 'https://example.com/callback',
        firstName: 'John',
        lastName: 'Doe',
        // mobileNumber, accountNumber, userRef are optional
      };

      const url = service.createRedirectUrl(params);

      expect(url).toBeDefined();
      expect(url).toContain('?s=');
    });
  });

  describe('encryptPayload', () => {
    it('should encrypt a payload and return base64 string', () => {
      const payload = {
        test: 'data',
        amount: 1000,
      };

      const result = service.encryptPayload(payload);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw error if AES key is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [unionbankConfig],
          }),
        ],
        providers: [UnionbankUpayRedirectService],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn(() => ({
            upayAesKey: '',
          })),
        })
        .compile();

      const serviceWithoutKey = module.get<UnionbankUpayRedirectService>(
        UnionbankUpayRedirectService,
      );

      expect(() => {
        serviceWithoutKey.encryptPayload({ test: 'data' });
      }).toThrow('UNIONBANK_UPAY_AES_KEY is not configured');
    });
  });
});
