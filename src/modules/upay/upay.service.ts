import { Injectable, Logger } from '@nestjs/common';
import { generateTransactionReference } from '../../common/utils/reference-generator.util';
import { UnionbankUpayService } from '../../integrations/unionbank';
import { CreateUpayTransactionParams } from '../../integrations/unionbank/dto/request/upay-transaction.request.dto';
import {
  CreateUpayDebitCreditCardTransactionDto,
  CreateUpayTransactionDto,
  UpayTransactionResponseDto,
  UpayStatusResponseDto,
  UpayBillerResponseDto,
  UpayBillerReferencesResponseDto,
  UpayInstapayBankResponseDto,
  UpayPesonetBankResponseDto,
} from './dto/upay.dto';

@Injectable()
export class UpayService {
  private readonly logger = new Logger(UpayService.name);

  constructor(private readonly unionbankUpayService: UnionbankUpayService) {}

  /**
   * Create a UPay transaction
   */
  async createTransaction(
    dto: CreateUpayTransactionDto,
    requestId?: string,
  ): Promise<UpayTransactionResponseDto> {
    const senderRefId = generateTransactionReference();
    this.logger.log(`Creating UPay transaction: ${senderRefId}`);

    const params: CreateUpayTransactionParams = {
      senderRefId,
      emailAddress: dto.emailAddress,
      mobileNumber: dto.mobileNumber,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      skipWhitelabelPage: dto.skipWhitelabelPage ?? false,
      callbackUrl: dto.callbackUrl,
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
   * Create a debit/credit card transaction
   */
  async createDebitCreditCardTransaction(
    dto: CreateUpayDebitCreditCardTransactionDto,
    requestId?: string,
  ): Promise<UpayTransactionResponseDto> {
    const senderRefId = generateTransactionReference();
    this.logger.log(
      `Creating UPay debit/credit card transaction: ${senderRefId}`,
    );

    const params: Omit<CreateUpayTransactionParams, 'paymentMethod'> = {
      senderRefId,
      emailAddress: dto.emailAddress,
      mobileNumber: dto.mobileNumber,
      amount: dto.amount,
      skipWhitelabelPage: dto.skipWhitelabelPage ?? false,
      callbackUrl: dto.callbackUrl,
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
}
