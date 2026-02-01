import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCodes } from '../constants/error-codes.constant';
import type { ReferenceValidationError } from '../../integrations/unionbank/validators/reference-validation.types';

/**
 * Exception thrown when reference validation fails.
 *
 * Contains detailed validation errors for each field that failed validation.
 *
 * @example
 * ```typescript
 * throw new ReferenceValidationException([
 *   { index: 1, name: 'Account Number', message: 'Account Number is required', code: 'REQUIRED' },
 * ]);
 * ```
 */
export class ReferenceValidationException extends BaseException {
  constructor(
    public readonly validationErrors: readonly ReferenceValidationError[],
  ) {
    const messages = validationErrors.map((e) => e.message);
    const summary =
      validationErrors.length === 1
        ? messages[0]
        : `${validationErrors.length} reference validation errors`;

    super(
      ErrorCodes.REFERENCE_VALIDATION_ERROR,
      summary,
      HttpStatus.BAD_REQUEST,
      {
        errors: validationErrors,
        messages,
      },
    );
  }

  /**
   * Get all validation error messages as an array.
   */
  getValidationMessages(): string[] {
    return this.validationErrors.map((e) => e.message);
  }

  /**
   * Check if a specific reference index failed validation.
   */
  hasErrorForIndex(index: number | string): boolean {
    return this.validationErrors.some((e) => String(e.index) === String(index));
  }

  /**
   * Get errors for a specific reference index.
   */
  getErrorsForIndex(
    index: number | string,
  ): readonly ReferenceValidationError[] {
    return this.validationErrors.filter(
      (e) => String(e.index) === String(index),
    );
  }
}
