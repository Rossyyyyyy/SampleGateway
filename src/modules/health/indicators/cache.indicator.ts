import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { CacheService } from '../../../infrastructure/cache/cache.service';

@Injectable()
export class CacheHealthIndicator extends HealthIndicator {
  constructor(private readonly cache: CacheService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.cache.healthCheck();
    const stats = this.cache.getStats();

    const result = this.getStatus(key, isHealthy, {
      service: 'local-cache',
      entries: stats.entries,
      hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
      circuitState: stats.circuitState,
    });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Cache health check failed', result);
  }
}
