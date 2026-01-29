/**
 * UPay Biller Information Response DTOs
 * Based on UnionBank UPay API documentation
 */

/**
 * Payment Channel Information
 */
export interface UpayPaymentChannel {
  name: string;
  code: string;
  isEnabled: boolean;
  isAvailed: boolean;
  chargeTo: string; // "Payor" or "Biller"
  settlement: string;
  fee: string;
  mdr: string;
  transactionLimit: string;
}

/**
 * Biller Information
 */
export interface UpayBiller {
  billerUuid: string;
  billerCode: string;
  billerName: string;
  accountNumber: string;
  paymentChannels: UpayPaymentChannel[];
}

/**
 * Response for GET /upay/payments/v1/billers/{billerUuid}
 */
export interface UpayBillerUuidResponse {
  billers: UpayBiller[];
}

/**
 * Reference Field Validation
 */
export interface UpayReferenceValidation {
  minCharLength: string;
  maxCharLength: string;
  isMasked: boolean;
  isRequired: boolean;
  isVisible: string | boolean;
  fieldValidationType: {
    name: string;
  };
}

/**
 * Biller Reference Field
 */
export interface UpayBillerReference {
  billerReferenceId: string;
  index: string;
  name: string;
  fieldType: string; // "ALPHANUMERIC", "NUMERIC", etc.
  validations: UpayReferenceValidation;
}

/**
 * Response for GET /upay/payments/v1/billers/{billerUuid}/references
 */
export interface UpayBillerUuidReferencesResponse {
  references: UpayBillerReference[];
}
