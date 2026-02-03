// Queue name constants for Bull queue processors
// Separated from queue.module.ts to avoid circular dependency issues

export const QUEUE_NAMES = {
  TRANSACTION: 'transaction',
  WEBHOOK: 'webhook',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
