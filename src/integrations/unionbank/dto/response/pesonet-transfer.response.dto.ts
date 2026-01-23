export interface PesonetTransferResponse {
  ubpTranId: string;
  senderRefId: string;
  status: string;
  statusMessage: string;
  tranFinishDate?: string;
  tranRequestDate: string;
}

export interface PesonetStatusResponse {
  ubpTranId: string;
  senderRefId: string;
  status: PesonetTransferStatus;
  statusMessage: string;
  tranFinishDate?: string;
}

export type PesonetTransferStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';
