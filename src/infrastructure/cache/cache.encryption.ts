import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { CACHE_CONSTANTS } from './cache.constants';

// Encryption utility for cache data at rest
// Uses AES-256-GCM for authenticated encryption
export class CacheEncryption {
  private readonly key: Buffer;

  constructor(encryptionKey?: string) {
    // Use provided key or generate from environment or default
    const keySource = encryptionKey || process.env.CACHE_ENCRYPTION_KEY || '';

    if (keySource.length >= 64) {
      // Hex-encoded 256-bit key
      this.key = Buffer.from(keySource.slice(0, 64), 'hex');
    } else if (keySource.length >= 32) {
      // Raw string key (UTF-8)
      this.key = Buffer.from(keySource.slice(0, 32), 'utf-8');
    } else {
      // Generate a deterministic key from environment for consistency
      // In production, this should be set via environment variable
      this.key = randomBytes(CACHE_CONSTANTS.KEY_LENGTH);
    }
  }

  encrypt(data: string): string {
    const iv = randomBytes(CACHE_CONSTANTS.IV_LENGTH);
    const cipher = createCipheriv(
      CACHE_CONSTANTS.ENCRYPTION_ALGORITHM,
      this.key,
      iv,
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(
      CACHE_CONSTANTS.ENCRYPTION_ALGORITHM,
      this.key,
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Check if data appears to be encrypted (has the expected format)
  isEncrypted(data: string): boolean {
    const parts = data.split(':');
    if (parts.length !== 3) return false;

    const [ivHex, authTagHex] = parts;
    return (
      ivHex.length === CACHE_CONSTANTS.IV_LENGTH * 2 &&
      authTagHex.length === CACHE_CONSTANTS.AUTH_TAG_LENGTH * 2
    );
  }
}
