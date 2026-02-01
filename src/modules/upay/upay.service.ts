import { Injectable, Logger } from '@nestjs/common';
import { generateTransactionReference } from '../../common/utils/reference-generator.util';
import {
  ReferenceValidationException,
  PaymentMethodValidationException,
} from '../../common/exceptions';
import { UnionbankUpayService } from '../../integrations/unionbank';
import {
  ReferenceValidationService,
  PaymentMethodValidationService,
} from '../../integrations/unionbank/validators';
import { CreateUpayTransactionParams } from '../../integrations/unionbank/dto/request/upay-transaction.request.dto';
import {
  CreateUpayDebitCreditCardTransactionDto,
  CreateUpayTransactionDto,
  UpayTransactionResponseDto,
  UpayStatusResponseDto,
  UpayBillerResponseDto,
  UpayBillerReferencesResponseDto,
  UpayBillerUuidStatusResponseDto,
  UpayInstapayBankResponseDto,
  UpayPesonetBankResponseDto,
} from './dto/upay.dto';

@Injectable()
export class UpayService {
  private readonly logger = new Logger(UpayService.name);

  constructor(
    private readonly unionbankUpayService: UnionbankUpayService,
    private readonly referenceValidationService: ReferenceValidationService,
    private readonly paymentMethodValidationService: PaymentMethodValidationService,
  ) {}

  /**
   * Create a UPay transaction with reference and payment method validation
   */
  async createTransaction(
    dto: CreateUpayTransactionDto,
    requestId?: string,
  ): Promise<UpayTransactionResponseDto> {
    const senderRefId = generateTransactionReference();
    this.logger.log(`Creating UPay transaction: ${senderRefId}`);

    // Build references from DTO for validation
    const references = this.buildReferencesForValidation(dto);

    // Validate references against biller definitions
    await this.validateTransactionReferences(
      dto.billerUuid,
      references,
      requestId,
    );

    // Validate payment method if provided
    if (dto.paymentMethod) {
      await this.validatePaymentMethod(
        dto.billerUuid,
        dto.paymentMethod,
        requestId,
      );
    }

    const params: CreateUpayTransactionParams = {
      senderRefId,
      billerUuid: dto.billerUuid,
      emailAddress: dto.emailAddress,
      countryCode: dto.countryCode,
      mobileNumber: dto.mobileNumber,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      skipWhitelabelPage: dto.skipWhitelabelPage ?? false,
      callbackUrl: dto.callbackUrl,
      backRedir: dto.backRedir,
      firstName: dto.firstName,
      lastName: dto.lastName,
      userRef: dto.userRef,
      accountNumber: dto.accountNumber,
      additionalRef: dto.additionalRef,
    };

    const response = await this.unionbankUpayService.createTransaction(
      params,
      requestId,
    );

    return {
      code: response.code,
      senderRefId: response.senderRefId,
      uuid: response.uuid,
      state: response.state,
      transactionId: response.transactionId,
      qrCode: response.qrCode,
      message: response.message,
      paymentUrl: response.paymentUrl,
      status: response.status,
    };
  }

