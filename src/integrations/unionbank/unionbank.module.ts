import { Module } from '@nestjs/common';
import { UnionbankApiClient, UnionbankOAuthClient } from './client';
import {
  UnionbankAccountService,
  UnionbankInstapayService,
  UnionbankPesonetService,
  UnionbankUpayService,
  UnionbankUpayRedirectService,
} from './services';

@Module({
  providers: [
    UnionbankOAuthClient,
    UnionbankApiClient,
    UnionbankInstapayService,
    UnionbankPesonetService,
    UnionbankAccountService,
    UnionbankUpayService,
    UnionbankUpayRedirectService,
  ],
  exports: [
    UnionbankInstapayService,
    UnionbankPesonetService,
    UnionbankAccountService,
    UnionbankUpayService,
    UnionbankUpayRedirectService,
  ],
})
export class UnionbankModule {}
