import { Module } from '@nestjs/common';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';
import { DepositRepository } from './repositories/deposit.repository';

@Module({
  controllers: [DepositsController],
  providers: [DepositsService, DepositRepository],
  exports: [DepositsService, DepositRepository],
})
export class DepositsModule {}
