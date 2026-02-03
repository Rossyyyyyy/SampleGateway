// Cache entry with metadata for LRU tracking and TTL
export interface CacheEntry<T = unknown> {
  value: T;
  encryptedData?: string;
  createdAt: number;
  expiresAt: number | null;
  accessCount: number;
  lastAccessedAt: number;
  version: number;
  isEncrypted: boolean;
}

// Options for cache operations
export interface CacheSetOptions {
  ttl?: number; // TTL in seconds
  encrypt?: boolean; // Whether to encrypt the value
  version?: number; // Version for cache invalidation
}

export interface CacheGetOptions {
  fallback?: () => Promise<unknown>; // Fallback function if cache miss
  setOnMiss?: boolean; // Whether to set the value on cache miss
  ttl?: number; // TTL for set on miss
}

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failures exceeded threshold, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

// Circuit breaker info
export interface CircuitBreakerInfo {
  state: CircuitState;
  failures: number;
  lastFailure: number | null;
  openedAt: number | null;
}

// Single-flight in-progress request
export interface InFlightRequest<T = unknown> {
  promise: Promise<T>;
  startedAt: number;
}

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  entries: number;
  evictions: number;
  encryptedEntries: number;
  memoryUsageEstimate: number;
  circuitState: CircuitState;
}

// Eviction policy types
export enum EvictionPolicy {
  LRU = 'LRU', // Least Recently Used
  LFU = 'LFU', // Least Frequently Used
}
