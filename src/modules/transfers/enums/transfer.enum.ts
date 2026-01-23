export enum TransferType {
  INSTAPAY = 'INSTAPAY',
  PESONET = 'PESONET',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TransferDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}
