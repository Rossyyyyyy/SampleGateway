import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AuditService } from '../../audit/audit.service';
import { ActorType } from '../../audit/interfaces/audit-event.interface';
import { AuditEventType } from '../../audit/interfaces/audit-event.interface';
import {
  UnionbankAutopostPayloadDto,
  UnionbankAutopostResponseDto,
} from './dto/unionbank-autopost.dto';
import { WebhookPayloadDto, WebhookResponseDto } from './dto/webhook.dto';
import { TransferWebhookHandler } from './handlers/transfer-webhook.handler';

const WEBHOOK_PROCESSED_KEY_PREFIX = 'webhook:processed:';
const WEBHOOK_TTL_SECONDS = 86400 * 7; // 7 days
const AUTOPOST_PROCESSED_KEY_PREFIX = 'webhook:unionbank:autopost:';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly transferHandler: TransferWebhookHandler,
    private readonly auditService: AuditService,
  ) {}

  async processUnionbankAutopost(
    payload: UnionbankAutopostPayloadDto,
  ): Promise<UnionbankAutopostResponseDto> {
    const idempotencyKey = `${payload.transactionId}:${payload.senderRefId}`;

    const isDuplicate = await this.redisService.exists(
      `${AUTOPOST_PROCESSED_KEY_PREFIX}${idempotencyKey}`,
    );
    if (isDuplicate) {
      this.logger.warn(`Duplicate autopost ignored: ${idempotencyKey}`);
      return {
        received: true,
        idempotencyKey,
        message: 'Already processed',
      };
    }

    this.auditService.log({
      eventType: AuditEventType.WEBHOOK,
      action: 'AUTOPOST_RECEIVED',
      resourceType: 'upay_autopost',
      resourceId: idempotencyKey,
      actorId: payload.transactionId,
      actorType: ActorType.WEBHOOK,
      metadata: {
        senderRefId: payload.senderRefId,
        uuid: payload.uuid,
        amount: payload.amount,
        status: payload.status,
        transactionDateTime: payload.transactionDateTime,
      },
    });

    this.routeAutopost(payload);

    await this.redisService.set(
      `${AUTOPOST_PROCESSED_KEY_PREFIX}${idempotencyKey}`,
      new Date().toISOString(),
      WEBHOOK_TTL_SECONDS,
    );

    return { received: true, idempotencyKey };
  }

  private routeAutopost(payload: UnionbankAutopostPayloadDto): void {
    // Only treat as success when status indicates completion (align with UB values)
    if (
      payload.status === 'COMPLETED' ||
      payload.billerPostStatus === 'SUCCESS'
    ) {
      this.logger.log(`Autopost success: ${payload.senderRefId}`, {
        uuid: payload.uuid,
      });
    } else {
      this.logger.log(`Autopost non-success: ${payload.senderRefId}`, {
        status: payload.status,
      });
    }
  }

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
