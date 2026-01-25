import {
  encryptUpayRedirectPayload,
  createUpayRedirectUrl,
} from './upay-redirect-encryption.util';

describe('UpayRedirectEncryptionUtil', () => {
  // Test AES key (32 bytes = 64 hex characters)
  const TEST_AES_KEY =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const TEST_DOMAIN = 'pay.unionbankph.com';
  const TEST_BILLER_UUID = 'test-biller-uuid-12345';

  describe('encryptUpayRedirectPayload', () => {
    it('should encrypt a payload and return base64 string', () => {
      const payload = {
        senderRefId: 'TEST-123',
        amount: 1000,
        email: 'test@example.com',
      };

      const result = encryptUpayRedirectPayload(payload, TEST_AES_KEY);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Base64 strings should only contain valid base64 characters
      expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should generate different encrypted strings for same payload (due to random IV)', () => {
      const payload = {
        senderRefId: 'TEST-123',
        amount: 1000,
      };

      const result1 = encryptUpayRedirectPayload(payload, TEST_AES_KEY);
      const result2 = encryptUpayRedirectPayload(payload, TEST_AES_KEY);

      // Results should be different due to random IV
      expect(result1).not.toBe(result2);
    });

    it('should handle complex payloads with nested objects', () => {
      const payload = {
        senderRefId: 'TEST-123',
        amount: 1000,
        email: 'test@example.com',
        references: [
          { index: 1, value: 'John' },
          { index: 2, value: '1234567890' },
        ],
      };

      const result = encryptUpayRedirectPayload(payload, TEST_AES_KEY);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should throw error if AES key is empty', () => {
      const payload = { test: 'data' };

      expect(() => {
        encryptUpayRedirectPayload(payload, '');
      }).toThrow('AES key is required');
    });

    it('should accept hex format AES key (64 characters)', () => {
      const payload = { test: 'data' };
      const hexKey = 'a'.repeat(64); // 64 hex characters

      const result = encryptUpayRedirectPayload(payload, hexKey);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should accept base64 format AES key', () => {
      const payload = { test: 'data' };
      // Base64 encoded 32-byte key
      const base64Key = Buffer.from('a'.repeat(32)).toString('base64');

      const result = encryptUpayRedirectPayload(payload, base64Key);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should throw error for invalid AES key format', () => {
      const payload = { test: 'data' };
      const invalidKey = 'too-short'; // Less than 32 bytes

      expect(() => {
        encryptUpayRedirectPayload(payload, invalidKey);
      }).toThrow('Invalid AES key format');
    });
  });

  describe('createUpayRedirectUrl', () => {
    it('should create a valid redirect URL', () => {
      const payload = {
        senderRefId: 'TEST-123',
        amount: 1000,
        email: 'test@example.com',
      };

      const url = createUpayRedirectUrl(
        payload,
        TEST_AES_KEY,
        TEST_DOMAIN,
        TEST_BILLER_UUID,
      );

      expect(url).toBeDefined();
      expect(url).toContain('https://');
      expect(url).toContain(TEST_DOMAIN);
      expect(url).toContain('/UPAY/WhiteLabel/');
      expect(url).toContain(TEST_BILLER_UUID);
      expect(url).toContain('?s=');
    });

    it('should URL encode the encrypted parameter', () => {
      const payload = {
        senderRefId: 'TEST-123',
        amount: 1000,
      };

      const url = createUpayRedirectUrl(
        payload,
        TEST_AES_KEY,
        TEST_DOMAIN,
        TEST_BILLER_UUID,
      );

      const urlObj = new URL(url);
      const encryptedParam = urlObj.searchParams.get('s');

      expect(encryptedParam).toBeDefined();
      expect(encryptedParam).not.toContain(' ');
      // Base64 can contain '+', but URL encoding converts it to '%2B'
      // The decoded parameter should be valid base64
      if (encryptedParam) {
        // Decode URL encoding to check base64 validity
        const decoded = decodeURIComponent(encryptedParam);
        expect(decoded).toMatch(/^[A-Za-z0-9+/=]+$/);
      }
    });

    it('should throw error if domain is empty', () => {
      const payload = { test: 'data' };

      expect(() => {
        createUpayRedirectUrl(payload, TEST_AES_KEY, '', TEST_BILLER_UUID);
      }).toThrow('Redirect domain is required');
    });

    it('should throw error if biller UUID is empty', () => {
      const payload = { test: 'data' };

      expect(() => {
        createUpayRedirectUrl(payload, TEST_AES_KEY, TEST_DOMAIN, '');
      }).toThrow('Biller UUID is required');
    });

    it('should create different URLs for same payload (due to random IV)', () => {
      const payload = {
        senderRefId: 'TEST-123',
        amount: 1000,
      };

      const url1 = createUpayRedirectUrl(
        payload,
        TEST_AES_KEY,
        TEST_DOMAIN,
        TEST_BILLER_UUID,
      );
      const url2 = createUpayRedirectUrl(
        payload,
        TEST_AES_KEY,
        TEST_DOMAIN,
        TEST_BILLER_UUID,
      );

      // URLs should be different due to random IV
      expect(url1).not.toBe(url2);
    });
  });
});
