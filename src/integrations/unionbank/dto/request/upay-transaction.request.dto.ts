/**
 * UPay Transaction Request DTO
 * Based on UnionBank UPay API documentation
 */

export interface UpayReference {
  index: number | string;
  value: string;
}

export interface UpayTransactionRequest {
  senderRefId: string;
  tranRequestDate: string; // ISO 8601 format: "2022-10-10T12:11:50.333"
  emailAddress: string;
  mobileNumber?: string;
  amount: number;
  paymentMethod: 'paygate' | 'instapay' | 'pesonet';
  skipWhitelabelPage: 'true' | 'false';
  callbackUrl: string;
  references: UpayReference[];
}

export interface CreateUpayTransactionParams {
  senderRefId: string;
  emailAddress: string;
  mobileNumber?: string;
  amount: number;
  paymentMethod?: 'paygate' | 'instapay' | 'pesonet';
  skipWhitelabelPage?: boolean;
  callbackUrl: string;
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
