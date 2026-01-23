import { Injectable, Logger } from '@nestjs/common';
import { UnionbankEndpoints } from '../../../common/constants';
import { UnionbankApiClient } from '../client/unionbank-api.client';
import {
  CreatePesonetTransferParams,
  createPesonetTransferRequest,
} from '../dto/request/pesonet-transfer.request.dto';
import {
  PesonetStatusResponse,
  PesonetTransferResponse,
} from '../dto/response/pesonet-transfer.response.dto';

@Injectable()
export class UnionbankPesonetService {
  private readonly logger = new Logger(UnionbankPesonetService.name);

  constructor(private readonly apiClient: UnionbankApiClient) {}

  async createTransfer(
    params: CreatePesonetTransferParams,
    requestId?: string,
  ): Promise<PesonetTransferResponse> {
    this.logger.log(`Creating PESONet transfer: ${params.senderRefId}`);

    const request = createPesonetTransferRequest(params);

    const response = await this.apiClient.post<PesonetTransferResponse>(
      UnionbankEndpoints.PESONET_TRANSFER,
      request,
      { requestId },
    );

    this.logger.log(`PESONet transfer created: ${response.ubpTranId}`);
    return response;
  }

  async getTransferStatus(
    referenceId: string,
    requestId?: string,
  ): Promise<PesonetStatusResponse> {
    this.logger.log(`Getting PESONet transfer status: ${referenceId}`);

    const endpoint = UnionbankEndpoints.PESONET_STATUS.replace(
      '{referenceId}',
      referenceId,
    );

    const response = await this.apiClient.get<PesonetStatusResponse>(endpoint, {
      requestId,
    });

    this.logger.log(`PESONet transfer status: ${response.status}`);
    return response;
  }
}
