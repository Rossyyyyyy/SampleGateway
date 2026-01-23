import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.constant';

export interface ExceptionPayload {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
}

export class BaseException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly details?: Record<string, unknown>,
  ) {
    super(
      {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      } satisfies ExceptionPayload,
      status,
    );
  }

  getErrorCode(): ErrorCode {
    return this.code;
  }
}
