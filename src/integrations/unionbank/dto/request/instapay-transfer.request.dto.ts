export interface InstapayTransferRequest {
  senderRefId: string;
  tranRequestDate: string;
  sender: InstapayTransferParty;
  beneficiary: InstapayTransferParty;
  remittance: InstapayRemittance;
  purpose?: string;
  instructions?: string;
}

export interface InstapayTransferParty {
  name: string;
  address?: InstapayAddress;
  accountNumber?: string;
}

export interface InstapayAddress {
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  country?: string;
}

export interface InstapayRemittance {
  amount: string;
  currency: string;
  receivingBank: string;
}

export interface CreateInstapayTransferParams {
  senderRefId: string;
  senderName: string;
  senderAccountNumber?: string;
  beneficiaryName: string;
  beneficiaryAccountNumber: string;
  receivingBank: string;
  amount: number;
  currency?: string;
  purpose?: string;
}

export function createInstapayTransferRequest(
  params: CreateInstapayTransferParams,
): InstapayTransferRequest {
  return {
    senderRefId: params.senderRefId,
    tranRequestDate: new Date().toISOString(),
    sender: {
      name: params.senderName,
      accountNumber: params.senderAccountNumber,
    },
    beneficiary: {
      name: params.beneficiaryName,
      accountNumber: params.beneficiaryAccountNumber,
    },
    remittance: {
      amount: params.amount.toFixed(2),
      currency: params.currency ?? 'PHP',
      receivingBank: params.receivingBank,
    },
    purpose: params.purpose,
  };
}
