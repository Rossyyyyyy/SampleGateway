// C:\Users\Roschel\Downloads\inspirewalletgateway\src\integrations\unionbank\dto\response\upay-biller.response.dto.ts
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

/**
 * Response for GET /upay/payments/v1/transactions/{billerUuid}/status
 */
export interface UpayBillerUuidStatusDataItem {
  status: string;
  billerPostStatus: string;
  amount: string;
  transactionDateTime: string;
}

/**
 * Response for GET /upay/payments/v1/transactions/{billerUuid}/status
 * (status with biller post status)
 */
export interface UpayBillerUuidStatusResponse {
  code: string;
  state: string;
  uuid: string;
  data: UpayBillerUuidStatusDataItem[];
}

// ====== NEW DTOs FOR UPAY-000 TESTING ======

/**
 * Simplified Reference Field for UPAY-000 Testing
 * This format is easier to work with for frontend validation
 */
export interface SimplifiedBillerReference {
  /** Reference field ID (e.g., 'reference1', 'reference2') */
  id: string;

  /** Reference index from UnionBank */
  index: string;

  /** Display label for the field */
  label: string;

  /** Field type: ALPHANUMERIC, NUMERIC, etc. */
  fieldType: string;

  /** Whether this field is required */
  required: boolean;

  /** Whether this field is visible */
  visible: boolean;

  /** Whether value should be masked (for passwords, etc.) */
  masked: boolean;

  /** Minimum character length */
  minLength: number;

  /** Maximum character length */
  maxLength: number;

  /** Validation type name */
  validationType: string;
}

/**
 * Simplified Biller Details for UPAY-000 Testing
 * Flattens the nested structure for easier consumption
 */
export interface SimplifiedBillerDetails {
  /** Biller UUID */
  billerUuid: string;

  /** Biller code */
  billerCode: string;

  /** Biller name */
  billerName: string;

  /** Account number */
  accountNumber: string;

  /** Simplified reference fields array */
  references: SimplifiedBillerReference[];

  /** Available payment channels */
  paymentChannels: UpayPaymentChannel[];
}