  /**
   * Create a debit/credit card transaction with reference and payment method validation
   */
  async createDebitCreditCardTransaction(
    dto: CreateUpayDebitCreditCardTransactionDto,
    requestId?: string,
  ): Promise<UpayTransactionResponseDto> {
    const senderRefId = generateTransactionReference();
    this.logger.log(
      `Creating UPay debit/credit card transaction: ${senderRefId}`,
    );

    // Build references from DTO for validation
    const references = this.buildReferencesForValidation(dto);

    // Validate references against biller definitions
    await this.validateTransactionReferences(
      dto.billerUuid,
      references,
      requestId,
    );

    // Validate debit/credit payment method is enabled for this biller
    await this.validatePaymentMethod(dto.billerUuid, 'debit/credit', requestId);

    const params: Omit<CreateUpayTransactionParams, 'paymentMethod'> = {
      senderRefId,
      billerUuid: dto.billerUuid,
      emailAddress: dto.emailAddress,
      countryCode: dto.countryCode,
      mobileNumber: dto.mobileNumber,
      amount: dto.amount,
      skipWhitelabelPage: dto.skipWhitelabelPage ?? false,
      callbackUrl: dto.callbackUrl,
      backRedir: dto.backRedir,
      firstName: dto.firstName,
      lastName: dto.lastName,
      userRef: dto.userRef,
      accountNumber: dto.accountNumber,
      additionalRef: dto.additionalRef,
    };

    const response =
      await this.unionbankUpayService.createDebitCreditCardTransaction(
        params,
        requestId,
      );

    return {
      code: response.code,
      senderRefId: response.senderRefId,
      uuid: response.uuid,
      state: response.state,
      transactionId: response.transactionId,
      qrCode: response.qrCode,
      message: response.message,
      paymentUrl: response.paymentUrl,
      status: response.status,
    };
  }

  /**
   * Get status by biller UUID (transactions status with biller post status)
   */
  async getBillerUuidStatus(
    billerUuid: string,
    requestId?: string,
  ): Promise<UpayBillerUuidStatusResponseDto> {
    this.logger.log('Getting UPay status for biller UUID: ${billerUuid}');

    const response = await this.unionbankUpayService.getBillerUuidStatus(
      billerUuid,
      requestId,
    );

    return {
      code: response.code,
      state: response.state,
      uuid: response.uuid,
      data: response.data ?? [],
    };
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    senderRefId: string,
    requestId?: string,
  ): Promise<UpayStatusResponseDto> {
    this.logger.log(`Getting UPay transaction status: ${senderRefId}`);

    const response = await this.unionbankUpayService.getTransactionStatus(
      senderRefId,
      requestId,
    );

    return {
      senderRefId: response.senderRefId,
      uuid: response.uuid,
      status: response.status,
      amount: response.amount,
      paidAt: response.paidAt,
      paymentMethod: response.paymentMethod,
      message: response.message,
    };
  }

  /**
   * Get privacy policy
   */
  async getPrivacyPolicy(requestId?: string): Promise<unknown> {
    this.logger.log('Getting UPay privacy policy');
    return this.unionbankUpayService.getPrivacyPolicy(requestId);
  }

  /**
   * Get biller details by UUID
   */
  async getBillerDetails(
    billerUuid: string,
    requestId?: string,
  ): Promise<UpayBillerResponseDto> {
    this.logger.log(`Getting biller details for UUID: ${billerUuid}`);

    const response = await this.unionbankUpayService.getBillerDetails(
      billerUuid,
      requestId,
    );

    return {
      billers: response.billers,
    };
  }

  /**
   * Get biller references by UUID
   */
  async getBillerReferences(
    billerUuid: string,
    requestId?: string,
  ): Promise<UpayBillerReferencesResponseDto> {
    this.logger.log(`Getting biller references for UUID: ${billerUuid}`);

    const response = await this.unionbankUpayService.getBillerReferences(
      billerUuid,
      requestId,
    );

    return {
      references: response.references,
    };
  }

  /**
   * Get InstaPay banks
   */
  async getInstapayBanks(
    requestId?: string,
  ): Promise<UpayInstapayBankResponseDto> {
    this.logger.log('Getting UPay InstaPay banks');
    const response =
      await this.unionbankUpayService.getInstapayBanks(requestId);
    return {
      records: response.records ?? [],
    };
  }

  /**
   * Get PESONet banks
   */
  async getPesonetBanks(
    requestId?: string,
  ): Promise<UpayPesonetBankResponseDto> {
    this.logger.log('Getting UPay PESONet banks');
    const response = await this.unionbankUpayService.getPesonetBanks(requestId);
    return {
      records: response.records,
      record: response.record,
    };
  }

