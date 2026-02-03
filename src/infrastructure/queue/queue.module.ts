import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisConfigType } from '../../config/redis.config';
import { QUEUE_NAMES } from './queue.constants';
import { TransactionProcessor } from './processors/transaction.processor';
import { WebhookProcessor } from './processors/webhook.processor';

// Re-export for backward compatibility
export { QUEUE_NAMES } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<RedisConfigType>('redis');
        return {
          redis: {
            host: redisConfig?.host ?? 'localhost',
            port: redisConfig?.port ?? 6379,
            password: redisConfig?.password || undefined,
            db: redisConfig?.db ?? 0,
          },
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.TRANSACTION },
      { name: QUEUE_NAMES.WEBHOOK },
    ),
  ],
  providers: [TransactionProcessor, WebhookProcessor],
  exports: [BullModule],
})
export class QueueModule {}
