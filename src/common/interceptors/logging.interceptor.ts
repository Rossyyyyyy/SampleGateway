import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

interface LogContext {
  method: string;
  url: string;
  requestId: string;
  userAgent: string;
  ip: string;
  duration: number;
  statusCode: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, headers, ip } = request;
    const requestId = (headers['x-request-id'] as string) ?? '';
    const userAgent = headers['user-agent'] ?? '';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const logContext: LogContext = {
            method,
            url,
            requestId,
            userAgent,
            ip: ip ?? '',
            duration: Date.now() - startTime,
            statusCode: response.statusCode,
          };
          this.logger.log(
            `${method} ${url} ${response.statusCode} ${logContext.duration}ms`,
            logContext,
          );
        },
        error: (error: Error) => {
          const logContext: LogContext = {
            method,
            url,
            requestId,
            userAgent,
            ip: ip ?? '',
            duration: Date.now() - startTime,
            statusCode: response.statusCode,
          };
          this.logger.error(
            `${method} ${url} ${error.message}`,
            error.stack,
            logContext,
          );
        },
      }),
    );
  }
}
