import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { RedisService } from '../../../infrastructure/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.redis.healthCheck();

    const result = this.getStatus(key, isHealthy, { service: 'redis' });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Redis health check failed', result);
  }
}
