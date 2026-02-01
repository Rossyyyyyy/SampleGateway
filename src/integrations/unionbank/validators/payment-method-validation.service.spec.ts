import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodValidationService } from './payment-method-validation.service';
import type {
  UpayBiller,
  UpayBillerUuidResponse,
  UpayPaymentChannel,
} from '../dto/response/upay-biller.response.dto';

describe('PaymentMethodValidationService', () => {
  let service: PaymentMethodValidationService;

  const createMockChannel = (
    overrides: Partial<UpayPaymentChannel> = {},
  ): UpayPaymentChannel => ({
    name: 'Test Channel',
    code: 'TEST',
    isEnabled: true,
    isAvailed: true,
    chargeTo: 'Payor',
    settlement: '0',
    fee: '10',
    mdr: '0',
    transactionLimit: '50000',
    ...overrides,
  });

  const createMockBiller = (
    channels: UpayPaymentChannel[] = [],
    overrides: Partial<UpayBiller> = {},
  ): UpayBiller => ({
    billerUuid: 'test-biller-uuid',
    billerCode: '1234',
    billerName: 'Test Biller',
    accountNumber: '000000000000',
    paymentChannels: channels,
    ...overrides,
  });

  const createMockResponse = (biller?: UpayBiller): UpayBillerUuidResponse => ({
    billers: biller ? [biller] : [],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentMethodValidationService],
    }).compile();

    service = module.get<PaymentMethodValidationService>(
      PaymentMethodValidationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validatePaymentMethod', () => {
    it('should return error when no biller information found', () => {
      const response = createMockResponse();

      const result = service.validatePaymentMethod(response, 'instapay');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NO_CHANNELS_CONFIGURED');
      expect(result.error?.message).toContain('No biller information found');
    });

    it('should return error when no payment channels configured', () => {
      const biller = createMockBiller([]);
      const response = createMockResponse(biller);

      const result = service.validatePaymentMethod(response, 'instapay');

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('NO_CHANNELS_CONFIGURED');
    });

    it('should return success for valid enabled and availed payment method', () => {
      const channels = [
        createMockChannel({
          name: 'Instapay',
          code: 'INSTAPAY',
          isEnabled: true,
          isAvailed: true,
        }),
      ];
      const biller = createMockBiller(channels);
      const response = createMockResponse(biller);

      const result = service.validatePaymentMethod(response, 'instapay');

      expect(result.isValid).toBe(true);
      expect(result.matchedChannel).toBeDefined();
      expect(result.matchedChannel?.code).toBe('INSTAPAY');
    });

    it('should return error when payment method not found', () => {
      const channels = [
        createMockChannel({
          name: 'UnionBank Online',
          code: 'UB ONLINE',
        }),
      ];
      const biller = createMockBiller(channels);
      const response = createMockResponse(biller);

      const result = service.validatePaymentMethod(response, 'gcash');

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('METHOD_NOT_FOUND');
      expect(result.error?.requestedMethod).toBe('gcash');
    });

    it('should return error when payment method is not enabled', () => {
      const channels = [
        createMockChannel({
          name: 'Instapay',
          code: 'INSTAPAY',
          isEnabled: false,
          isAvailed: true,
        }),
      ];
      const biller = createMockBiller(channels);
      const response = createMockResponse(biller);

      const result = service.validatePaymentMethod(response, 'instapay');

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('METHOD_NOT_ENABLED');
    });

    it('should return error when payment method is not availed', () => {
      const channels = [
        createMockChannel({
          name: 'Instapay',
          code: 'INSTAPAY',
          isEnabled: true,
          isAvailed: false,
        }),
      ];
      const biller = createMockBiller(channels);
      const response = createMockResponse(biller);

      const result = service.validatePaymentMethod(response, 'instapay');

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('METHOD_NOT_AVAILED');
    });

    it('should handle case-insensitive payment method matching', () => {
      const channels = [
        createMockChannel({
          name: 'UnionBank Online',
          code: 'UB ONLINE',
        }),
      ];
      const biller = createMockBiller(channels);
      const response = createMockResponse(biller);

      const result = service.validatePaymentMethod(response, 'UB Online');

      expect(result.isValid).toBe(true);
    });

    it('should validate debit/credit payment method', () => {
      const channels = [
        createMockChannel({
          name: 'Visa/Mastercard',
          code: 'DEBIT/CREDIT',
        }),
      ];
      const biller = createMockBiller(channels);
      const response = createMockResponse(biller);

      const result = service.validatePaymentMethod(response, 'debit/credit');

      expect(result.isValid).toBe(true);
      expect(result.matchedChannel?.code).toBe('DEBIT/CREDIT');
    });

    it('should return available methods in error response', () => {
      const channels = [
        createMockChannel({
          name: 'Instapay',
          code: 'INSTAPAY',
          isEnabled: true,
          isAvailed: true,
        }),
        createMockChannel({
          name: 'UnionBank Online',
          code: 'UB ONLINE',
          isEnabled: true,
          isAvailed: true,
        }),
        createMockChannel({
          name: 'GCash',
          code: 'GCASH',
          isEnabled: false,
          isAvailed: true,
        }),
      ];
      const biller = createMockBiller(channels);
      const response = createMockResponse(biller);

      const result = service.validatePaymentMethod(response, 'paygate');

      expect(result.isValid).toBe(false);
      expect(result.error?.availableMethods).toContain('INSTAPAY');
      expect(result.error?.availableMethods).toContain('UB ONLINE');
      // GCASH should not be in available list since it's not enabled
      expect(result.error?.availableMethods).not.toContain('GCASH');
    });
  });

  describe('validateAgainstBillerChannels', () => {
    it('should match payment method using PAYMENT_METHOD_TO_CHANNEL_CODE mapping', () => {
      const channels = [
        createMockChannel({
          name: 'PCHC Paygate',
          code: 'PCHC PAYGATE',
        }),
      ];
      const biller = createMockBiller(channels);

      const result = service.validateAgainstBillerChannels(biller, 'paygate');

      expect(result.isValid).toBe(true);
      expect(result.matchedChannel?.code).toBe('PCHC PAYGATE');
    });

    it('should fallback to direct name matching', () => {
      const channels = [
        createMockChannel({
          name: 'Custom Payment Method',
          code: 'CUSTOM',
        }),
      ];
      const biller = createMockBiller(channels);

      const result = service.validateAgainstBillerChannels(
        biller,
        'custom payment method',
      );

      expect(result.isValid).toBe(true);
    });

    it('should include channel details in matched response', () => {
      const channels = [
        createMockChannel({
          name: 'Instapay',
          code: 'INSTAPAY',
          chargeTo: 'Biller',
          fee: '15',
          transactionLimit: '100000',
        }),
      ];
      const biller = createMockBiller(channels);

      const result = service.validateAgainstBillerChannels(biller, 'instapay');

      expect(result.isValid).toBe(true);
      expect(result.matchedChannel).toEqual({
        name: 'Instapay',
        code: 'INSTAPAY',
        isEnabled: true,
        isAvailed: true,
        chargeTo: 'Biller',
        fee: '15',
        transactionLimit: '100000',
      });
    });
  });
});
