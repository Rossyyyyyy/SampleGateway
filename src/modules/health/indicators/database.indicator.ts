import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.prisma.healthCheck();

    const result = this.getStatus(key, isHealthy, { database: 'postgresql' });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Database health check failed', result);
  }
}