  /**
   * Builds the references array for validation from DTO fields.
   * Maps standard DTO fields to their corresponding reference indices.
   *
   * @param dto - Transaction DTO with reference fields
   * @returns Array of reference inputs for validation
   */
  private buildReferencesForValidation(
    dto: CreateUpayTransactionDto | CreateUpayDebitCreditCardTransactionDto,
  ): Array<{ index: number | string; value: string }> {
    const references: Array<{ index: number | string; value: string }> = [];

    // Map standard DTO fields to reference indices
    // Index mapping based on typical UPay biller configuration:
    // 1 = First Name, 2 = Account Number, 3 = User Ref, 4 = Last Name, 5 = First Name (Repeat)
    if (dto.firstName) {
      references.push({ index: 1, value: dto.firstName });
    }
    if (dto.accountNumber !== undefined) {
      references.push({ index: 2, value: dto.accountNumber ?? '' });
    }
    if (dto.userRef !== undefined) {
      references.push({ index: 3, value: dto.userRef ?? '' });
    }
    if (dto.lastName) {
      references.push({ index: 4, value: dto.lastName });
    }
    // Index 5 is typically also firstName (as per createUpayTransactionRequest)
    if (dto.firstName) {
      references.push({ index: 5, value: dto.firstName });
    }

    // Include custom references from DTO if provided
    if ('references' in dto && dto.references) {
      for (const ref of dto.references) {
        // Skip if already added by standard fields
        const exists = references.some(
          (r) => String(r.index) === String(ref.index),
        );
        if (!exists) {
          references.push({ index: ref.index, value: ref.value });
        }
      }
    }

    return references;
  }

  /**
   * Validates transaction references against biller definitions.
   * Fetches biller reference definitions and validates the provided references.
   *
   * @param billerUuid - Biller UUID
   * @param references - References to validate
   * @param requestId - Optional request ID for logging
   * @throws ReferenceValidationException if validation fails
   */
  private async validateTransactionReferences(
    billerUuid: string,
    references: Array<{ index: number | string; value: string }>,
    requestId?: string,
  ): Promise<void> {
    this.logger.debug(
      `Validating ${references.length} references for biller: ${billerUuid}`,
    );

    // Fetch biller reference definitions
    const billerReferences =
      await this.unionbankUpayService.getBillerReferences(
        billerUuid,
        requestId,
      );

    // Validate references
    const validationResult = this.referenceValidationService.validateReferences(
      billerReferences.references ?? [],
      references,
    );

    if (!validationResult.isValid) {
      this.logger.warn(
        `Reference validation failed for biller ${billerUuid}: ${validationResult.errors.length} errors`,
      );
      throw new ReferenceValidationException([...validationResult.errors]);
    }

    this.logger.debug(`Reference validation passed for biller: ${billerUuid}`);
  }

  /**
   * Validates a payment method against the biller's enabled/availed channels.
   * Fetches biller details and validates the payment method is available.
   *
   * @param billerUuid - Biller UUID
   * @param paymentMethod - Payment method to validate (e.g., 'instapay', 'ub online')
   * @param requestId - Optional request ID for logging
   * @throws PaymentMethodValidationException if payment method is not valid
   */
  private async validatePaymentMethod(
    billerUuid: string,
    paymentMethod: string,
    requestId?: string,
  ): Promise<void> {
    this.logger.debug(
      `Validating payment method '${paymentMethod}' for biller: ${billerUuid}`,
    );

    // Fetch biller details including payment channels
    const billerDetails = await this.unionbankUpayService.getBillerDetails(
      billerUuid,
      requestId,
    );

    // Validate payment method against biller's channels
    const validationResult =
      this.paymentMethodValidationService.validatePaymentMethod(
        billerDetails,
        paymentMethod,
      );

    if (!validationResult.isValid && validationResult.error) {
      this.logger.warn(
        `Payment method validation failed for biller ${billerUuid}: ${validationResult.error.message}`,
      );
      throw new PaymentMethodValidationException(validationResult.error);
    }

    this.logger.debug(
      `Payment method '${paymentMethod}' validated successfully for biller: ${billerUuid}`,
    );
  }
}
