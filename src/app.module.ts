import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Config
import { ConfigModule } from './config';

// Infrastructure
// DatabaseModule removed - using Firebase Firestore instead
import { FirebaseModule } from './infrastructure/firebase';
import { HttpModule } from './infrastructure/http';
import { QueueModule } from './infrastructure/queue';
import { RedisModule } from './infrastructure/redis';

// Integrations
import { UnionbankModule } from './integrations/unionbank';

// Common
import { AllExceptionsFilter } from './common/filters';
import { JwtAuthGuard } from './common/guards';
import {
  LoggingInterceptor,
  TimeoutInterceptor,
  TransformResponseInterceptor,
} from './common/interceptors';
import { RequestIdMiddleware } from './common/middleware';

// Security & Audit
import { AuditModule } from './audit';
import { SecurityModule } from './security';

// Domain Modules
import { AuthModule } from './modules/auth';
import { DepositsModule } from './modules/deposits';
import { HealthModule } from './modules/health';
import { TransfersModule } from './modules/transfers';
import { UpayModule } from './modules/upay';
import { WebhooksModule } from './modules/webhooks';

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Infrastructure
    FirebaseModule,
    RedisModule,
    HttpModule,
    QueueModule,

    // Security & Audit
    SecurityModule,
    AuditModule,

    // Integrations
    UnionbankModule,

    // Domain Modules
    AuthModule,
    DepositsModule,
    HealthModule,
    TransfersModule,
    UpayModule,
    WebhooksModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
