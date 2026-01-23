import { registerAs } from '@nestjs/config';

export interface SecurityConfigType {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  encryptionKey: string;
  encryptionAlgorithm: string;
  rateLimitTtl: number;
  rateLimitMax: number;
  apiKeyHeader: string;
}

export const securityConfig = registerAs(
  'security',
  (): SecurityConfigType => ({
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    encryptionKey: process.env.ENCRYPTION_KEY ?? '',
    encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM ?? 'aes-256-gcm',
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    apiKeyHeader: process.env.API_KEY_HEADER ?? 'x-api-key',
  }),
);
