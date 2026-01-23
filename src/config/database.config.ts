import { registerAs } from '@nestjs/config';

export interface DatabaseConfigType {
  url: string;
  maxConnections: number;
  sslEnabled: boolean;
}

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfigType => ({
    url: process.env.DATABASE_URL ?? '',
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS ?? '10', 10),
    sslEnabled: process.env.DATABASE_SSL_ENABLED === 'true',
  }),
);
