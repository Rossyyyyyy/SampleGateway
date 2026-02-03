import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { FirebaseHealthIndicator } from './indicators/firebase.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [FirebaseHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
