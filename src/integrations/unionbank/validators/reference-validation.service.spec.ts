import { ReferenceValidationService } from './reference-validation.service';
import type { UpayBillerReference } from '../dto/response/upay-biller.response.dto';

describe('ReferenceValidationService', () => {
  let service: ReferenceValidationService;

  beforeEach(() => {
    service = new ReferenceValidationService();
  });

  describe('validateReferences', () => {
    it('should return valid result for valid references', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'First Name',
          fieldType: 'ALPHANUMERIC',
          validations: {
            minCharLength: '1',
            maxCharLength: '50',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [{ index: 1, value: 'John' }];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for missing required field', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Account Number',
          fieldType: 'NUMERIC',
          validations: {
            minCharLength: '9',
            maxCharLength: '9',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences: Array<{ index: number; value: string }> = [];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('REQUIRED');
      expect(result.errors[0].name).toBe('Account Number');
    });

    it('should return error for value below minimum length', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'TIN',
          fieldType: 'NUMERIC',
          validations: {
            minCharLength: '9',
            maxCharLength: '12',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [{ index: 1, value: '123' }];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1); // Only MIN_LENGTH since '123' is valid numeric
      expect(result.errors.some((e) => e.code === 'MIN_LENGTH')).toBe(true);
    });

    it('should return error for value exceeding maximum length', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Reference Number',
          fieldType: 'ALPHANUMERIC',
          validations: {
            minCharLength: '1',
            maxCharLength: '5',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [{ index: 1, value: '1234567890' }];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MAX_LENGTH');
    });

    it('should return error for NUMERIC field with letters', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Account Number',
          fieldType: 'NUMERIC',
          validations: {
            minCharLength: '1',
            maxCharLength: '20',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [{ index: 1, value: 'ABC123' }];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
      expect(result.errors[0].message).toContain('numbers');
    });

    it('should return error for ALPHABETIC field with numbers', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Name',
          fieldType: 'ALPHABETIC',
          validations: {
            minCharLength: '1',
            maxCharLength: '50',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [{ index: 1, value: 'John123' }];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
      expect(result.errors[0].message).toContain('letters');
    });

    it('should skip validation for non-visible non-required fields', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Internal Reference',
          fieldType: 'NUMERIC',
          validations: {
            minCharLength: '10',
            maxCharLength: '10',
            isMasked: false,
            isRequired: false,
            isVisible: false,
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences: Array<{ index: number; value: string }> = [];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip further validation for empty non-required fields', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Optional Field',
          fieldType: 'NUMERIC',
          validations: {
            minCharLength: '5',
            maxCharLength: '10',
            isMasked: false,
            isRequired: false,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [{ index: 1, value: '' }];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate multiple references and return all errors', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Name',
          fieldType: 'ALPHABETIC',
          validations: {
            minCharLength: '2',
            maxCharLength: '50',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
        {
          billerReferenceId: '2',
          index: '2',
          name: 'Account Number',
          fieldType: 'NUMERIC',
          validations: {
            minCharLength: '9',
            maxCharLength: '9',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [
        { index: 1, value: 'J' }, // Too short
        { index: 2, value: 'ABC' }, // Wrong type
      ];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle string index in input references', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Name',
          fieldType: 'ALPHANUMERIC',
          validations: {
            minCharLength: '1',
            maxCharLength: '50',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [{ index: '1', value: 'John' }];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(true);
    });

    it('should handle boolean isVisible', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Visible Field',
          fieldType: 'ALPHANUMERIC',
          validations: {
            minCharLength: '1',
            maxCharLength: '50',
            isMasked: false,
            isRequired: true,
            isVisible: true,
            fieldValidationType: { name: 'Simple' },
          },
        },
      ];

      const inputReferences = [{ index: 1, value: 'Test' }];

      const result = service.validateReferences(
        billerReferences,
        inputReferences,
      );

      expect(result.isValid).toBe(true);
    });

    it('should validate Email field validation type', () => {
      const billerReferences: UpayBillerReference[] = [
        {
          billerReferenceId: '1',
          index: '1',
          name: 'Email',
          fieldType: 'TEXT', // Using TEXT to avoid ALPHANUMERIC conflict with email chars
          validations: {
            minCharLength: '5',
            maxCharLength: '100',
            isMasked: false,
            isRequired: true,
            isVisible: 'true',
            fieldValidationType: { name: 'Email' },
          },
        },
      ];

      // Invalid email
      let result = service.validateReferences(billerReferences, [
        { index: 1, value: 'notanemail' },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('PATTERN_MISMATCH');

      // Valid email
      result = service.validateReferences(billerReferences, [
        { index: 1, value: 'test@example.com' },
      ]);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateReferencesFromResponse', () => {
    it('should work with full response object', () => {
      const response = {
        references: [
          {
            billerReferenceId: '1',
            index: '1',
            name: 'Name',
            fieldType: 'ALPHANUMERIC',
            validations: {
              minCharLength: '1',
              maxCharLength: '50',
              isMasked: false,
              isRequired: true,
              isVisible: 'true',
              fieldValidationType: { name: 'Simple' },
            },
          },
        ],
      };

      const result = service.validateReferencesFromResponse(response, [
        { index: 1, value: 'Test' },
      ]);

      expect(result.isValid).toBe(true);
    });

    it('should handle empty references array', () => {
      const response = { references: [] };

      const result = service.validateReferencesFromResponse(response, []);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
