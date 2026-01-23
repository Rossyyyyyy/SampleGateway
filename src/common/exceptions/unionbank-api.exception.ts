import { HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constant';
import { BaseException } from './base.exception';

export interface UnionbankErrorDetails extends Record<string, unknown> {
  endpoint: string;
  statusCode?: number;
  responseBody?: unknown;
  requestId?: string;
}

export class UnionbankApiException extends BaseException {
  constructor(message: string, details?: UnionbankErrorDetails) {
    super(
      ErrorCodes.UNIONBANK_API_ERROR,
      message,
      HttpStatus.BAD_GATEWAY,
      details,
    );
  }
}

export class UnionbankAuthException extends BaseException {
  constructor(message: string = 'UnionBank authentication failed') {
    super(ErrorCodes.UNIONBANK_AUTH_FAILED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class UnionbankTimeoutException extends BaseException {
  constructor(endpoint: string) {
    super(
      ErrorCodes.UNIONBANK_TIMEOUT,
      `UnionBank API timeout on ${endpoint}`,
      HttpStatus.GATEWAY_TIMEOUT,
      {
        endpoint,
      },
    );
  }
}
