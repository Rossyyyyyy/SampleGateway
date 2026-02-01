import { Module } from '@nestjs/common';
import { UnionbankApiClient, UnionbankOAuthClient } from './client';
import {
  UnionbankAccountService,
  UnionbankInstapayService,
  UnionbankPesonetService,
  UnionbankUpayService,
  UnionbankUpayRedirectService,
} from './services';
import { ReferenceValidationService } from './validators';

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
  ],
  exports: [
    UnionbankInstapayService,
    UnionbankPesonetService,
    UnionbankAccountService,
    UnionbankUpayService,
    UnionbankUpayRedirectService,
    ReferenceValidationService,
  ],
})
export class UnionbankModule {}
