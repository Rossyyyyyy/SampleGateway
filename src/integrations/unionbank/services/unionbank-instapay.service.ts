import { Injectable, Logger } from '@nestjs/common';
import { UnionbankEndpoints } from '../../../common/constants';
import { UnionbankApiClient } from '../client/unionbank-api.client';
import {
  CreateInstapayTransferParams,
  createInstapayTransferRequest,
} from '../dto/request/instapay-transfer.request.dto';
import {
  InstapayStatusResponse,
  InstapayTransferResponse,
} from '../dto/response/instapay-transfer.response.dto';

@Injectable()
export class UnionbankInstapayService {
  private readonly logger = new Logger(UnionbankInstapayService.name);

  constructor(private readonly apiClient: UnionbankApiClient) {}

  async createTransfer(
    params: CreateInstapayTransferParams,
    requestId?: string,
  ): Promise<InstapayTransferResponse> {
    this.logger.log(`Creating InstaPay transfer: ${params.senderRefId}`);

    const request = createInstapayTransferRequest(params);

    const response = await this.apiClient.post<InstapayTransferResponse>(
      UnionbankEndpoints.INSTAPAY_TRANSFER,
      request,
      { requestId },
    );

    this.logger.log(`InstaPay transfer created: ${response.ubpTranId}`);
    return response;
  }

  async getTransferStatus(
    referenceId: string,
    requestId?: string,
  ): Promise<InstapayStatusResponse> {
    this.logger.log(`Getting InstaPay transfer status: ${referenceId}`);

    const endpoint = UnionbankEndpoints.INSTAPAY_STATUS.replace(
      '{referenceId}',
      referenceId,
    );

    const response = await this.apiClient.get<InstapayStatusResponse>(
      endpoint,
      { requestId },
    );

    this.logger.log(`InstaPay transfer status: ${response.status}`);
    return response;
  }
}
