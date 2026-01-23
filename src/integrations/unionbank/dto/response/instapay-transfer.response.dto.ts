export interface InstapayTransferResponse {
  ubpTranId: string;
  senderRefId: string;
  status: string;
  statusMessage: string;
  tranFinishDate?: string;
  tranRequestDate: string;
}

export interface InstapayStatusResponse {
  ubpTranId: string;
  senderRefId: string;
  status: InstapayTransferStatus;
  statusMessage: string;
  tranFinishDate?: string;
}

export type InstapayTransferStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';
