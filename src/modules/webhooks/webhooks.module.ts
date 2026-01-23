import { Module } from '@nestjs/common';
import { TransferWebhookHandler } from './handlers/transfer-webhook.handler';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, TransferWebhookHandler],
  exports: [WebhooksService],
})
export class WebhooksModule {}
