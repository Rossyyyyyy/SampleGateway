/**
 * Reference Validation Types
 * Defines types for biller reference validation based on YAML definitions
 */

/**
 * Result of a single reference field validation
 */
export interface ReferenceValidationError {
  /** Reference index that failed validation */
  readonly index: number | string;
  /** Reference name/field name */
  readonly name: string;
  /** Validation error message */
  readonly message: string;
  /** Error code for programmatic handling */
  readonly code: ReferenceValidationErrorCode;
}

/**
 * Validation error codes for reference fields
 */
export type ReferenceValidationErrorCode =
  | 'REQUIRED'
  | 'MIN_LENGTH'
  | 'MAX_LENGTH'
  | 'PATTERN_MISMATCH'
  | 'INVALID_TYPE';

/**
 * Result of reference validation
 */
export interface ReferenceValidationResult {
  /** Whether all references passed validation */
  readonly isValid: boolean;
  /** List of validation errors (empty if isValid is true) */
  readonly errors: readonly ReferenceValidationError[];
}

/**
 * Reference input for validation
 */
export interface ReferenceInput {
  /** Reference index (matches biller reference definition index) */
  readonly index: number | string;
  /** Reference value */
  readonly value: string;
}

/**
 * Field validation type patterns
 * Maps fieldValidationType.name to regex patterns
 */
export const FIELD_VALIDATION_PATTERNS: Readonly<Record<string, RegExp>> = {
  /** Allows any character */
  Simple: /.*/,
  /** Allows only letters */
  Alphabetic: /^[a-zA-Z]+$/,
  /** Allows only digits */
  Numeric: /^[0-9]+$/,
  /** Allows letters and digits */
  Alphanumeric: /^[a-zA-Z0-9]+$/,
  /** Email pattern */
  Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Allows alphanumeric with spaces */
  AlphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  /** Allows alphanumeric with common symbols */
  AlphanumericWithSymbols: /^[a-zA-Z0-9\s\-_.@]+$/,
} as const;

/**
 * Field type patterns
 * Maps fieldType to regex patterns for type validation
 */
export const FIELD_TYPE_PATTERNS: Readonly<Record<string, RegExp>> = {
  /** Numeric only */
  NUMERIC: /^[0-9]+$/,
  /** Letters only */
  ALPHABETIC: /^[a-zA-Z]+$/,
  /** Letters and numbers */
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  /** Any characters (default) */
  TEXT: /.*/,
} as const;
