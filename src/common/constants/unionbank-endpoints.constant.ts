export type UnionbankEnv = 'sandbox' | 'uat';

function parseUnionbankEnv(value: string | undefined): UnionbankEnv {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'sandbox' || normalized === 'sb') return 'sandbox';
  return 'uat';
}

export const UnionbankEndpointsByEnv = {
  sandbox: {
    // OAuth (Sandbox routing)
    TOKEN: '/partners/sb/partners/v1/oauth2/token',

    // UPay Biller UUID status
    UPAY_BILLER_UUID_STATUS:
      '/ubp/external/upay/payments/v1/transactions/{billerUuid}/status',

    // UPay Biller Information
    UPAY_BILLER_DETAILS: '/ubp/external/upay/payments/v1/billers/{billerUuid}',
    UPAY_BILLER_REFERENCES:
      '/ubp/external/upay/payments/v1/billers/{billerUuid}/references',

    // UPay (UPay APIs are under /ubp/external even for UAT domain usage)
    UPAY_TRANSACTIONS: '/ubp/external/upay/payments/v1/transactions',
    UPAY_STATUS: '/ubp/external/upay/payments/v1/transactions/{senderRefId}',
    UPAY_PRIVACY_POLICY: '/ubp/external/upay/payments/v1/privacy',
    UPAY_INSTAPAY_BANKS: '/ubp/external/upay/payments/v1/instapay/banks',
    UPAY_PESONET_BANKS: '/ubp/external/upay/payments/v1/pesonet/banks',

    // InstaPay (Sandbox routing)
    INSTAPAY_TRANSFER: '/partners/sb/instapay/v1/transfers',
    INSTAPAY_STATUS: '/partners/sb/instapay/v1/transfers/{referenceId}/status',

    // PESONet (Sandbox routing)
    PESONET_TRANSFER: '/partners/sb/pesonet/v1/transfers',
    PESONET_STATUS: '/partners/sb/pesonet/v1/transfers/{referenceId}/status',

    // Account (Sandbox routing)
    ACCOUNT_INQUIRY: '/partners/sb/accounts/v1/inquiry',
    ACCOUNT_BALANCE: '/partners/sb/accounts/v1/{accountNumber}/balance',

    // Transaction History (Sandbox routing)
    TRANSACTIONS: '/partners/sb/transactions/v1/history',
  },
  uat: {
    // OAuth (UPay doc "Partner Authentication API")
    TOKEN: '/ubp/uat/partners/v1/oauth2/token',

    // UPay Biller UUID status
    UPAY_BILLER_UUID_STATUS:
      '/ubp/external/upay/payments/v1/transactions/{billerUuid}/status',

    // UPay Biller Information
    UPAY_BILLER_DETAILS: '/ubp/external/upay/payments/v1/billers/{billerUuid}',
    UPAY_BILLER_REFERENCES:
      '/ubp/external/upay/payments/v1/billers/{billerUuid}/references',

    // UPay (UPay doc "API Direct Integration")
    UPAY_TRANSACTIONS: '/ubp/external/upay/payments/v1/transactions',
    UPAY_STATUS: '/ubp/external/upay/payments/v1/transactions/{senderRefId}',
    UPAY_PRIVACY_POLICY: '/ubp/external/upay/payments/v1/privacy',
    UPAY_INSTAPAY_BANKS: '/ubp/external/upay/payments/v1/instapay/banks',
    UPAY_PESONET_BANKS: '/ubp/external/upay/payments/v1/pesonet/banks',

    // These align with `docs/unionbank-integration.md` in this repo
    INSTAPAY_TRANSFER: '/ubp/external/instapay/v1/transfers',
    INSTAPAY_STATUS: '/ubp/external/instapay/v1/transfers/{referenceId}/status',

    PESONET_TRANSFER: '/ubp/external/pesonet/v1/transfers',
    PESONET_STATUS: '/ubp/external/pesonet/v1/transfers/{referenceId}/status',

    ACCOUNT_INQUIRY: '/ubp/external/accounts/v1/inquiry',
    ACCOUNT_BALANCE: '/ubp/external/accounts/v1/{accountNumber}/balance',

    TRANSACTIONS: '/ubp/external/transactions/v1/history',
  },
} as const satisfies Record<UnionbankEnv, Record<string, string>>;

/**
 * Effective endpoints for the configured environment.
 * Control via `UNIONBANK_ENV=sandbox|uat` (defaults to `uat`).
 */
export const UnionbankEndpoints =
  UnionbankEndpointsByEnv[parseUnionbankEnv(process.env.UNIONBANK_ENV)];

export type UnionbankEndpoint =
  (typeof UnionbankEndpoints)[keyof typeof UnionbankEndpoints];
