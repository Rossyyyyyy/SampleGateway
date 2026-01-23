export const TransactionStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type TransactionStatusType =
  (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const TransferType = {
  INSTAPAY: 'INSTAPAY',
  PESONET: 'PESONET',
} as const;

export type TransferTypeValue =
  (typeof TransferType)[keyof typeof TransferType];

export const TransferDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
} as const;

export type TransferDirectionType =
  (typeof TransferDirection)[keyof typeof TransferDirection];
