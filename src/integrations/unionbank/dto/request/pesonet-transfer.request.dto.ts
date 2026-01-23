export interface PesonetTransferRequest {
  senderRefId: string;
  tranRequestDate: string;
  sender: PesonetTransferParty;
  beneficiary: PesonetTransferParty;
  remittance: PesonetRemittance;
  purpose?: string;
  instructions?: string;
}

export interface PesonetTransferParty {
  name: string;
  address?: PesonetAddress;
  accountNumber?: string;
}

export interface PesonetAddress {
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  country?: string;
}

export interface PesonetRemittance {
  amount: string;
  currency: string;
  receivingBank: string;
}

export interface CreatePesonetTransferParams {
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

export function createPesonetTransferRequest(
  params: CreatePesonetTransferParams,
): PesonetTransferRequest {
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
