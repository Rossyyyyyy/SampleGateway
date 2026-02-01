import { Module } from '@nestjs/common';
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
export class UnionbankModule {}
