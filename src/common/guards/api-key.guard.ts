import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SecurityConfigType } from '../../config/security.config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const securityConfig =
      this.configService.get<SecurityConfigType>('security');
    const apiKeyHeader = securityConfig?.apiKeyHeader ?? 'x-api-key';
    const apiKey = request.headers[apiKeyHeader] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // In production, validate against stored API keys
    // This is a placeholder for the actual validation logic
    const isValid = this.validateApiKey(apiKey);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private validateApiKey(apiKey: string): boolean {
    // TODO: Implement actual API key validation against database
    // For now, return true for non-empty keys in development
    return apiKey.length > 0;
  }
}
