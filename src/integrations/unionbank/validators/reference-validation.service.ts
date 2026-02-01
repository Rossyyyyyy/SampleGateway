import { Injectable, Logger } from '@nestjs/common';
import type {
  UpayBillerReference,
  UpayBillerUuidReferencesResponse,
} from '../dto/response/upay-biller.response.dto';
import {
  FIELD_TYPE_PATTERNS,
  FIELD_VALIDATION_PATTERNS,
  ReferenceInput,
  ReferenceValidationError,
  ReferenceValidationResult,
} from './reference-validation.types';

/**
 * Service for validating UPay transaction references against biller-defined validation rules.
 *
 * This service validates references based on:
 * - Required fields (isRequired)
 * - Minimum character length (minCharLength)
 * - Maximum character length (maxCharLength)
 * - Field type patterns (fieldType: NUMERIC, ALPHABETIC, ALPHANUMERIC)
 * - Field validation type patterns (fieldValidationType.name)
 *
 * @example
 * ```typescript
 * const result = await validationService.validateReferences(
 *   billerReferences,
 *   [{ index: 1, value: 'John' }, { index: 2, value: '123456789' }]
 * );
 * if (!result.isValid) {
 *   throw new BadRequestException(result.errors);
 * }
 * ```
 */
@Injectable()
export class ReferenceValidationService {
  private readonly logger = new Logger(ReferenceValidationService.name);

