import { Test, TestingModule } from '@nestjs/testing';
import { UnionbankUpayService } from './unionbank-upay.service';
import { UnionbankApiClient } from '../client/unionbank-api.client';
import {
  UpayTransactionResponse,
  UpayErrorResponse,
  UpayStatusResponse,
} from '../dto/response/upay-transaction.response.dto';
import { UnionbankApiException } from '../../../common/exceptions';
import { UnionbankEndpoints } from '../../../common/constants';

describe('UnionbankUpayService', () => {
  let service: UnionbankUpayService;
  const mockPost = jest.fn();
  const mockGet = jest.fn();

  const mockApiClient = {
    post: mockPost,
    get: mockGet,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnionbankUpayService,
        {
          provide: UnionbankApiClient,
          useValue: mockApiClient,
        },
      ],
    }).compile();

    service = module.get<UnionbankUpayService>(UnionbankUpayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
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

    describe('UPAY-000 to UPAY-004: Front End Reference Validation', () => {
      it('UPAY-000: should include all required references in request', async () => {
        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: baseParams.senderRefId,
          uuid: 'test-uuid-123',
          state: 'Sent for Processing',
          transactionId: 'TXN-123',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(baseParams);

        expect(mockPost).toHaveBeenCalledWith(
          UnionbankEndpoints.UPAY_TRANSACTIONS,
          expect.objectContaining({
            senderRefId: baseParams.senderRefId,
            emailAddress: baseParams.emailAddress,
            mobileNumber: baseParams.mobileNumber,
            amount: baseParams.amount,
            references: expect.arrayContaining([
              { index: 1, value: baseParams.firstName },
              { index: 2, value: baseParams.accountNumber },
              { index: 3, value: baseParams.userRef },
              { index: 4, value: baseParams.lastName },
            ]) as Array<{ index: number | string; value: string }>,
          }),
          { requestId: undefined },
        );
        expect(result).toEqual(mockResponse);
      });

      it('UPAY-001: should require all mandatory references', async () => {
        const paramsWithoutFirstName = {
          ...baseParams,
          firstName: '',
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: 'TF',
              description: 'Failed to process request',
              details: {
                message: 'The PAYOR FIRST NAME is a required field.',
                senderRefId: paramsWithoutFirstName.senderRefId,
              },
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Validation failed', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        await expect(
          service.createTransaction(paramsWithoutFirstName),
        ).rejects.toThrow(UnionbankApiException);
      });

      it('UPAY-002: should validate all references are correct', async () => {
        const paramsWithInvalidEmail = {
          ...baseParams,
          emailAddress: 'invalid-email',
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: -1,
              description: 'Missing/Invalid Parameters.',
              parameters: [
                {
                  field: 'emailAddress',
                  message: 'You entered invalid email address',
                },
              ],
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Validation failed', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        await expect(
          service.createTransaction(paramsWithInvalidEmail),
        ).rejects.toThrow(UnionbankApiException);
      });

      it('UPAY-003: should handle optional references correctly', async () => {
        const paramsWithoutOptional = {
          senderRefId: 'TEST-002',
          emailAddress: 'test@example.com',
          amount: 1000,
          callbackUrl: 'https://example.com/callback',
          firstName: 'John',
          lastName: 'Doe',
          // accountNumber and userRef are optional
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: paramsWithoutOptional.senderRefId,
          uuid: 'test-uuid-456',
          state: 'Sent for Processing',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(paramsWithoutOptional);

        expect(mockPost).toHaveBeenCalledWith(
          UnionbankEndpoints.UPAY_TRANSACTIONS,
          expect.objectContaining({
            references: expect.arrayContaining([
              { index: 2, value: '' }, // accountNumber empty
              { index: 3, value: '' }, // userRef empty
            ]) as Array<{ index: number | string; value: string }>,
          }),
          { requestId: undefined },
        );
        expect(result).toEqual(mockResponse);
      });

      it('UPAY-004: should reject incorrect references', async () => {
        const paramsWithInvalidRef = {
          ...baseParams,
          accountNumber: '<script>alert("xss")</script>', // Invalid characters
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: -1,
              description: 'Failed to process request',
              details: {
                message:
                  'references.value you entered has invalid character(s).',
              },
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Validation failed', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        await expect(
          service.createTransaction(paramsWithInvalidRef),
        ).rejects.toThrow(UnionbankApiException);
      });
    });

    describe('UPAY-005 to UPAY-013: Visa/Mastercard Successful Transaction', () => {
      it('UPAY-005: should create debit/credit card transaction successfully', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'debit/credit' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-visa',
          state: 'Sent for Processing',
          transactionId: 'TXN-VISA-001',
          message:
            'https://ubotpsentry-tst1.outsystemsenterprise.com/UPAY/WhiteLabel.aspx?BillerUuid=xxx&Cipher=yyy',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createDebitCreditCardTransaction(params);

        expect(mockPost).toHaveBeenCalledWith(
          UnionbankEndpoints.UPAY_TRANSACTIONS,
          expect.objectContaining({
            paymentMethod: 'debit/credit',
          }),
          { requestId: undefined },
        );
        expect(result).toEqual(mockResponse);
        expect(result.message).toBeDefined();
        expect(result.message).toContain('https://');
      });

      it('UPAY-008: should return redirect URL for acknowledgement page', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'debit/credit' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-visa',
          state: 'Sent for Processing',
          message:
            'https://ubotpsentry-tst1.outsystemsenterprise.com/UPAY/WhiteLabel.aspx?BillerUuid=xxx&Cipher=yyy',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createDebitCreditCardTransaction(params);

        expect(result.message).toBeDefined();
        expect(result.message).toContain('/UPAY/');
        expect(result.code).toBe('SP');
      });

      it('UPAY-009: should include correct transaction details', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'debit/credit' as const,
          amount: 1500,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-visa',
          state: 'Sent for Processing',
          transactionId: 'TXN-VISA-002',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createDebitCreditCardTransaction(params);

        expect(result.senderRefId).toBe(params.senderRefId);
        expect(result.transactionId).toBeDefined();
        expect(result.uuid).toBeDefined();
      });
    });

    describe('UPAY-021 to UPAY-030: UB Online Successful Transaction', () => {
      it('UPAY-021: should create UB Online transaction successfully', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'ub online' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: '200',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-ub',
          state: 'Sent for Processing',
          transactionId: 'TXN-UB-001',
          message:
            'https://ubotpsentry-tst1.outsystemsenterprise.com/UPAY/Redirect.aspx?BillerUuid=xxx&Cipher=yyy',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(mockPost).toHaveBeenCalledWith(
          UnionbankEndpoints.UPAY_TRANSACTIONS,
          expect.objectContaining({
            paymentMethod: 'ub online',
          }),
          { requestId: undefined },
        );
        expect(result).toEqual(mockResponse);
        expect(result.message).toContain('/UPAY/Redirect.aspx');
      });

      it('UPAY-022: should handle realtime debit for UB Online', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'ub online' as const,
          amount: 2000,
        };

        const mockResponse: UpayTransactionResponse = {
          code: '200',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-ub',
          state: 'Sent for Processing',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result.code).toBe('200');
        expect(result.state).toBe('Sent for Processing');
      });

      it('UPAY-024: should include correct details in response', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'ub online' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: '200',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-ub',
          state: 'Sent for Processing',
          transactionId: 'TXN-UB-002',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result.senderRefId).toBe(params.senderRefId);
        expect(result.transactionId).toBeDefined();
        expect(result.uuid).toBeDefined();
      });
    });

    describe('UPAY-031 to UPAY-035: UB Online Insufficient Balance', () => {
      it('UPAY-031: should handle insufficient balance error', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'ub online' as const,
          amount: 50000,
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: 'TF',
              description: 'Failed to process request',
              details: {
                message: 'Insufficient balance',
                senderRefId: params.senderRefId,
              },
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Insufficient balance', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        await expect(service.createTransaction(params)).rejects.toThrow(
          UnionbankApiException,
        );
      });

      it('UPAY-033: should return error message for insufficient balance', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'ub online' as const,
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: 'TF',
              description: 'Failed to process request',
              details: {
                message: 'Balance is insufficient',
                senderRefId: params.senderRefId,
              },
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Balance is insufficient', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        try {
          await service.createTransaction(params);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(UnionbankApiException);
          if (error instanceof UnionbankApiException) {
            expect(error.message).toContain('insufficient');
          }
        }
      });
    });

    describe('UPAY-046 to UPAY-054: InstaPay Successful Transaction', () => {
      it('UPAY-046: should create InstaPay transaction successfully', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'instapay' as const,
          skipWhitelabelPage: true,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-instapay',
          state: 'Sent for Processing',
          transactionId: '8834702211220159287',
          qrCode:
            '00020101021227660012com.p2pqrpay0111UB-PHPHMMXXX02089996440304198834702211220159287520460165303608540501.005802PH5910BLOOM-SOLUT6009PASIGCITY63048E10',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(mockPost).toHaveBeenCalledWith(
          UnionbankEndpoints.UPAY_TRANSACTIONS,
          expect.objectContaining({
            paymentMethod: 'instapay',
            skipWhitelabelPage: 'true',
          }),
          { requestId: undefined },
        );
        expect(result).toEqual(mockResponse);
        expect(result.qrCode).toBeDefined();
        expect(result.transactionId).toBeDefined();
      });

      it('UPAY-048: should include correct details in InstaPay response', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'instapay' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-instapay',
          state: 'Sent for Processing',
          transactionId: 'TXN-INSTAPAY-001',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result.senderRefId).toBe(params.senderRefId);
        expect(result.transactionId).toBeDefined();
        expect(result.uuid).toBeDefined();
      });
    });

    describe('UPAY-055 to UPAY-061: InstaPay No Payment', () => {
      it('UPAY-055: should handle InstaPay transaction with no payment', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'instapay' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-instapay',
          state: 'Sent for Processing',
          transactionId: 'TXN-INSTAPAY-NO-PAY',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result).toBeDefined();
        expect(result.code).toBe('SP');
      });
    });

    describe('UPAY-062 to UPAY-070: InstaPay Underpayment', () => {
      it('UPAY-062: should handle InstaPay underpayment scenario', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'instapay' as const,
          amount: 115, // Total amount with fee
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-instapay',
          state: 'Sent for Processing',
          transactionId: 'TXN-INSTAPAY-UNDER',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result).toBeDefined();
        expect(result.code).toBe('SP');
      });
    });

    describe('UPAY-071 to UPAY-079: InstaPay Overpayment', () => {
      it('UPAY-071: should handle InstaPay overpayment scenario', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'instapay' as const,
          amount: 115, // Total amount with fee, but actual payment might be 120
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-instapay',
          state: 'Sent for Processing',
          transactionId: 'TXN-INSTAPAY-OVER',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result).toBeDefined();
        expect(result.code).toBe('SP');
      });
    });

    describe('UPAY-080 to UPAY-088: InstaPay Multiple Payments', () => {
      it('UPAY-080: should handle multiple payments with same QR/reference', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'instapay' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-instapay',
          state: 'Sent for Processing',
          transactionId: 'TXN-INSTAPAY-MULTI',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result).toBeDefined();
        expect(result.code).toBe('SP');
      });
    });

    describe('UPAY-089 to UPAY-098: PCHC PayGate Successful Transaction', () => {
      it('UPAY-089: should create PCHC PayGate transaction successfully', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'paygate' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-paygate',
          state: 'Sent for Processing',
          transactionId: 'c4fdf908-43ea-6913-b5fa-7e64625aa859',
          message:
            'https://pg-payment.pchcdev.com/callback/c4fdf908-43ea-6913-b5fa-7e64625aa859',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(mockPost).toHaveBeenCalledWith(
          UnionbankEndpoints.UPAY_TRANSACTIONS,
          expect.objectContaining({
            paymentMethod: 'paygate',
          }),
          { requestId: undefined },
        );
        expect(result).toEqual(mockResponse);
        expect(result.message).toBeDefined();
        expect(result.message).toContain('pchc');
      });

      it('UPAY-092: should include correct details in PayGate response', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'paygate' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-paygate',
          state: 'Sent for Processing',
          transactionId: 'TXN-PAYGATE-001',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result.senderRefId).toBe(params.senderRefId);
        expect(result.transactionId).toBeDefined();
        expect(result.uuid).toBeDefined();
      });
    });

    describe('UPAY-103 to UPAY-114: eWallet Successful Transaction', () => {
      it('UPAY-103: should create eWallet transaction successfully', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'gcash' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-ewallet',
          state: 'Sent for Processing',
          transactionId: 'TXN-EWALLET-001',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(mockPost).toHaveBeenCalledWith(
          UnionbankEndpoints.UPAY_TRANSACTIONS,
          expect.objectContaining({
            paymentMethod: 'gcash',
          }),
          { requestId: undefined },
        );
        expect(result).toEqual(mockResponse);
      });

      it('UPAY-107: should include correct details in eWallet response', async () => {
        const params = {
          ...baseParams,
          paymentMethod: 'grabpay' as const,
        };

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid-ewallet',
          state: 'Sent for Processing',
          transactionId: 'TXN-EWALLET-002',
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await service.createTransaction(params);

        expect(result.senderRefId).toBe(params.senderRefId);
        expect(result.transactionId).toBeDefined();
        expect(result.uuid).toBeDefined();
      });
    });

    describe('Error Handling', () => {
      it('should handle duplicate senderRefId error (-20)', async () => {
        const params = {
          ...baseParams,
          senderRefId: 'DUPLICATE-001',
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: -20,
              description: 'Failed to process request',
              details: {
                senderRefId: params.senderRefId,
                message: 'senderRefId already exist',
                uuid: 'test-uuid-error',
              },
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Duplicate transaction', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        await expect(service.createTransaction(params)).rejects.toThrow(
          UnionbankApiException,
        );
      });

      it('should handle network error (NC)', async () => {
        const params = {
          ...baseParams,
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: 'NC',
              description: 'Network Issue - Core',
              details: {
                message: '',
                uuid: 'test-uuid-error',
              },
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Network error', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 500,
            responseBody: mockError,
          }),
        );

        await expect(service.createTransaction(params)).rejects.toThrow(
          UnionbankApiException,
        );
      });

      it('should handle account not active error (TF)', async () => {
        const params = {
          ...baseParams,
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: 'TF',
              description: 'Account is not active',
              details: {
                message: 'Failed to process request',
                uuid: 'test-uuid-error',
              },
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Account not active', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        await expect(service.createTransaction(params)).rejects.toThrow(
          UnionbankApiException,
        );
      });

      it('should handle maximum amount validation error', async () => {
        const params = {
          ...baseParams,
          amount: 100000, // Exceeds maximum
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: 'TF',
              description: 'Failed to process request',
              details: {
                message: 'Maximum amount is set at 50000',
                uuid: 'test-uuid-error',
              },
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Amount exceeds maximum', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        await expect(service.createTransaction(params)).rejects.toThrow(
          UnionbankApiException,
        );
      });

      it('should handle invalid date format error', async () => {
        const params = {
          ...baseParams,
        };

        const mockError: UpayErrorResponse = {
          errors: [
            {
              code: -1,
              description: 'Missing/Invalid Parameters.',
              parameters: [
                {
                  field: 'tranRequestDate',
                  message: 'You entered invalid date',
                },
              ],
            },
          ],
        };

        mockPost.mockRejectedValue(
          new UnionbankApiException('Invalid date', {
            endpoint: UnionbankEndpoints.UPAY_TRANSACTIONS,
            statusCode: 400,
            responseBody: mockError,
          }),
        );

        await expect(service.createTransaction(params)).rejects.toThrow(
          UnionbankApiException,
        );
      });
    });

    describe('Request ID handling', () => {
      it('should pass requestId to API client when provided', async () => {
        const params = {
          ...baseParams,
        };
        const requestId = 'custom-request-id-123';

        const mockResponse: UpayTransactionResponse = {
          code: 'SP',
          senderRefId: params.senderRefId,
          uuid: 'test-uuid',
          state: 'Sent for Processing',
        };

        mockPost.mockResolvedValue(mockResponse);

        await service.createTransaction(params, requestId);

        expect(mockPost).toHaveBeenCalledWith(
          UnionbankEndpoints.UPAY_TRANSACTIONS,
          expect.any(Object),
          { requestId },
        );
      });
    });
  });

  describe('createDebitCreditCardTransaction', () => {
    it('should set paymentMethod to debit/credit', async () => {
      const params = {
        senderRefId: 'TEST-CARD-001',
        emailAddress: 'test@example.com',
        amount: 1000,
        callbackUrl: 'https://example.com/callback',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockResponse: UpayTransactionResponse = {
        code: 'SP',
        senderRefId: params.senderRefId,
        uuid: 'test-uuid-card',
        state: 'Sent for Processing',
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await service.createDebitCreditCardTransaction(params);

      expect(mockPost).toHaveBeenCalledWith(
        UnionbankEndpoints.UPAY_TRANSACTIONS,
        expect.objectContaining({
          paymentMethod: 'debit/credit',
        }),
        { requestId: undefined },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTransactionStatus', () => {
    it('should get transaction status successfully', async () => {
      const senderRefId = 'TEST-001';
      const mockResponse: UpayStatusResponse = {
        senderRefId,
        uuid: 'test-uuid',
        status: 'SUCCESS',
        amount: 1000,
        paidAt: '2024-01-01T12:00:00Z',
        paymentMethod: 'paygate',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await service.getTransactionStatus(senderRefId);

      expect(mockGet).toHaveBeenCalledWith(
        UnionbankEndpoints.UPAY_STATUS.replace('{senderRefId}', senderRefId),
        { requestId: undefined },
      );
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('SUCCESS');
    });

    it('should handle PENDING status', async () => {
      const senderRefId = 'TEST-002';
      const mockResponse: UpayStatusResponse = {
        senderRefId,
        uuid: 'test-uuid',
        status: 'PENDING',
        amount: 1000,
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await service.getTransactionStatus(senderRefId);

      expect(result.status).toBe('PENDING');
    });

    it('should handle FAILED status', async () => {
      const senderRefId = 'TEST-003';
      const mockResponse: UpayStatusResponse = {
        senderRefId,
        uuid: 'test-uuid',
        status: 'FAILED',
        amount: 1000,
        message: 'Transaction failed',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await service.getTransactionStatus(senderRefId);

      expect(result.status).toBe('FAILED');
      expect(result.message).toBeDefined();
    });

    it('should handle EXPIRED status', async () => {
      const senderRefId = 'TEST-004';
      const mockResponse: UpayStatusResponse = {
        senderRefId,
        uuid: 'test-uuid',
        status: 'EXPIRED',
        amount: 1000,
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await service.getTransactionStatus(senderRefId);

      expect(result.status).toBe('EXPIRED');
    });

    it('should pass requestId to API client when provided', async () => {
      const senderRefId = 'TEST-005';
      const requestId = 'custom-request-id-456';
      const mockResponse: UpayStatusResponse = {
        senderRefId,
        uuid: 'test-uuid',
        status: 'SUCCESS',
        amount: 1000,
      };

      mockGet.mockResolvedValue(mockResponse);

      await service.getTransactionStatus(senderRefId, requestId);

      expect(mockGet).toHaveBeenCalledWith(
        UnionbankEndpoints.UPAY_STATUS.replace('{senderRefId}', senderRefId),
        { requestId },
      );
    });

    it('should handle API errors when getting status', async () => {
      const senderRefId = 'TEST-006';

      mockGet.mockRejectedValue(
        new UnionbankApiException('Transaction not found', {
          endpoint: UnionbankEndpoints.UPAY_STATUS.replace(
            '{senderRefId}',
            senderRefId,
          ),
          statusCode: 404,
        }),
      );

      await expect(service.getTransactionStatus(senderRefId)).rejects.toThrow(
        UnionbankApiException,
      );
    });
  });
});
