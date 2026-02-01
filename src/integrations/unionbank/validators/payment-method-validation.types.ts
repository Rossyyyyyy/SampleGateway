/**
 * Payment Method Validation Types
 * Defines types for validating payment methods against biller-enabled channels
 */

/**
 * Payment method validation error details
 */
export interface PaymentMethodValidationError {
  /** The requested payment method that failed validation */
  readonly requestedMethod: string;
  /** Available/enabled payment methods for the biller */
  readonly availableMethods: readonly string[];
  /** Human-readable error message */
  readonly message: string;
  /** Error code for programmatic handling */
  readonly code: PaymentMethodValidationErrorCode;
}

/**
 * Validation error codes for payment method
 */
export type PaymentMethodValidationErrorCode =
  | 'METHOD_NOT_ENABLED'
  | 'METHOD_NOT_AVAILED'
  | 'METHOD_NOT_FOUND'
  | 'NO_CHANNELS_CONFIGURED';

/**
 * Result of payment method validation
 */
export interface PaymentMethodValidationResult {
  /** Whether the payment method passed validation */
  readonly isValid: boolean;
  /** Validation error (undefined if isValid is true) */
  readonly error?: PaymentMethodValidationError;
  /** The matched payment channel info (undefined if validation failed) */
  readonly matchedChannel?: MatchedPaymentChannel;
}

/**
 * Information about a matched payment channel
 */
export interface MatchedPaymentChannel {
  /** Channel name (e.g., "UnionBank Online", "Instapay") */
  readonly name: string;
  /** Channel code (e.g., "UB ONLINE", "INSTAPAY") */
  readonly code: string;
  /** Whether this channel is enabled for the biller */
  readonly isEnabled: boolean;
  /** Whether the biller has availed this channel */
  readonly isAvailed: boolean;
  /** Who pays the fee: "Payor" or "Biller" */
  readonly chargeTo: string;
  /** Transaction fee for this channel */
  readonly fee: string;
  /** Transaction limit for this channel */
  readonly transactionLimit: string;
}

/**
 * Maps API payment method values to their corresponding channel codes
 *
 * Based on UB_UPay_documentation.txt payment method values (lines 160-176)
 * and UB_compiled_documentation.yaml channel codes (lines 35842-35858)
 */
export const PAYMENT_METHOD_TO_CHANNEL_CODE: Readonly<
  Record<string, readonly string[]>
> = {
  // Maps paymentMethod values to possible channel code(s)
  'debit/credit': ['DEBIT/CREDIT', 'VISA/MASTERCARD'],
  'ub online': ['UB ONLINE', 'UNIONBANK ONLINE'],
  instapay: ['INSTAPAY'],
  'instapay p2b': ['INSTAPAY P2B', 'INSTAPAY_P2B'],
  paygate: ['PAYGATE', 'PCHC PAYGATE', 'PESONET'],
  gcash: ['GCASH'],
  grabpay: ['GRABPAY'],
  bayad_center: ['BAYAD_CENTER', 'BAYAD CENTER'],
  cebl: ['CEBL'],
  ecpay: ['ECPAY'],
  plwn: ['PLWN'],
  mlh: ['MLH'],
  smr: ['SMR'],
  rds: ['RDS'],
} as const;
