import { Logger } from '@nestjs/common';
import { WebhookPayloadDto } from '../dto/webhook.dto';

export abstract class BaseWebhookHandler {
  protected abstract readonly logger: Logger;
  protected abstract readonly eventTypes: string[];

  canHandle(eventType: string): boolean {
    return this.eventTypes.includes(eventType);
  }

  abstract handle(payload: WebhookPayloadDto): void;

  protected logEvent(
    action: string,
    eventId: string,
    details?: Record<string, unknown>,
  ): void {
    this.logger.log(`${action}: ${eventId}`, details);
  }
}
