/**
 * UPay Transaction Request DTO
 * Based on UnionBank UPay API documentation
 */

export type UpayPaymentMethod =
  | 'debit/credit'
  | 'ub online'
  | 'instapay'
  | 'instapay p2b'
  | 'paygate'
  | 'gcash'
  | 'grabpay'
  | 'bayad_center'
  | 'cebl'
  | 'ecpay'
  | 'plwn'
  | 'mlh'
  | 'smr'
  | 'rds';

export interface UpayReference {
  index: number | string;
  value: string;
}

export interface UpayTransactionRequest {
  senderRefId: string;
  tranRequestDate: string; // ISO 8601 format: "2022-10-10T12:11:50.333"
  billerUuid: string;
  emailAddress: string;
  mobileNumber?: string;
  amount: number;
  paymentMethod: UpayPaymentMethod;
  skipWhitelabelPage: 'true' | 'false';
  callbackUrl: string;
  references: UpayReference[];
}

export interface CreateUpayTransactionParams {
  senderRefId: string;
  /** Biller ID (UUID). Optional when using redirect flow (supplied from config). */
  billerUuid?: string;
  emailAddress: string;
  /** Country code for international numbers (no leading +). Optional; default PH (63) when omitted (e.g. in redirect payload). */
  countryCode?: string;
  mobileNumber?: string;
  amount: number;
  paymentMethod?: UpayPaymentMethod;
  skipWhitelabelPage?: boolean;
  callbackUrl: string;
  /** Back to Merchant URL (redirect when "Back to Merchant" link is clicked on whitelabel page). Optional per PDF line 159. */
  backRedir?: string;
  // Reference fields
  firstName: string;
  lastName: string;
  userRef?: string;
  accountNumber?: string;
  additionalRef?: string;
}

/**
 * Creates a UPay transaction request from the given parameters
 */
export function createUpayTransactionRequest(
  params: CreateUpayTransactionParams,
): UpayTransactionRequest {
  const now = new Date();
  const tranRequestDate = now.toISOString().replace('Z', '');

  return {
    senderRefId: params.senderRefId,
    tranRequestDate,
    billerUuid: params.billerUuid ?? '',
    emailAddress: params.emailAddress,
    mobileNumber: params.mobileNumber,
    amount: params.amount,
    paymentMethod: params.paymentMethod ?? 'paygate',
    skipWhitelabelPage: params.skipWhitelabelPage ? 'true' : 'false',
    callbackUrl: params.callbackUrl,
    references: [
      { index: 1, value: params.firstName },
      { index: 2, value: params.accountNumber ?? '' },
      { index: 3, value: params.userRef ?? '' },
      { index: 4, value: params.lastName },
      { index: 5, value: params.firstName },
    ],
  };
}
