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
}
