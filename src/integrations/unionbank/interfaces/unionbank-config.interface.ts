export interface UnionbankApiConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  partnerId: string;
  apiKey: string;
  scope: string;
  timeout: number;
}

export interface UnionbankTokenInfo {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  scope: string;
}

export interface UnionbankRequestHeaders extends Record<
  string,
  string | undefined
> {
  Authorization: string;
  'Content-Type': string;
  'x-ibm-client-id': string;
  'x-ibm-client-secret': string;
  'x-partner-id': string;
  'x-request-id'?: string;
}
