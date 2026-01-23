import { registerAs } from '@nestjs/config';

export interface AppConfigType {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  name: string;
}

export const appConfig = registerAs(
  'app',
  (): AppConfigType => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    apiVersion: process.env.API_VERSION ?? 'v1',
    name: process.env.APP_NAME ?? 'inspirewallet-gateway',
  }),
);
