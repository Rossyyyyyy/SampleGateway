export interface AccountInquiryRequest {
  accountNumber: string;
  bankCode?: string;
}

export interface AccountBalanceRequest {
  accountNumber: string;
}
