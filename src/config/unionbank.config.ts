import { registerAs } from '@nestjs/config';

export interface UnionbankConfigType {
  /**
   * Which UnionBank environment routing to use.
   * - sandbox: routes under /partners/sb/...
   * - uat: routes under /ubp/uat/... (token) and /ubp/external/... (most APIs)
   */
  env: 'sandbox' | 'uat';
  baseUrl: string;
  // x-ibm-client-id for API request headers
  clientId: string;
  // x-ibm-client-secret for API request headers
  clientSecret: string;
  // OAuth client_id for token request (form data)
  oauthClientId: string;
  // x-partner-id header
  partnerId: string;
  // UnionBank account number (provided by UnionBank)
  accountNumber?: string;
  // UnionBank API list / product name (e.g. UPay-Status-Inquiry-by-UnionBank)
  apiList?: string;
  // OAuth password grant credentials
  username: string;
  password: string;
  // OAuth scope
  scope: string;
  // OAuth token endpoint
  tokenEndpoint: string;
  // Shared secret for verifying UnionBank autopost webhook payloads (HMAC).
  upayAutopostWebhookSecret?: string;
  // UPay transactions endpoint
  upayEndpoint: string;
  // UPay Redirect/Encryption settings
  upayRedirectDomain?: string; // Domain for redirect URL (e.g., "pay.unionbankph.com")
  /** Biller UUID: provided by UnionBank. Used as BillerUuid in White Label URL per UB UPay doc. */
  upayBillerUuid?: string;
  upayAesKey?: string; // AES-256 key for redirect encryption (32 bytes, hex or base64)
  // Request settings
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

function parseUnionbankEnv(value: string | undefined): 'sandbox' | 'uat' {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'sandbox' || normalized === 'sb') return 'sandbox';
  return 'uat';
}

export const unionbankConfig = registerAs(
  'unionbank',
  (): UnionbankConfigType => ({
    env: parseUnionbankEnv(process.env.UNIONBANK_ENV),
    baseUrl:
      process.env.UNIONBANK_BASE_URL ?? 'https://api-uat.unionbankph.com',
    clientId: process.env.UNIONBANK_CLIENT_ID ?? '',
    clientSecret: process.env.UNIONBANK_CLIENT_SECRET ?? '',
    oauthClientId: process.env.UNIONBANK_OAUTH_CLIENT_ID ?? '',
    partnerId: process.env.UNIONBANK_PARTNER_ID ?? '',
    accountNumber: process.env.UNIONBANK_ACCOUNT_NUMBER ?? '',
    apiList: process.env.UNIONBANK_API_LIST ?? '',
    username: process.env.UNIONBANK_USERNAME ?? '',
    password: process.env.UNIONBANK_PASSWORD ?? '',
    scope: process.env.UNIONBANK_SCOPE ?? 'upay_payments',
    tokenEndpoint:
      process.env.UNIONBANK_TOKEN_ENDPOINT ??
      (parseUnionbankEnv(process.env.UNIONBANK_ENV) === 'sandbox'
        ? '/partners/sb/partners/v1/oauth2/token'
        : '/ubp/uat/partners/v1/oauth2/token'),
    upayAutopostWebhookSecret:
      process.env.UNIONBANK_UPAY_AUTOPOST_WEBHOOK_SECRET ?? '',
    upayEndpoint:
      process.env.UNIONBANK_UPAY_ENDPOINT ??
      '/ubp/external/upay/payments/v1/transactions',
    upayRedirectDomain: process.env.UNIONBANK_UPAY_REDIRECT_DOMAIN ?? '',

    // ✅ FIXED: was UNIONBANK_UPAY_BILLER_ID (wrong), now UNIONBANK_UPAY_BILLER_UUID (matches .env)
    upayBillerUuid: process.env.UNIONBANK_UPAY_BILLER_UUID ?? '',

    upayAesKey: process.env.UNIONBANK_UPAY_AES_KEY ?? '',
    timeout: parseInt(process.env.UNIONBANK_TIMEOUT ?? '30000', 10),
    retryAttempts: parseInt(process.env.UNIONBANK_RETRY_ATTEMPTS ?? '3', 10),
    retryDelay: parseInt(process.env.UNIONBANK_RETRY_DELAY ?? '1000', 10),
  }),
);