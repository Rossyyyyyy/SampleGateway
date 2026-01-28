import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { UnionbankAuthException } from '../../../common/exceptions';
import { HttpService } from '../../../infrastructure/http/http.service';
import { UnionbankConfigType } from '../../../config/unionbank.config';
import { OAuthTokenResponse } from '../dto/response/oauth-token.response.dto';
import { UnionbankTokenInfo } from '../interfaces/unionbank-config.interface';

const TOKEN_REFRESH_BUFFER_MS = 60000; // Refresh 1 minute before expiry

@Injectable()
export class UnionbankOAuthClient {
  private readonly logger = new Logger(UnionbankOAuthClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: UnionbankConfigType;
  private tokenInfo: UnionbankTokenInfo | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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

  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.tokenInfo!.accessToken;
    }

    await this.refreshToken();
    return this.tokenInfo!.accessToken;
  }

  private isTokenValid(): boolean {
    if (!this.tokenInfo) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(
      this.tokenInfo.expiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS,
    );

    return now < expiresAt;
  }

  private async refreshToken(): Promise<void> {
    this.logger.log('Refreshing UnionBank OAuth token');
    this.logger.debug(
      `Token endpoint: ${this.config.baseUrl}${this.config.tokenEndpoint}`,
    );
    this.logger.debug(
      `Using OAuth client ID: ${this.config.oauthClientId ? '***' + this.config.oauthClientId.slice(-4) : 'NOT SET'}`,
    );
    this.logger.debug(
      `Using username: ${this.config.username ? '***' + this.config.username.slice(-4) : 'NOT SET'}`,
    );

    try {
      // UPay uses password grant type with OAuth client ID in form body
      // Note: OAuth token endpoint does NOT require x-ibm-client-id and x-ibm-client-secret headers
      // Those headers are only used for actual API calls, not for token requests
      const response = await this.httpClient.post<OAuthTokenResponse>(
        this.config.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.config.oauthClientId,
          username: this.config.username,
          password: this.config.password,
          scope: this.config.scope,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
          },
        },
      );

      const data = response.data;
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);

      this.tokenInfo = {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt,
        scope: data.scope,
      };

      this.logger.log('UnionBank OAuth token refreshed successfully');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          this.logger.error(
            `Failed to refresh UnionBank OAuth token - Status: ${axiosError.response.status}`,
          );
          this.logger.error(
            `Response data: ${JSON.stringify(axiosError.response.data)}`,
          );
          this.logger.error(
            `Request URL: ${axiosError.config?.url || 'unknown'}`,
          );
        } else if (axiosError.request) {
          this.logger.error(
            'No response received from UnionBank OAuth endpoint',
          );
          this.logger.error(
            `Request URL: ${axiosError.config?.url || 'unknown'}`,
          );
        } else {
          this.logger.error(
            'Failed to refresh UnionBank OAuth token',
            axiosError.message,
          );
        }
      } else {
        this.logger.error(
          'Failed to refresh UnionBank OAuth token',
          error instanceof Error ? error.message : String(error),
        );
      }
      throw new UnionbankAuthException('Failed to authenticate with UnionBank');
    }
  }

  clearToken(): void {
    this.tokenInfo = null;
  }
}
