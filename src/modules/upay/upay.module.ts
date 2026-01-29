import { Module } from '@nestjs/common';
import { UnionbankModule } from '../../integrations/unionbank';
import { UpayController } from './upay.controller';
import { UpayService } from './upay.service';

@Module({
  imports: [UnionbankModule],
  controllers: [UpayController],
  providers: [UpayService],
  exports: [UpayService],
})
export class UpayModule {}
