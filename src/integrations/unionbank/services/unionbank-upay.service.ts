import { Injectable, Logger } from '@nestjs/common';
import { UnionbankEndpoints } from '../../../common/constants';
import { UnionbankApiClient } from '../client/unionbank-api.client';
import {
  CreateUpayTransactionParams,
  createUpayTransactionRequest,
} from '../dto/request/upay-transaction.request.dto';
import {
  UpayStatusResponse,
  UpayTransactionResponse,
} from '../dto/response/upay-transaction.response.dto';
import {
  UpayBillerUuidResponse,
  UpayBillerUuidReferencesResponse,
} from '../dto/response/upay-biller.response.dto';
import type {
  UPayInstapayBankResponse,
  UPayPesonetBankResponse,
} from '../dto/response/upay-bank.response.dto';

@Injectable()
export class UnionbankUpayService {
  private readonly logger = new Logger(UnionbankUpayService.name);

  constructor(private readonly apiClient: UnionbankApiClient) {}

  /**
   * Create a UPay transaction
   * This initiates a payment request that will redirect the user to UnionBank's payment page
   */
  async createTransaction(
    params: CreateUpayTransactionParams,
    requestId?: string,
  ): Promise<UpayTransactionResponse> {
    this.logger.log(`Creating UPay transaction: ${params.senderRefId}`);

    const request = createUpayTransactionRequest(params);

    this.logger.debug('UPay request payload:', JSON.stringify(request));

    const response = await this.apiClient.post<UpayTransactionResponse>(
      UnionbankEndpoints.UPAY_TRANSACTIONS,
      request,
      { requestId },
    );

    this.logger.log(
      `UPay transaction created: ${response.senderRefId}, UUID: ${response.uuid}`,
    );
    return response;
  }

  /**
   * Create a UPay transaction for debit/credit card payment
   * This initiates a payment request that will redirect the user to UnionBank's payment page
   * for credit/debit card processing
   */
  async createDebitCreditCardTransaction(
    params: Omit<CreateUpayTransactionParams, 'paymentMethod'>,
    requestId?: string,
  ): Promise<UpayTransactionResponse> {
    this.logger.log(
      `Creating UPay debit/credit card transaction: ${params.senderRefId}`,
    );

    const requestParams: CreateUpayTransactionParams = {
      ...params,
      paymentMethod: 'debit/credit',
    };

    return this.createTransaction(requestParams, requestId);
  }

  /**
   * Get the status of a UPay transaction
   */
  async getTransactionStatus(
    senderRefId: string,
    requestId?: string,
  ): Promise<UpayStatusResponse> {
    this.logger.log(`Getting UPay transaction status: ${senderRefId}`);

    const endpoint = UnionbankEndpoints.UPAY_STATUS.replace(
      '{senderRefId}',
      senderRefId,
    );

    const response = await this.apiClient.get<UpayStatusResponse>(endpoint, {
      requestId,
    });

    this.logger.log(`UPay transaction status: ${response.status}`);
    return response;
  }

  /**
   * Get privacy policy
   * GET /upay/payments/v1/privacy
   */
  async getPrivacyPolicy(requestId?: string): Promise<unknown> {
    this.logger.log('Getting UPay privacy policy');
    return this.apiClient.get<unknown>(UnionbankEndpoints.UPAY_PRIVACY_POLICY, {
      requestId,
    });
  }

  /**
   * Get biller details by UUID
   * Returns biller information including payment channels, fees, and transaction limits
   */
  async getBillerDetails(
    billerUuid: string,
    requestId?: string,
  ): Promise<UpayBillerUuidResponse> {
    this.logger.log(`Getting biller details for UUID: ${billerUuid}`);

    const endpointTemplate =
      UnionbankEndpoints[
        'UPAY_BILLER_DETAILS' as keyof typeof UnionbankEndpoints
      ];
    if (!endpointTemplate || typeof endpointTemplate !== 'string') {
      throw new Error('UPAY_BILLER_DETAILS endpoint not found');
    }

    const endpoint = endpointTemplate.replace('{billerUuid}', billerUuid);

    const response = await this.apiClient.get<UpayBillerUuidResponse>(
      endpoint,
      { requestId },
    );

    this.logger.log(
      `Biller details retrieved: ${response.billers?.[0]?.billerName || 'Unknown'}`,
    );
    return response;
  }

  /**
   * Get biller references by UUID
   * Returns the list of reference fields defined for the biller with their validations
   */
  async getBillerReferences(
    billerUuid: string,
    requestId?: string,
  ): Promise<UpayBillerUuidReferencesResponse> {
    this.logger.log(`Getting biller references for UUID: ${billerUuid}`);

    const endpointTemplate =
      UnionbankEndpoints[
        'UPAY_BILLER_REFERENCES' as keyof typeof UnionbankEndpoints
      ];
    if (!endpointTemplate || typeof endpointTemplate !== 'string') {
      throw new Error('UPAY_BILLER_REFERENCES endpoint not found');
    }

    const endpoint = endpointTemplate.replace('{billerUuid}', billerUuid);

    const response = await this.apiClient.get<UpayBillerUuidReferencesResponse>(
      endpoint,
      { requestId },
    );

    this.logger.log(
      `Biller references retrieved: ${response.references?.length || 0} references`,
    );
    return response;
  }

  /**
   * Get InstaPay bank list
   * GET /upay/payments/v1/instapay/banks
   */
  async getInstapayBanks(
    requestId?: string,
  ): Promise<UPayInstapayBankResponse> {
    this.logger.log('Getting UPay InstaPay banks');
    return this.apiClient.get<UPayInstapayBankResponse>(
      UnionbankEndpoints.UPAY_INSTAPAY_BANKS,
      { requestId },
    );
  }

  /**
   * Get PESONet bank list
   * GET /upay/payments/v1/pesonet/banks
   */
  async getPesonetBanks(requestId?: string): Promise<UPayPesonetBankResponse> {
    this.logger.log('Getting UPay PESONet banks');
    return this.apiClient.get<UPayPesonetBankResponse>(
      UnionbankEndpoints.UPAY_PESONET_BANKS,
      { requestId },
    );
  }
}
