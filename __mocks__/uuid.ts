/**
 * Jest mock for uuid package
 * Provides a simple v4 UUID generator for testing
 * Generates 36-character UUIDs in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */

let counter = 0;

const randomHex = (length: number): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
};

export const v4 = (): string => {
  counter++;
  const c = counter.toString(16).padStart(8, '0');

  // Format: xxxxxxxx-xxxx-4xxx-axxx-xxxxxxxxxxxx (36 chars)
  // 8 + 1 + 4 + 1 + 4 + 1 + 4 + 1 + 12 = 36
  return `${c}-${randomHex(4)}-4${randomHex(3)}-a${randomHex(3)}-${randomHex(12)}`;
};

// Reset counter for test isolation
export const __resetCounter = (): void => {
  counter = 0;
};

export default { v4 };
