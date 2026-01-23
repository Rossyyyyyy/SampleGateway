import { Injectable, Logger } from '@nestjs/common';
import { UnionbankEndpoints } from '../../../common/constants';
import { UnionbankApiClient } from '../client/unionbank-api.client';
import {
  AccountBalanceRequest,
  AccountInquiryRequest,
} from '../dto/request/account-inquiry.request.dto';
import {
  AccountBalanceResponse,
  AccountInquiryResponse,
} from '../dto/response/account-inquiry.response.dto';

@Injectable()
export class UnionbankAccountService {
  private readonly logger = new Logger(UnionbankAccountService.name);

  constructor(private readonly apiClient: UnionbankApiClient) {}

  async inquireAccount(
    request: AccountInquiryRequest,
    requestId?: string,
  ): Promise<AccountInquiryResponse> {
    this.logger.log(`Inquiring account: ${request.accountNumber.slice(-4)}`);

    const response = await this.apiClient.post<AccountInquiryResponse>(
      UnionbankEndpoints.ACCOUNT_INQUIRY,
      request,
      { requestId },
    );

    this.logger.log(`Account inquiry successful: ${response.accountName}`);
    return response;
  }

  async getAccountBalance(
    request: AccountBalanceRequest,
    requestId?: string,
  ): Promise<AccountBalanceResponse> {
    this.logger.log(
      `Getting account balance: ${request.accountNumber.slice(-4)}`,
    );

    const endpoint = UnionbankEndpoints.ACCOUNT_BALANCE.replace(
      '{accountNumber}',
      request.accountNumber,
    );

    const response = await this.apiClient.get<AccountBalanceResponse>(
      endpoint,
      { requestId },
    );

    this.logger.log('Account balance retrieved successfully');
    return response;
  }
}
