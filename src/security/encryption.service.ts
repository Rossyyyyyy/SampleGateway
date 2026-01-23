import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityConfigType } from '../config/security.config';
import {
  decrypt,
  encrypt,
  EncryptedData,
  maskAccountNumber,
} from '../common/utils/crypto.util';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    const securityConfig =
      this.configService.get<SecurityConfigType>('security');
    this.encryptionKey = securityConfig?.encryptionKey ?? '';
  }

  encrypt(plaintext: string): EncryptedData {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }
    return encrypt(plaintext, this.encryptionKey);
  }

  decrypt(encryptedData: EncryptedData): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }
    return decrypt(encryptedData, this.encryptionKey);
  }

  encryptToString(plaintext: string): string {
    const encrypted = this.encrypt(plaintext);
    return JSON.stringify(encrypted);
  }

  decryptFromString(encryptedString: string): string {
    const encrypted = JSON.parse(encryptedString) as EncryptedData;
    return this.decrypt(encrypted);
  }

  maskSensitiveData(data: string, type: 'account' | 'card' | 'phone'): string {
    switch (type) {
      case 'account':
        return maskAccountNumber(data);
      case 'card':
        return this.maskCardNumber(data);
      case 'phone':
        return this.maskPhoneNumber(data);
      default:
        return data;
    }
  }

  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 8) return '****';
    return (
      cardNumber.slice(0, 4) +
      '*'.repeat(cardNumber.length - 8) +
      cardNumber.slice(-4)
    );
  }

  private maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return '****';
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }
}
