export interface OAuthTokenRequest {
  grant_type: 'client_credentials';
  scope: string;
}

export function createOAuthTokenRequest(scope: string): OAuthTokenRequest {
  return {
    grant_type: 'client_credentials',
    scope,
  };
}
