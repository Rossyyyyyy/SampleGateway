import { Module } from '@nestjs/common';
import { UnionbankApiClient, UnionbankOAuthClient } from './client';
import {
  UnionbankAccountService,
  UnionbankInstapayService,
  UnionbankPesonetService,
} from './services';

@Module({
  providers: [
    UnionbankOAuthClient,
    UnionbankApiClient,
    UnionbankInstapayService,
    UnionbankPesonetService,
    UnionbankAccountService,
  ],
  exports: [
    UnionbankInstapayService,
    UnionbankPesonetService,
    UnionbankAccountService,
  ],
})
export class UnionbankModule {}
