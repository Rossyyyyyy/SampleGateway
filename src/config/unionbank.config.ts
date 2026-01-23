import { registerAs } from '@nestjs/config';

export interface UnionbankConfigType {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  partnerId: string;
  apiKey: string;
  scope: string;
  tokenEndpoint: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const unionbankConfig = registerAs(
  'unionbank',
  (): UnionbankConfigType => ({
    baseUrl:
      process.env.UNIONBANK_BASE_URL ?? 'https://api-uat.unionbankph.com',
    clientId: process.env.UNIONBANK_CLIENT_ID ?? '',
    clientSecret: process.env.UNIONBANK_CLIENT_SECRET ?? '',
    partnerId: process.env.UNIONBANK_PARTNER_ID ?? '',
    apiKey: process.env.UNIONBANK_API_KEY ?? '',
    scope: process.env.UNIONBANK_SCOPE ?? 'transfers',
    tokenEndpoint:
      process.env.UNIONBANK_TOKEN_ENDPOINT ?? '/partners/sb/oauth2/token',
    timeout: parseInt(process.env.UNIONBANK_TIMEOUT ?? '30000', 10),
    retryAttempts: parseInt(process.env.UNIONBANK_RETRY_ATTEMPTS ?? '3', 10),
    retryDelay: parseInt(process.env.UNIONBANK_RETRY_DELAY ?? '1000', 10),
  }),
);
