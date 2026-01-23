import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { FirebaseService } from '../../../infrastructure/firebase/firebase.service';

@Injectable()
export class FirebaseHealthIndicator extends HealthIndicator {
  constructor(private readonly firebase: FirebaseService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.firebase.healthCheck();

    const result = this.getStatus(key, isHealthy, { service: 'firebase' });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Firebase health check failed', result);
  }
}
