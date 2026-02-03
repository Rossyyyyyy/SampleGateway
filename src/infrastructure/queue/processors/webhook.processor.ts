import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES } from '../queue.constants';

export interface WebhookJobData {
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  targetUrl: string;
  retryCount: number;
}

@Processor(QUEUE_NAMES.WEBHOOK)
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  @Process()
  handleWebhook(job: Job<WebhookJobData>): void {
    const { webhookId, eventType, targetUrl, retryCount } = job.data;

    this.logger.log(
      `Processing webhook: ${webhookId}, event: ${eventType}, attempt: ${retryCount + 1}`,
    );

    try {
      this.sendWebhook(job.data);
      this.logger.log(`Webhook sent successfully: ${webhookId}`);
    } catch (error) {
      this.logger.error(
        `Webhook delivery failed: ${webhookId} to ${targetUrl}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private sendWebhook(data: WebhookJobData): void {
    // TODO: Implement webhook delivery logic
    // - Sign the payload
    // - Send HTTP POST to targetUrl
    // - Handle response and retry if needed
    this.logger.debug(`Sending webhook to: ${data.targetUrl}`, data.payload);
  }
}
