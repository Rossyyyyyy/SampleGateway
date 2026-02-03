// Cache configuration constants
export const CACHE_CONSTANTS = {
  // Default TTL values (in seconds)
  DEFAULT_TTL: 300, // 5 minutes
  SHORT_TTL: 60, // 1 minute
  LONG_TTL: 3600, // 1 hour

  // Maximum cache size (number of entries)
  MAX_ENTRIES: 10000,

  // LRU eviction threshold (percentage of max entries to evict when full)
  EVICTION_THRESHOLD: 0.1,

  // Circuit breaker settings
  CIRCUIT_BREAKER_THRESHOLD: 5, // failures before opening
  CIRCUIT_BREAKER_TIMEOUT: 30000, // 30 seconds before half-open

  // Single-flight timeout (ms)
  SINGLE_FLIGHT_TIMEOUT: 5000,

  // Encryption settings
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32, // 256 bits
  IV_LENGTH: 16, // 128 bits
  AUTH_TAG_LENGTH: 16, // 128 bits
} as const;

// Cache key prefixes for different data types
export const CACHE_PREFIXES = {
  SESSION: 'session:',
  TOKEN: 'token:',
  RATE_LIMIT: 'ratelimit:',
  BILLER: 'biller:',
  TRANSACTION: 'tx:',
  WEBHOOK: 'webhook:',
  CONFIG: 'config:',
} as const;

export type CachePrefix = (typeof CACHE_PREFIXES)[keyof typeof CACHE_PREFIXES];
