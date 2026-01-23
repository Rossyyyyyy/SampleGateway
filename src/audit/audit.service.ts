import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ActorType,
  AuditEvent,
  AuditEventType,
  CreateAuditEventParams,
} from './interfaces/audit-event.interface';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  log(params: CreateAuditEventParams): AuditEvent {
    const event: AuditEvent = {
      id: uuidv4(),
      eventType: params.eventType,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      actorId: params.actorId,
      actorType: params.actorType,
      metadata: params.metadata ?? {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      timestamp: new Date(),
    };

    // Log immediately for real-time monitoring
    this.logger.log(`[AUDIT] ${event.eventType} ${event.action}`, {
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      actorId: event.actorId,
      requestId: event.requestId,
    });

    // TODO: Persist to database asynchronously
    this.persistAuditEvent(event);

    return event;
  }

  logTransfer(
    action: string,
    transferId: string,
    actorId: string,
    metadata: Record<string, unknown>,
    requestContext?: {
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
    },
  ): AuditEvent {
    return this.log({
      eventType: AuditEventType.TRANSFER,
      action,
      resourceType: 'transfer',
      resourceId: transferId,
      actorId,
      actorType: ActorType.PARTNER,
      metadata: this.sanitizeMetadata(metadata),
      ...requestContext,
    });
  }

  logError(
    action: string,
    resourceType: string,
    resourceId: string,
    error: Error,
    requestContext?: {
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
    },
  ): AuditEvent {
    return this.log({
      eventType: AuditEventType.ERROR,
      action,
      resourceType,
      resourceId,
      actorId: 'system',
      actorType: ActorType.SYSTEM,
      metadata: {
        errorMessage: error.message,
        errorName: error.name,
      },
      ...requestContext,
    });
  }

  private sanitizeMetadata(
    metadata: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'secret',
      'token',
      'apiKey',
      'apiSecret',
    ];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (
        sensitiveFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private persistAuditEvent(event: AuditEvent): void {
    // TODO: Implement database persistence
    // Consider using a queue for high-volume logging
    this.logger.debug(`Persisting audit event: ${event.id}`);
  }
}
