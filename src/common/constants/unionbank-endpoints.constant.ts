export const UnionbankEndpoints = {
  // OAuth
  TOKEN: '/ubp/uat/partners/v1/oauth2/token',

  // UPay
  UPAY_TRANSACTIONS: '/ubp/external/upay/payments/v1/transactions',
  UPAY_STATUS: '/ubp/external/upay/payments/v1/transactions/{senderRefId}',

  // InstaPay
  INSTAPAY_TRANSFER: '/partners/sb/instapay/v1/transfers',
  INSTAPAY_STATUS: '/partners/sb/instapay/v1/transfers/{referenceId}/status',

  // PESONet
  PESONET_TRANSFER: '/partners/sb/pesonet/v1/transfers',
  PESONET_STATUS: '/partners/sb/pesonet/v1/transfers/{referenceId}/status',

  // Account
  ACCOUNT_INQUIRY: '/partners/sb/accounts/v1/inquiry',
  ACCOUNT_BALANCE: '/partners/sb/accounts/v1/{accountNumber}/balance',

  // Transaction History
  TRANSACTIONS: '/partners/sb/transactions/v1/history',
} as const;

export type UnionbankEndpoint =
  (typeof UnionbankEndpoints)[keyof typeof UnionbankEndpoints];
