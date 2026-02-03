import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnionbankApiClient, UnionbankOAuthClient } from './client';
import {
  UnionbankAccountService,
  UnionbankInstapayService,
  UnionbankPesonetService,
  UnionbankUpayService,
  UnionbankUpayRedirectService,
} from './services';
import {
  ReferenceValidationService,
  PaymentMethodValidationService,
} from './validators';
import { UnionbankConfigType } from '../../config/unionbank.config';

@Module({
  providers: [
    UnionbankOAuthClient,
    UnionbankApiClient,
    UnionbankInstapayService,
    UnionbankPesonetService,
    UnionbankAccountService,
    UnionbankUpayService,
    UnionbankUpayRedirectService,
    ReferenceValidationService,
    PaymentMethodValidationService,
  ],
  exports: [
    UnionbankInstapayService,
    UnionbankPesonetService,
    UnionbankAccountService,
    UnionbankUpayService,
    UnionbankUpayRedirectService,
    ReferenceValidationService,
    PaymentMethodValidationService,
  ],
})
export class UnionbankModule implements OnModuleInit {
  private readonly logger = new Logger(UnionbankModule.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const config = this.configService.get<UnionbankConfigType>('unionbank');

    if (!config) {
      this.logger.warn('UnionBank configuration not found!');
      return;
    }

    const envLabel = config.env.toUpperCase();
    const isUat = config.env === 'uat';

    const separator = '════════════════════════════════════════════════';
    const envStatus = isUat ? 'UAT: ' : 'SANDBOX: ';
    const partnerId = config.partnerId
      ? config.partnerId.slice(0, 8) + '...'
      : '(not set)';
    const billerUuid = config.upayBillerUuid || '(not set)';

    this.logger.log(separator);
    this.logger.log(`  UnionBank Environment: ${envLabel} ${envStatus}`);
    this.logger.log(`  Base URL: ${config.baseUrl}`);
    this.logger.log(`  Token Endpoint: ${config.tokenEndpoint}`);
    this.logger.log(`  UPay Endpoint: ${config.upayEndpoint}`);
    this.logger.log(`  Partner ID: ${partnerId}`);
    this.logger.log(`  Biller UUID: ${billerUuid}`);
    this.logger.log(separator);
  }
}
