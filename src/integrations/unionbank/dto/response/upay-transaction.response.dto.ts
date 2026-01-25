/**
 * UPay Transaction Response DTO
 * Based on UnionBank UPay API documentation
 */

export interface UpayTransactionResponse {
  senderRefId: string;
  uuid: string;
  paymentUrl?: string;
  status?: string;
  message?: string;
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
