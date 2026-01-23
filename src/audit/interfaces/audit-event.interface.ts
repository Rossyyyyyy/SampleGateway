export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string;
  actorType: ActorType;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  timestamp: Date;
}

export enum AuditEventType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  TRANSFER = 'TRANSFER',
  WEBHOOK = 'WEBHOOK',
  ERROR = 'ERROR',
}

export enum ActorType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  PARTNER = 'PARTNER',
  WEBHOOK = 'WEBHOOK',
}

export interface CreateAuditEventParams {
  eventType: AuditEventType;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string;
  actorType: ActorType;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}
