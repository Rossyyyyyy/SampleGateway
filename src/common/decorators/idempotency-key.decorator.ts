import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key';

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.headers[IDEMPOTENCY_KEY_HEADER] as string | undefined;
  },
);
