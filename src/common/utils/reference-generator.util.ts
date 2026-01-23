import { v4 as uuidv4 } from 'uuid';

const REFERENCE_PREFIX = 'IW';

export interface ReferenceOptions {
  prefix?: string;
  includeTimestamp?: boolean;
}

export function generateReferenceId(options: ReferenceOptions = {}): string {
  const { prefix = REFERENCE_PREFIX, includeTimestamp = true } = options;

  const uuid = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16);

  if (includeTimestamp) {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}${timestamp}${uuid}`;
  }

  return `${prefix}${uuid}`;
}

export function generateIdempotencyKey(): string {
  return uuidv4();
}

export function generateTransactionReference(): string {
  return generateReferenceId({ prefix: 'TXN', includeTimestamp: true });
}

export function generateTransferReference(): string {
  return generateReferenceId({ prefix: 'TFR', includeTimestamp: true });
}

export function isValidReferenceId(
  referenceId: string,
  prefix: string = REFERENCE_PREFIX,
): boolean {
  return (
    referenceId.startsWith(prefix) && referenceId.length >= prefix.length + 16
  );
}
