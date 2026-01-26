import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import {
  UnionbankApiException,
  UnionbankTimeoutException,
} from '../../../common/exceptions';
import { HttpService } from '../../../infrastructure/http/http.service';
import { UnionbankConfigType } from '../../../config/unionbank.config';
import { UnionbankRequestHeaders } from '../interfaces/unionbank-config.interface';
import { UnionbankOAuthClient } from './unionbank-oauth.client';

export interface ApiRequestOptions {
  requestId?: string;
  timeout?: number;
}

@Injectable()
export class UnionbankApiClient {
  private readonly logger = new Logger(UnionbankApiClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: UnionbankConfigType;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly oauthClient: UnionbankOAuthClient,
  ) {
    const ubConfig = this.configService.get<UnionbankConfigType>('unionbank');
    if (!ubConfig) {
      throw new Error('UnionBank configuration not found');
    }
    this.config = ubConfig;

    this.httpClient = this.httpService.createClient({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    });
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const headers = await this.buildHeaders(options?.requestId);

    try {
      const response = await this.httpClient.get<T>(endpoint, {
        headers,
        timeout: options?.timeout ?? this.config.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, endpoint);
    }
  }

  async post<T, D = unknown>(
    endpoint: string,
    data: D,
    options?: ApiRequestOptions,
  ): Promise<T> {
    const headers = await this.buildHeaders(options?.requestId);

    try {
      const response = await this.httpClient.post<T>(endpoint, data, {
        headers,
        timeout: options?.timeout ?? this.config.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, endpoint);
    }
  }

  private async buildHeaders(
    requestId?: string,
  ): Promise<UnionbankRequestHeaders> {
    const accessToken = await this.oauthClient.getAccessToken();

    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-ibm-client-id': this.config.clientId,
      'x-ibm-client-secret': this.config.clientSecret,
      'x-partner-id': this.config.partnerId,
      'x-request-id': requestId ?? randomUUID(),
    };
  }

  private handleError(error: unknown, endpoint: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT'
      ) {
        return new UnionbankTimeoutException(endpoint);
      }

      const statusCode = axiosError.response?.status;
      const responseBody = axiosError.response?.data;

      this.logger.error(`UnionBank API error on ${endpoint}`, {
        statusCode,
        responseBody,
        message: axiosError.message,
      });

      return new UnionbankApiException(
        `UnionBank API request failed: ${axiosError.message}`,
        {
          endpoint,
          statusCode,
          responseBody,
        },
      );
    }

    return new UnionbankApiException(
      error instanceof Error ? error.message : 'Unknown UnionBank API error',
      { endpoint },
    );
  }
}
