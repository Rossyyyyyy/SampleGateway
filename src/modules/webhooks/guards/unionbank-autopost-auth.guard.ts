import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UnionbankConfigType } from '../../../config/unionbank.config';
import { SignatureService } from '../../../security/signature.service';

const BODY_SIGNATURE_HEADER = 'x-unionbank-autopost-signature';

@Injectable()
export class UnionbankAutopostAuthGuard implements CanActivate {
  constructor(
    private readonly signatureService: SignatureService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret =
      this.configService.get<UnionbankConfigType>(
        'unionbank',
      )?.upayAutopostWebhookSecret;

    if (!secret) {
      throw new UnauthorizedException('Autopost webhook secret not configured');
    }

    const signature = request.headers[BODY_SIGNATURE_HEADER] as string;
    if (!signature) {
      throw new UnauthorizedException('Missing autopost signature header');
    }

    // Raw body must be available (set by raw-body middleware if configured)
    const rawBody =
      (request as Request & { rawBody?: string }).rawBody ??
      JSON.stringify(request.body ?? {});
    const isValid = this.signatureService.verifyWebhookSignature(
      rawBody,
      signature.trim(),
      secret,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid autopost signature');
    }
    return true;
  }
}
