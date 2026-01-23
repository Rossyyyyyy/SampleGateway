export interface AccountInquiryResponse {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  status: AccountStatus;
}

export interface AccountBalanceResponse {
  accountNumber: string;
  availableBalance: string;
  currentBalance: string;
  currency: string;
  lastUpdated: string;
}

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'FROZEN' | 'CLOSED';
