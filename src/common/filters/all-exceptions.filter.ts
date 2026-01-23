import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException, ExceptionPayload } from '../exceptions/base.exception';
import { ErrorCodes } from '../constants/error-codes.constant';

interface ErrorResponse {
  success: false;
  error: ExceptionPayload;
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) ?? '';

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof BaseException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as ExceptionPayload;
      errorResponse = {
        success: false,
        error: {
          ...exceptionResponse,
          path: request.url,
        },
        requestId,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message;
      errorResponse = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: Array.isArray(message)
            ? message.join(', ')
            : String(message),
          timestamp: new Date().toISOString(),
          path: request.url,
        },
        requestId,
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        exception instanceof Error
          ? exception.message
          : 'Internal server error';
      errorResponse = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message,
          timestamp: new Date().toISOString(),
          path: request.url,
        },
        requestId,
      };

      this.logger.error(
        `Unhandled exception: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(errorResponse);
  }
}
