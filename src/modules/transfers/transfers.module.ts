import { Module } from '@nestjs/common';
import { UnionbankModule } from '../../integrations/unionbank';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

@Module({
  imports: [UnionbankModule],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
