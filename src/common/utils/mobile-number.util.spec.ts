import {
  normalizeCountryCode,
  normalizeMobileNumber,
  isValidPhMobileNumber,
  isValidPhMobilePrefix,
  normalizeMobileInfo,
  DEFAULT_COUNTRY_CODE,
  VALID_PH_MOBILE_PREFIXES,
} from './mobile-number.util';

describe('mobile-number.util', () => {
  describe('normalizeCountryCode', () => {
    it('should return default country code (63) for null', () => {
      expect(normalizeCountryCode(null)).toBe('63');
    });

    it('should return default country code (63) for undefined', () => {
      expect(normalizeCountryCode(undefined)).toBe('63');
    });

    it('should return default country code (63) for empty string', () => {
      expect(normalizeCountryCode('')).toBe('63');
    });

    it('should strip leading + from country code', () => {
      expect(normalizeCountryCode('+63')).toBe('63');
      expect(normalizeCountryCode('+1')).toBe('1');
      expect(normalizeCountryCode('+44')).toBe('44');
    });

    it('should return valid country codes as-is', () => {
      expect(normalizeCountryCode('63')).toBe('63');
      expect(normalizeCountryCode('1')).toBe('1');
      expect(normalizeCountryCode('44')).toBe('44');
      expect(normalizeCountryCode('852')).toBe('852');
      expect(normalizeCountryCode('1234')).toBe('1234');
    });

    it('should return default for invalid country codes (non-numeric)', () => {
      expect(normalizeCountryCode('abc')).toBe('63');
      expect(normalizeCountryCode('6a')).toBe('63');
      expect(normalizeCountryCode('++63')).toBe('63');
    });

    it('should return default for country codes longer than 4 digits', () => {
      expect(normalizeCountryCode('12345')).toBe('63');
    });

    it('should trim whitespace', () => {
      expect(normalizeCountryCode(' 63 ')).toBe('63');
    });
  });

  describe('normalizeMobileNumber', () => {
    describe('Philippine numbers (country code 63)', () => {
      it('should strip leading 0 from PH numbers', () => {
        expect(normalizeMobileNumber('09171234567', '63')).toBe('9171234567');
        expect(normalizeMobileNumber('09181234567')).toBe('9181234567');
      });

      it('should strip +63 prefix from PH numbers', () => {
        expect(normalizeMobileNumber('+639171234567', '63')).toBe('9171234567');
      });

      it('should strip 63 prefix from PH numbers', () => {
        expect(normalizeMobileNumber('639171234567', '63')).toBe('9171234567');
      });

      it('should return already normalized PH numbers as-is', () => {
        expect(normalizeMobileNumber('9171234567', '63')).toBe('9171234567');
      });

      it('should handle DITO numbers (starting with 8)', () => {
        expect(normalizeMobileNumber('08941234567', '63')).toBe('8941234567');
        expect(normalizeMobileNumber('8941234567', '63')).toBe('8941234567');
        expect(normalizeMobileNumber('638941234567', '63')).toBe('8941234567');
        expect(normalizeMobileNumber('+638941234567', '63')).toBe('8941234567');
      });

      it('should remove non-digit characters', () => {
        expect(normalizeMobileNumber('0917-123-4567', '63')).toBe('9171234567');
        expect(normalizeMobileNumber('0917 123 4567', '63')).toBe('9171234567');
        expect(normalizeMobileNumber('+63 917 123 4567', '63')).toBe(
          '9171234567',
        );
      });
    });

    describe('null/undefined/empty handling', () => {
      it('should return undefined for null', () => {
        expect(normalizeMobileNumber(null)).toBeUndefined();
      });

      it('should return undefined for undefined', () => {
        expect(normalizeMobileNumber(undefined)).toBeUndefined();
      });

      it('should return undefined for empty string', () => {
        expect(normalizeMobileNumber('')).toBeUndefined();
      });
    });

    describe('non-PH numbers', () => {
      it('should just clean non-PH numbers', () => {
        expect(normalizeMobileNumber('12025551234', '1')).toBe('12025551234');
        expect(normalizeMobileNumber('4471234567890', '44')).toBe(
          '4471234567890',
        );
      });
    });
  });

  describe('isValidPhMobilePrefix', () => {
    it('should return true for valid prefixes (8 and 9)', () => {
      expect(isValidPhMobilePrefix('8')).toBe(true);
      expect(isValidPhMobilePrefix('9')).toBe(true);
    });

    it('should return false for invalid prefixes', () => {
      expect(isValidPhMobilePrefix('0')).toBe(false);
      expect(isValidPhMobilePrefix('1')).toBe(false);
      expect(isValidPhMobilePrefix('7')).toBe(false);
    });
  });

  describe('isValidPhMobileNumber', () => {
    describe('traditional telco numbers (prefix 9)', () => {
      it('should validate correct format', () => {
        expect(isValidPhMobileNumber('9171234567')).toBe(true);
        expect(isValidPhMobileNumber('9181234567')).toBe(true);
        expect(isValidPhMobileNumber('9991234567')).toBe(true);
      });

      it('should validate numbers with leading 0', () => {
        expect(isValidPhMobileNumber('09171234567')).toBe(true);
      });

      it('should validate numbers with +63 prefix', () => {
        expect(isValidPhMobileNumber('+639171234567')).toBe(true);
      });
    });

    describe('DITO numbers (prefix 8)', () => {
      it('should validate DITO numbers', () => {
        expect(isValidPhMobileNumber('8941234567')).toBe(true);
        expect(isValidPhMobileNumber('8951234567')).toBe(true);
      });

      it('should validate DITO numbers with leading 0', () => {
        expect(isValidPhMobileNumber('08941234567')).toBe(true);
      });

      it('should validate DITO numbers with +63 prefix', () => {
        expect(isValidPhMobileNumber('+638941234567')).toBe(true);
      });
    });

    describe('invalid numbers', () => {
      it('should reject null/undefined/empty', () => {
        expect(isValidPhMobileNumber(null)).toBe(false);
        expect(isValidPhMobileNumber(undefined)).toBe(false);
        expect(isValidPhMobileNumber('')).toBe(false);
      });

      it('should reject numbers with wrong length', () => {
        expect(isValidPhMobileNumber('917123456')).toBe(false); // 9 digits
        expect(isValidPhMobileNumber('91712345678')).toBe(false); // 11 digits without 0 prefix
      });

      it('should reject numbers with invalid prefix', () => {
        expect(isValidPhMobileNumber('0171234567')).toBe(false);
        expect(isValidPhMobileNumber('7171234567')).toBe(false);
      });
    });
  });

  describe('normalizeMobileInfo', () => {
    it('should normalize both country code and mobile number', () => {
      const result = normalizeMobileInfo('09171234567', '63');
      expect(result.countryCode).toBe('63');
      expect(result.mobileNumber).toBe('9171234567');
    });

    it('should default country code to 63 when missing', () => {
      const result = normalizeMobileInfo('09171234567');
      expect(result.countryCode).toBe('63');
      expect(result.mobileNumber).toBe('9171234567');
    });

    it('should default country code to 63 when invalid', () => {
      const result = normalizeMobileInfo('09171234567', 'invalid');
      expect(result.countryCode).toBe('63');
      expect(result.mobileNumber).toBe('9171234567');
    });

    it('should handle DITO numbers correctly', () => {
      const result = normalizeMobileInfo('08941234567', '63');
      expect(result.countryCode).toBe('63');
      expect(result.mobileNumber).toBe('8941234567');
    });

    it('should handle null mobile number', () => {
      const result = normalizeMobileInfo(null, '63');
      expect(result.countryCode).toBe('63');
      expect(result.mobileNumber).toBeUndefined();
    });

    it('should preserve international country codes', () => {
      const result = normalizeMobileInfo('12025551234', '1');
      expect(result.countryCode).toBe('1');
    });
  });

  describe('constants', () => {
    it('should have correct default country code', () => {
      expect(DEFAULT_COUNTRY_CODE).toBe('63');
    });

    it('should have correct valid PH mobile prefixes', () => {
      expect(VALID_PH_MOBILE_PREFIXES).toContain('8');
      expect(VALID_PH_MOBILE_PREFIXES).toContain('9');
      expect(VALID_PH_MOBILE_PREFIXES).toHaveLength(2);
    });
  });
});
