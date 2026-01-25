/**
 * UPay Redirect Encryption Utility
 *
 * Implements AES-256-GCM encryption for UPay redirect URLs as per UnionBank documentation.
 *
 * Procedure:
 * 1. Prepare JSON payload
 * 2. Generate random IV (16 bytes)
 * 3. Encrypt payload using AES-256-GCM with Key + IV
 * 4. Concatenate IV + Ciphertext (as binary buffers)
 * 5. Base64 encode the result
 * 6. URL encode the Base64 string
 * 7. Construct URL: https://[Domain]/UPAY/WhiteLabel/[BillerUuid]?s=[Encrypted_String]
 *
 * Based on JavaScript sample code from UnionBank PDF (Page 15)
 */

import { createCipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES-256-GCM
const KEY_LENGTH = 32; // 32 bytes for AES-256

/**
 * Converts AES key from various formats to Buffer
 * Supports: hex string, base64 string, or direct buffer
 */
function parseAesKey(key: string): Buffer {
  // Try hex first (64 characters)
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }

  // Try base64
  try {
    const decoded = Buffer.from(key, 'base64');
    if (decoded.length === KEY_LENGTH) {
      return decoded;
    }
  } catch {
    // Not base64, continue
  }

  // If key is already the right length, use it directly
  if (key.length === KEY_LENGTH) {
    return Buffer.from(key, 'utf8');
  }

  throw new Error(
    `Invalid AES key format. Expected 32-byte key (64 hex chars or base64). Got ${key.length} chars`,
  );
}

/**
 * Encrypts a JSON payload for UPay redirect
 *
 * @param payload - JSON object to encrypt
 * @param aesKey - AES-256 key (32 bytes, hex or base64 string)
 * @returns Base64 encoded string of (IV + Ciphertext + AuthTag)
 */
export function encryptUpayRedirectPayload(
  payload: Record<string, unknown>,
  aesKey: string,
): string {
  if (!aesKey) {
    throw new Error('AES key is required for UPay redirect encryption');
  }

  // Parse the AES key
  const key = parseAesKey(aesKey);

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `AES key must be ${KEY_LENGTH} bytes. Got ${key.length} bytes`,
    );
  }

  // Convert payload to JSON string
  const plaintext = JSON.stringify(payload);

  // Generate random IV (16 bytes)
  const iv = randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encrypt the payload
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Concatenate: IV + Ciphertext + AuthTag
  // This matches the JavaScript sample code from PDF page 15
  const result = Buffer.concat([iv, encrypted, authTag]);

  // Base64 encode
  const base64Encoded = result.toString('base64');

  return base64Encoded;
}

/**
 * Creates the UPay redirect URL with encrypted payload
 *
 * @param payload - JSON payload to encrypt
 * @param aesKey - AES-256 key
 * @param domain - Redirect domain (e.g., "pay.unionbankph.com")
 * @param billerUuid - Biller UUID
 * @returns Complete redirect URL
 */
export function createUpayRedirectUrl(
  payload: Record<string, unknown>,
  aesKey: string,
  domain: string,
  billerUuid: string,
): string {
  if (!domain) {
    throw new Error('Redirect domain is required');
  }
  if (!billerUuid) {
    throw new Error('Biller UUID is required');
  }

  // Encrypt the payload
  const base64Encoded = encryptUpayRedirectPayload(payload, aesKey);

  // URL encode the Base64 string
  const urlEncoded = encodeURIComponent(base64Encoded);

  // Construct the URL
  // Format: https://[Domain]/UPAY/WhiteLabel/[BillerUuid]?s=[Encrypted_String]
  const url = `https://${domain}/UPAY/WhiteLabel/${billerUuid}?s=${urlEncoded}`;

  return url;
}
