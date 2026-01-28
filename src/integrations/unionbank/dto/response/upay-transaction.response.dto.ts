/**
 * UPay Transaction Response DTO
 * Based on UnionBank UPay API documentation
 */

export interface UpayTransactionResponse {
  code?: string; // Response code (e.g., "SP", "200")
  senderRefId: string;
  uuid: string;
  state?: string; // Transaction state (e.g., "Sent for Processing")
  transactionId?: string; // Transaction ID for tracking
  qrCode?: string; // QR code string (for InstaPay)
  message?: string; // Redirect URL or message (for debit/credit card, UB Online, PayGate)
  paymentUrl?: string; // Legacy field, use message instead
  status?: string; // Legacy field, use state instead
}

export interface UpayErrorDetail {
  senderRefId?: string;
  message: string;
  coreCode?: string;
  uuid?: string;
  trace?: string;
}

export interface UpayErrorParameter {
  field: string;
  message: string;
}

export interface UpayError {
  code: string | number;
  description: string;
  details?: UpayErrorDetail | UpayErrorDetail[];
  parameters?: UpayErrorParameter[];
}

export interface UpayErrorResponse {
  errors: UpayError[];
}

/**
 * UPay Status Inquiry Response
 */
export interface UpayStatusResponse {
  senderRefId: string;
  uuid: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  amount: number;
  paidAt?: string;
  paymentMethod?: string;
  message?: string;
}
