import { Injectable, Logger } from '@nestjs/common';
import type {
  UpayPaymentChannel,
  UpayBiller,
  UpayBillerUuidResponse,
} from '../dto/response/upay-biller.response.dto';
import {
  MatchedPaymentChannel,
  PaymentMethodValidationError,
  PaymentMethodValidationResult,
  PAYMENT_METHOD_TO_CHANNEL_CODE,
} from './payment-method-validation.types';

/**
 * Service for validating payment methods against biller-enabled/availed channels.
 *
 * This service validates that a requested payment method is:
 * 1. Configured for the biller (exists in paymentChannels)
 * 2. Enabled (isEnabled: true)
 * 3. Availed by the biller (isAvailed: true)
 *
 * @example
 * ```typescript
 * const result = paymentMethodValidationService.validatePaymentMethod(
 *   billerDetails,
 *   'instapay'
 * );
 * if (!result.isValid) {
 *   throw new PaymentMethodValidationException(result.error);
 * }
 * ```
 */
@Injectable()
export class PaymentMethodValidationService {
  private readonly logger = new Logger(PaymentMethodValidationService.name);

  /**
   * Validates a payment method against biller's enabled/availed payment channels.
   *
   * @param billerResponse - Biller details response containing payment channels
   * @param paymentMethod - Requested payment method (e.g., 'instapay', 'ub online')
   * @returns Validation result with error details if validation fails
   */
  validatePaymentMethod(
    billerResponse: UpayBillerUuidResponse,
    paymentMethod: string,
  ): PaymentMethodValidationResult {
    // Get the first biller from the response (API returns array but typically one biller)
    const biller = billerResponse.billers?.[0];

    if (!biller) {
      return this.createFailureResult(
        paymentMethod,
        [],
        'No biller information found',
        'NO_CHANNELS_CONFIGURED',
      );
    }

    return this.validateAgainstBillerChannels(biller, paymentMethod);
  }

  /**
   * Validates payment method against a specific biller's channels.
   *
   * @param biller - Biller information with payment channels
   * @param paymentMethod - Requested payment method
   * @returns Validation result
   */
  validateAgainstBillerChannels(
    biller: UpayBiller,
    paymentMethod: string,
  ): PaymentMethodValidationResult {
    const paymentChannels = biller.paymentChannels ?? [];

    // Check if any channels are configured
    if (paymentChannels.length === 0) {
      this.logger.warn(
        `No payment channels configured for biller: ${biller.billerUuid}`,
      );
      return this.createFailureResult(
        paymentMethod,
        [],
        `No payment channels are configured for biller ${biller.billerName}`,
        'NO_CHANNELS_CONFIGURED',
      );
    }

    // Get enabled AND availed channels (both conditions must be true)
    const enabledAndAvailedChannels =
      this.getEnabledAndAvailedChannels(paymentChannels);
    const enabledMethodNames = enabledAndAvailedChannels.map((c) =>
      this.normalizeChannelCode(c.code),
    );

    // Find matching channel
    const matchedChannel = this.findMatchingChannel(
      paymentChannels,
      paymentMethod,
    );

    if (!matchedChannel) {
      return this.createFailureResult(
        paymentMethod,
        enabledMethodNames,
        `Payment method '${paymentMethod}' is not available for this biller. Available methods: ${enabledMethodNames.join(', ')}`,
        'METHOD_NOT_FOUND',
      );
    }

    // Check if channel is enabled
    if (!matchedChannel.isEnabled) {
      return this.createFailureResult(
        paymentMethod,
        enabledMethodNames,
        `Payment method '${paymentMethod}' is not enabled for biller ${biller.billerName}`,
        'METHOD_NOT_ENABLED',
      );
    }

    // Check if biller has availed this channel
    if (!matchedChannel.isAvailed) {
      return this.createFailureResult(
        paymentMethod,
        enabledMethodNames,
        `Payment method '${paymentMethod}' has not been availed by biller ${biller.billerName}`,
        'METHOD_NOT_AVAILED',
      );
    }

    this.logger.debug(
      `Payment method '${paymentMethod}' validated successfully for biller: ${biller.billerUuid}`,
    );

    // Return success with matched channel info
    return {
      isValid: true,
      matchedChannel: this.mapToMatchedChannel(matchedChannel),
    };
  }

  /**
   * Gets all channels that are both enabled AND availed.
   */
  private getEnabledAndAvailedChannels(
    channels: readonly UpayPaymentChannel[],
  ): UpayPaymentChannel[] {
    return channels.filter((c) => c.isEnabled && c.isAvailed);
  }

  /**
   * Finds a matching channel for the given payment method.
   * Uses the PAYMENT_METHOD_TO_CHANNEL_CODE mapping for flexible matching.
   */
  private findMatchingChannel(
    channels: readonly UpayPaymentChannel[],
    paymentMethod: string,
  ): UpayPaymentChannel | undefined {
    const normalizedMethod = paymentMethod.toLowerCase().trim();

    // Get possible channel codes for this payment method
    const possibleCodes =
      PAYMENT_METHOD_TO_CHANNEL_CODE[normalizedMethod] ?? [];

    // Try to find a matching channel by code
    for (const channel of channels) {
      const normalizedCode = this.normalizeChannelCode(channel.code);
      const normalizedName = channel.name.toUpperCase();

      // Check if the channel code matches any of the possible codes
      if (
        possibleCodes.some(
          (code) =>
            code.toUpperCase() === normalizedCode ||
            code.toUpperCase() === normalizedName,
        )
      ) {
        return channel;
      }
    }

    // Fallback: Try direct matching against channel code or name
    for (const channel of channels) {
      const normalizedCode = this.normalizeChannelCode(channel.code);
      const normalizedName = channel.name.toLowerCase();

      if (
        normalizedCode.toLowerCase() === normalizedMethod ||
        normalizedName === normalizedMethod ||
        normalizedName.includes(normalizedMethod) ||
        normalizedMethod.includes(normalizedName)
      ) {
        return channel;
      }
    }

    return undefined;
  }

  /**
   * Normalizes a channel code for comparison.
   */
  private normalizeChannelCode(code: string): string {
    return code.toUpperCase().trim();
  }

  /**
   * Maps UpayPaymentChannel to MatchedPaymentChannel.
   */
  private mapToMatchedChannel(
    channel: UpayPaymentChannel,
  ): MatchedPaymentChannel {
    return {
      name: channel.name,
      code: channel.code,
      isEnabled: channel.isEnabled,
      isAvailed: channel.isAvailed,
      chargeTo: channel.chargeTo,
      fee: channel.fee,
      transactionLimit: channel.transactionLimit,
    };
  }

  /**
   * Creates a failure validation result.
   */
  private createFailureResult(
    requestedMethod: string,
    availableMethods: readonly string[],
    message: string,
    code: PaymentMethodValidationError['code'],
  ): PaymentMethodValidationResult {
    this.logger.debug(
      `Payment method validation failed: ${message} [code: ${code}]`,
    );

    return {
      isValid: false,
      error: {
        requestedMethod,
        availableMethods,
        message,
        code,
      },
    };
  }
}
