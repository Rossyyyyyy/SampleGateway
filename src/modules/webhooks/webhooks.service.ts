import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { WebhookPayloadDto, WebhookResponseDto } from './dto/webhook.dto';
import { TransferWebhookHandler } from './handlers/transfer-webhook.handler';

const WEBHOOK_PROCESSED_KEY_PREFIX = 'webhook:processed:';
const WEBHOOK_TTL_SECONDS = 86400 * 7; // 7 days

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly transferHandler: TransferWebhookHandler,
  ) {}

  async processWebhook(
    payload: WebhookPayloadDto,
  ): Promise<WebhookResponseDto> {
    const { eventId, eventType } = payload;

    this.logger.log(`Received webhook: ${eventType} (${eventId})`);

    // Check for duplicate webhook
    const isDuplicate = await this.isDuplicateWebhook(eventId);
    if (isDuplicate) {
      this.logger.warn(`Duplicate webhook received: ${eventId}`);
      return {
        received: true,
        eventId,
        message: 'Webhook already processed',
      };
    }

    try {
      this.routeWebhook(payload);
      await this.markWebhookProcessed(eventId);

      return {
        received: true,
        eventId,
      };
    } catch (error) {
      this.logger.error(
        `Webhook processing failed: ${eventId}`,
        error instanceof Error ? error.stack : String(error),
      );

      return {
        received: true,
        eventId,
        message: 'Webhook received but processing failed',
      };
    }
  }

  private routeWebhook(payload: WebhookPayloadDto): void {
    const { eventType } = payload;

    if (this.transferHandler.canHandle(eventType)) {
      this.transferHandler.handle(payload);
      return;
    }

    this.logger.warn(`No handler found for event type: ${eventType}`);
  }

  private async isDuplicateWebhook(eventId: string): Promise<boolean> {
    const key = `${WEBHOOK_PROCESSED_KEY_PREFIX}${eventId}`;
    return this.redisService.exists(key);
  }

  private async markWebhookProcessed(eventId: string): Promise<void> {
    const key = `${WEBHOOK_PROCESSED_KEY_PREFIX}${eventId}`;
    await this.redisService.set(
      key,
      new Date().toISOString(),
      WEBHOOK_TTL_SECONDS,
    );
  }
}