  /**
   * Validates references against biller reference definitions.
   *
   * @param billerReferences - Biller reference definitions from UPay API
   * @param inputReferences - References provided in the transaction request
   * @returns Validation result with errors if any
   */
  validateReferences(
    billerReferences: readonly UpayBillerReference[],
    inputReferences: readonly ReferenceInput[],
  ): ReferenceValidationResult {
    const errors: ReferenceValidationError[] = [];

    // Create a map for quick lookup of input references by index
    const inputMap = this.createInputMap(inputReferences);

    // Validate each biller reference definition
    for (const billerRef of billerReferences) {
      const referenceErrors = this.validateSingleReference(billerRef, inputMap);
      errors.push(...referenceErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates references using pre-fetched biller references response.
   *
   * @param billerReferencesResponse - Full response from biller references API
   * @param inputReferences - References provided in the transaction request
   * @returns Validation result with errors if any
   */
  validateReferencesFromResponse(
    billerReferencesResponse: UpayBillerUuidReferencesResponse,
    inputReferences: readonly ReferenceInput[],
  ): ReferenceValidationResult {
    return this.validateReferences(
      billerReferencesResponse.references ?? [],
      inputReferences,
    );
  }

  /**
   * Creates a map from reference index to input value for O(1) lookups.
   */
  private createInputMap(
    inputReferences: readonly ReferenceInput[],
  ): Map<string, string> {
    const map = new Map<string, string>();
    for (const ref of inputReferences) {
      // Normalize index to string for consistent comparison
      map.set(String(ref.index), ref.value);
    }
    return map;
  }

  /**
   * Validates a single reference against its definition.
   *
   * @param billerRef - Biller reference definition
   * @param inputMap - Map of input reference values by index
   * @returns Array of validation errors for this reference
   */
  private validateSingleReference(
    billerRef: UpayBillerReference,
    inputMap: Map<string, string>,
  ): ReferenceValidationError[] {
    const errors: ReferenceValidationError[] = [];
    const indexStr = String(billerRef.index);
    const value = inputMap.get(indexStr) ?? '';
    const { validations } = billerRef;

    // Skip validation for non-visible fields that are not required
    if (!this.isVisible(validations.isVisible) && !validations.isRequired) {
      return errors;
    }

    // Required validation
    if (validations.isRequired && this.isEmpty(value)) {
      errors.push(this.createError(billerRef, 'REQUIRED', 'is required'));
      // If required field is missing, skip other validations
      return errors;
    }

    // Skip further validation if value is empty and not required
    if (this.isEmpty(value)) {
      return errors;
    }

    // Min length validation
    const minLength = this.parseLength(validations.minCharLength);
    if (minLength > 0 && value.length < minLength) {
      errors.push(
        this.createError(
          billerRef,
          'MIN_LENGTH',
          `must be at least ${minLength} characters`,
        ),
      );
    }

    // Max length validation
    const maxLength = this.parseLength(validations.maxCharLength);
    if (maxLength > 0 && value.length > maxLength) {
      errors.push(
        this.createError(
          billerRef,
          'MAX_LENGTH',
          `must be at most ${maxLength} characters`,
        ),
      );
    }

    // Field type validation (NUMERIC, ALPHABETIC, ALPHANUMERIC)
    const typeError = this.validateFieldType(billerRef.fieldType, value);
    if (typeError) {
      errors.push(this.createError(billerRef, 'INVALID_TYPE', typeError));
    }

    // Field validation type pattern validation
    const patternError = this.validatePattern(
      validations.fieldValidationType?.name,
      value,
    );
    if (patternError) {
      errors.push(
        this.createError(billerRef, 'PATTERN_MISMATCH', patternError),
      );
    }

    return errors;
  }

  /**
   * Creates a standardized validation error.
   */
  private createError(
    billerRef: UpayBillerReference,
    code: ReferenceValidationError['code'],
    message: string,
  ): ReferenceValidationError {
    return {
      index: billerRef.index,
      name: billerRef.name,
      message: `${billerRef.name} ${message}`,
      code,
    };
  }

  /**
   * Checks if a value is empty (null, undefined, or empty string).
   */
  private isEmpty(value: string | undefined | null): boolean {
    return value === undefined || value === null || value.trim() === '';
  }

  /**
   * Parses a length value from string to number.
   */
  private parseLength(length: string | number | undefined): number {
    if (length === undefined || length === null) return 0;
    const parsed = typeof length === 'number' ? length : parseInt(length, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Checks if a field is visible based on the isVisible value.
   * isVisible can be boolean or string ("true"/"false").
   */
  private isVisible(isVisible: string | boolean | undefined): boolean {
    if (typeof isVisible === 'boolean') return isVisible;
    if (typeof isVisible === 'string') {
      return isVisible.toLowerCase() === 'true';
    }
    return true; // Default to visible
  }

  /**
   * Validates field type (NUMERIC, ALPHABETIC, ALPHANUMERIC).
   *
   * @returns Error message if validation fails, undefined otherwise
   */
  private validateFieldType(
    fieldType: string | undefined,
    value: string,
  ): string | undefined {
    if (!fieldType) return undefined;

    const normalizedType = fieldType.toUpperCase();
    const pattern = FIELD_TYPE_PATTERNS[normalizedType];

    // TEXT and unknown types allow any value
    if (!pattern || normalizedType === 'TEXT') return undefined;

    if (!pattern.test(value)) {
      switch (normalizedType) {
        case 'NUMERIC':
          return 'must contain only numbers';
        case 'ALPHABETIC':
          return 'must contain only letters';
        case 'ALPHANUMERIC':
          return 'must contain only letters and numbers';
        default:
          return `must match ${fieldType} format`;
      }
    }

    return undefined;
  }

  /**
   * Validates field validation type pattern.
   *
   * @returns Error message if validation fails, undefined otherwise
   */
  private validatePattern(
    validationType: string | undefined,
    value: string,
  ): string | undefined {
    if (!validationType) return undefined;

    const pattern = FIELD_VALIDATION_PATTERNS[validationType];

    // Simple and unknown types allow any value
    if (!pattern || validationType === 'Simple') return undefined;

    if (!pattern.test(value)) {
      switch (validationType) {
        case 'Email':
          return 'must be a valid email address';
        case 'Alphabetic':
          return 'must contain only letters';
        case 'Numeric':
          return 'must contain only numbers';
        case 'Alphanumeric':
          return 'must contain only letters and numbers';
        default:
          return `must match ${validationType} format`;
      }
    }

    return undefined;
  }
}
