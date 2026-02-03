import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CacheHealthIndicator } from './indicators/cache.indicator';
import { FirebaseHealthIndicator } from './indicators/firebase.indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [CacheHealthIndicator, FirebaseHealthIndicator],
})
export class HealthModule {}
