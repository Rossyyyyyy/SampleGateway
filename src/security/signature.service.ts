import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

export interface SignaturePayload {
  timestamp: string;
  method: string;
  path: string;
  body?: string;
}

@Injectable()
export class SignatureService {
  generateSignature(payload: SignaturePayload, secret: string): string {
    const stringToSign = this.buildStringToSign(payload);
    return this.hmacSign(stringToSign, secret);
  }

  verifySignature(
    payload: SignaturePayload,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return this.timingSafeEqual(expectedSignature, signature);
  }

  private buildStringToSign(payload: SignaturePayload): string {
    const parts = [
      payload.timestamp,
      payload.method.toUpperCase(),
      payload.path,
    ];

    if (payload.body) {
      parts.push(payload.body);
    }

    return parts.join('\n');
  }

  private hmacSign(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  generateWebhookSignature(payload: string, secret: string): string {
    return this.hmacSign(payload, secret);
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.generateWebhookSignature(payload, secret);
    return this.timingSafeEqual(expectedSignature, signature);
  }
}
