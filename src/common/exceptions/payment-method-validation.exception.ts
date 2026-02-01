import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCodes } from '../constants/error-codes.constant';
import type { PaymentMethodValidationError } from '../../integrations/unionbank/validators/payment-method-validation.types';

/**
 * Exception thrown when payment method validation fails.
 *
 * Contains details about why the payment method is invalid and
 * which methods are available for the biller.
 *
 * @example
 * ```typescript
 * throw new PaymentMethodValidationException({
 *   requestedMethod: 'instapay',
 *   availableMethods: ['ub online', 'paygate'],
 *   message: "Payment method 'instapay' is not enabled for this biller",
 *   code: 'METHOD_NOT_ENABLED',
 * });
 * ```
 */
export class PaymentMethodValidationException extends BaseException {
  constructor(public readonly validationError: PaymentMethodValidationError) {
    super(
      ErrorCodes.PAYMENT_METHOD_VALIDATION_ERROR,
      validationError.message,
      HttpStatus.BAD_REQUEST,
      {
        requestedMethod: validationError.requestedMethod,
        availableMethods: validationError.availableMethods,
        errorCode: validationError.code,
      },
    );
  }

  /**
   * Get the requested payment method that failed validation.
   */
  getRequestedMethod(): string {
    return this.validationError.requestedMethod;
  }

  /**
   * Get the list of available payment methods for the biller.
   */
  getAvailableMethods(): readonly string[] {
    return this.validationError.availableMethods;
  }

  /**
   * Get the validation error code (different from the base ErrorCode).
   */
  getValidationErrorCode(): PaymentMethodValidationError['code'] {
    return this.validationError.code;
  }
}
