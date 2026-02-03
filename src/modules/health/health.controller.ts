import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { CacheHealthIndicator } from './indicators/cache.indicator';
import { FirebaseHealthIndicator } from './indicators/firebase.indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly cacheIndicator: CacheHealthIndicator,
    private readonly firebaseIndicator: FirebaseHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.cacheIndicator.isHealthy('cache'),
      () => this.firebaseIndicator.isHealthy('firebase'),
    ]);
  }

  @Public()
  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Public()
  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.cacheIndicator.isHealthy('cache'),
      () => this.firebaseIndicator.isHealthy('firebase'),
    ]);
  }
}
