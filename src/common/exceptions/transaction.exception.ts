import { HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constant';
import { BaseException } from './base.exception';

export class TransactionFailedException extends BaseException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      ErrorCodes.TRANSACTION_FAILED,
      message,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}

export class TransactionNotFoundException extends BaseException {
  constructor(referenceId: string) {
    super(
      ErrorCodes.TRANSACTION_NOT_FOUND,
      `Transaction not found: ${referenceId}`,
      HttpStatus.NOT_FOUND,
      {
        referenceId,
      },
    );
  }
}

export class DuplicateTransactionException extends BaseException {
  constructor(idempotencyKey: string) {
    super(
      ErrorCodes.DUPLICATE_REQUEST,
      'Duplicate transaction request detected',
      HttpStatus.CONFLICT,
      { idempotencyKey },
    );
  }
}

export class InsufficientFundsException extends BaseException {
  constructor(message: string = 'Insufficient funds for this transaction') {
    super(
      ErrorCodes.INSUFFICIENT_FUNDS,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class InvalidAmountException extends BaseException {
  constructor(amount: number, reason?: string) {
    super(
      ErrorCodes.INVALID_AMOUNT,
      reason ?? 'Invalid transaction amount',
      HttpStatus.BAD_REQUEST,
      { amount },
    );
  }
}
