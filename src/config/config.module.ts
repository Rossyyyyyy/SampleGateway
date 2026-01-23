import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { appConfig } from './app.config';
import { databaseConfig } from './database.config';
import { redisConfig } from './redis.config';
import { unionbankConfig } from './unionbank.config';
import { securityConfig } from './security.config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        unionbankConfig,
        securityConfig,
      ],
      cache: true,
    }),
  ],
})
export class ConfigModule {}
