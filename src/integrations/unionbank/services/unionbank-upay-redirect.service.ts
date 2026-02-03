/**
 * UPay Redirect Service
 *
 * Handles the creation of encrypted redirect URLs for UPay payments
 * using the redirect/encryption method (alternative to Direct API)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnionbankConfigType } from '../../../config/unionbank.config';
import { normalizeMobileInfo } from '../../../common/utils';
import {
  createUpayRedirectUrl,
  encryptUpayRedirectPayload,
} from '../utils/upay-redirect-encryption.util';
import {
  CreateUpayTransactionParams,
  UpayPaymentMethod,
} from '../dto/request/upay-transaction.request.dto';

export interface UpayRedirectPayload extends Record<string, unknown> {
  senderRefId: string;
  tranRequestDate: string;
  emailAddress: string;
  /** Country code for international numbers (no leading +). Optional; default PH (63) when omitted per UB docs. */
  countryCode?: string;
  mobileNumber?: string;
  amount: number;
  paymentMethod: UpayPaymentMethod;
  skipWhitelabelPage: 'true' | 'false';
  callbackUrl: string;
  /** Back to Merchant URL (redirect when "Back to Merchant" link is clicked). Optional per PDF line 159. */
  backRedir?: string;
  references: Array<{ index: number | string; value: string }>;
}

@Injectable()
export class UnionbankUpayRedirectService {
  private readonly logger = new Logger(UnionbankUpayRedirectService.name);
  private readonly config: UnionbankConfigType;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<UnionbankConfigType>('unionbank')!;
  }

  /**
   * Creates an encrypted redirect URL for UPay payment
   *
   * @param params - UPay transaction parameters
   * @returns Encrypted redirect URL
   */
  createRedirectUrl(params: CreateUpayTransactionParams): string {
    this.logger.log(`Creating UPay redirect URL for: ${params.senderRefId}`);

    // Validate configuration
    if (!this.config.upayAesKey) {
      throw new Error(
        'UNIONBANK_UPAY_AES_KEY is not configured. Required for redirect encryption.',
      );
    }
    if (!this.config.upayRedirectDomain) {
      throw new Error(
        'UNIONBANK_UPAY_REDIRECT_DOMAIN is not configured. Required for redirect URL.',
      );
    }
    const billerUuid = params.billerUuid ?? this.config.upayBillerUuid;
    if (!billerUuid) {
      throw new Error(
        'Biller ID is required. Set billerUuid in params or configure UNIONBANK_UPAY_BILLER_ID.',
      );
    }

    // Prepare the payload
    const now = new Date();
    const tranRequestDate = now.toISOString().replace('Z', '');

    // Normalize country code (defaults to PH 63) and mobile number (supports DITO +63 8)
    const mobileInfo = normalizeMobileInfo(
      params.mobileNumber,
      params.countryCode,
    );

    const payload: UpayRedirectPayload = {
      senderRefId: params.senderRefId,
      tranRequestDate,
      emailAddress: params.emailAddress,
      // Always include countryCode (normalized, defaults to '63' per UPay docs)
      countryCode: mobileInfo.countryCode,
      mobileNumber: mobileInfo.mobileNumber,
      amount: params.amount,
      paymentMethod: params.paymentMethod ?? 'paygate',
      skipWhitelabelPage: params.skipWhitelabelPage ? 'true' : 'false',
      callbackUrl: params.callbackUrl,
      ...(params.backRedir != null &&
        params.backRedir !== '' && { backRedir: params.backRedir }),
      references: [
        { index: 1, value: params.firstName },
        { index: 2, value: params.accountNumber ?? '' },
        { index: 3, value: params.userRef ?? '' },
        { index: 4, value: params.lastName },
        { index: 5, value: params.firstName },
      ],
    };

    this.logger.debug(
      'UPay redirect payload:',
      JSON.stringify(payload, null, 2),
    );

    try {
      // Create the encrypted redirect URL
      const redirectUrl = createUpayRedirectUrl(
        payload,
        this.config.upayAesKey,
        this.config.upayRedirectDomain,
        billerUuid,
      );

      this.logger.log(
        `UPay redirect URL created successfully for: ${params.senderRefId}`,
      );
      this.logger.debug(`Redirect URL: ${redirectUrl.substring(0, 100)}...`);

      return redirectUrl;
    } catch (error) {
      this.logger.error(
        `Failed to create UPay redirect URL: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Encrypts a payload for UPay redirect (useful for testing)
   *
   * @param payload - Payload to encrypt
   * @returns Base64 encoded encrypted string
   */
  encryptPayload(payload: Record<string, unknown>): string {
    if (!this.config.upayAesKey) {
      throw new Error('UNIONBANK_UPAY_AES_KEY is not configured');
    }

    return encryptUpayRedirectPayload(payload, this.config.upayAesKey);
  }
}
