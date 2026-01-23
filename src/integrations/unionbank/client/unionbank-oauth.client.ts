import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
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

    try {
      const response = await this.httpClient.post<OAuthTokenResponse>(
        this.config.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: this.config.scope,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-ibm-client-id': this.config.clientId,
            'x-ibm-client-secret': this.config.clientSecret,
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
      this.logger.error(
        'Failed to refresh UnionBank OAuth token',
        error instanceof Error ? error.message : String(error),
      );
      throw new UnionbankAuthException('Failed to authenticate with UnionBank');
    }
  }

  clearToken(): void {
    this.tokenInfo = null;
  }
}
