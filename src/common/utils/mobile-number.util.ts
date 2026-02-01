/**
 * Mobile Number Utility
 *
 * Handles country code defaults and mobile number normalization
 * per UnionBank UPay documentation:
 * - Default country code is PH (63) if invalid/missing
 * - Supports DITO numbers (+63 8)
 * - Philippine mobile numbers are 10 digits long
 */

/** Default country code for PH */
export const DEFAULT_COUNTRY_CODE = '63';

/**
 * Valid Philippine mobile prefixes (first digit after country code)
 * - 9: Traditional telcos (Globe, Smart, Sun, TNT, etc.)
 * - 8: DITO Telecommunity (per PDF line 156)
 */
export const VALID_PH_MOBILE_PREFIXES = ['8', '9'];

/**
 * Normalizes a country code.
 * - Returns '63' (PH) if value is null, undefined, empty, or invalid
 * - Strips leading '+' if present
 * - Only accepts 1-4 digit numeric values
 *
 * @param countryCode - The country code to normalize (with or without leading +)
 * @returns Normalized country code (default: '63')
 */
export function normalizeCountryCode(
  countryCode: string | null | undefined,
): string {
  // Handle null/undefined/empty
  if (countryCode == null || countryCode === '') {
    return DEFAULT_COUNTRY_CODE;
  }

  // Strip leading + if present
  const cleaned = countryCode.replace(/^\+/, '').trim();

  // Validate: must be 1-4 digits
  if (!/^[0-9]{1,4}$/.test(cleaned)) {
    return DEFAULT_COUNTRY_CODE;
  }

  return cleaned;
}

/**
 * Normalizes a Philippine mobile number.
 *
 * Handles various input formats:
 * - '09171234567' -> '9171234567' (strips leading 0)
 * - '+639171234567' -> '9171234567' (strips +63)
 * - '639171234567' -> '9171234567' (strips 63)
 * - '9171234567' -> '9171234567' (already normalized)
 *
 * Also supports DITO numbers (starting with 8):
 * - '08941234567' -> '8941234567'
 * - '8941234567' -> '8941234567'
 *
 * @param mobileNumber - The mobile number to normalize
 * @param countryCode - Optional country code (default: '63' for PH)
 * @returns Normalized mobile number (10 digits for PH) or original if non-PH
 */
export function normalizeMobileNumber(
  mobileNumber: string | null | undefined,
  countryCode?: string | null,
): string | undefined {
  // Handle null/undefined/empty
  if (mobileNumber == null || mobileNumber === '') {
    return undefined;
  }

  // Remove all non-digit characters (spaces, dashes, etc.)
  let cleaned = mobileNumber.replace(/\D/g, '');

  // Normalize country code
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  // For Philippine numbers (country code 63), apply specific normalization
  if (normalizedCountryCode === DEFAULT_COUNTRY_CODE) {
    // Strip leading country code if present (63)
    if (cleaned.startsWith('63') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }

    // Strip leading 0 if present (converts 09xx to 9xx)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }

    // Validate PH mobile number format (10 digits starting with 8 or 9)
    if (cleaned.length === 10 && isValidPhMobilePrefix(cleaned[0])) {
      return cleaned;
    }
  }

  // For non-PH numbers or if normalization didn't apply, return cleaned version
  return cleaned;
}

/**
 * Checks if a prefix is a valid Philippine mobile prefix.
 * Valid prefixes: 8 (DITO), 9 (traditional telcos)
 *
 * @param prefix - First digit of the mobile number
 * @returns True if valid PH mobile prefix
 */
export function isValidPhMobilePrefix(prefix: string): boolean {
  return VALID_PH_MOBILE_PREFIXES.includes(prefix);
}

/**
 * Validates a Philippine mobile number.
 *
 * Valid formats (after normalization):
 * - 10 digits starting with 9 (traditional: Globe, Smart, Sun, TNT, etc.)
 * - 10 digits starting with 8 (DITO)
 *
 * @param mobileNumber - The mobile number to validate
 * @returns True if valid PH mobile number
 */
export function isValidPhMobileNumber(
  mobileNumber: string | null | undefined,
): boolean {
  if (mobileNumber == null || mobileNumber === '') {
    return false;
  }

  // Normalize first
  const normalized = normalizeMobileNumber(mobileNumber, DEFAULT_COUNTRY_CODE);

  if (!normalized || normalized.length !== 10) {
    return false;
  }

  // Check first digit is valid PH prefix (8 for DITO, 9 for traditional)
  return isValidPhMobilePrefix(normalized[0]);
}

/**
 * Result type for mobile number normalization with country code handling
 */
export interface NormalizedMobileInfo {
  /** Normalized country code (without leading +) */
  countryCode: string;
  /** Normalized mobile number */
  mobileNumber?: string;
}

/**
 * Normalizes both country code and mobile number together.
 * Useful for preparing data for UnionBank UPay API.
 *
 * @param mobileNumber - Mobile number to normalize
 * @param countryCode - Optional country code (defaults to '63')
 * @returns Object with normalized country code and mobile number
 */
export function normalizeMobileInfo(
  mobileNumber: string | null | undefined,
  countryCode?: string | null,
): NormalizedMobileInfo {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const normalizedMobileNumber = normalizeMobileNumber(
    mobileNumber,
    normalizedCountryCode,
  );

  return {
    countryCode: normalizedCountryCode,
    mobileNumber: normalizedMobileNumber,
  };
}
