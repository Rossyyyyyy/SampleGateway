import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CACHE_CONSTANTS } from './cache.constants';
import { CacheEncryption } from './cache.encryption';
import {
  CacheEntry,
  CacheSetOptions,
  CacheStats,
  CircuitBreakerInfo,
  CircuitState,
  EvictionPolicy,
  InFlightRequest,
} from './cache.types';

// High-performance in-memory cache service for payment gateway
// Features: LRU eviction, AES-256 encryption, circuit breaker, single-flight
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly encryption: CacheEncryption;
  private readonly inFlightRequests = new Map<string, InFlightRequest>();
  private readonly evictionPolicy: EvictionPolicy = EvictionPolicy.LRU;

  // Statistics
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  // Circuit breaker
  private circuitBreaker: CircuitBreakerInfo = {
    state: CircuitState.CLOSED,
    failures: 0,
    lastFailure: null,
    openedAt: null,
  };

  // Cleanup interval
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.encryption = new CacheEncryption();
    this.startCleanupInterval();
    this.logger.log('Local cache service initialized');
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    this.inFlightRequests.clear();
    this.logger.log('Local cache service destroyed');
  }

  // Get value from cache
  get<T>(key: string): Promise<T | null> {
    if (!this.isCircuitClosed()) {
      return Promise.resolve(null);
    }

    try {
      const entry = this.cache.get(key);
      if (!entry) {
        this.misses++;
        return Promise.resolve(null);
      }

      // Check TTL expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.misses++;
        return Promise.resolve(null);
      }

      // Update LRU metadata
      entry.lastAccessedAt = Date.now();
      entry.accessCount++;
      this.hits++;

      // Decrypt if encrypted
      if (entry.isEncrypted && entry.encryptedData) {
        const decrypted = this.encryption.decrypt(entry.encryptedData);
        return Promise.resolve(JSON.parse(decrypted) as T);
      }

      return Promise.resolve(entry.value as T);
    } catch (error) {
      this.recordFailure();
      this.logger.error(`Cache get error for key ${key}:`, error);
      return Promise.resolve(null);
    }
  }

  // Get with fallback (implements single-flight for cache stampede prevention)
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    options?: CacheSetOptions,
  ): Promise<T | null> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check for in-flight request (single-flight pattern)
    const inFlight = this.inFlightRequests.get(key);
    if (inFlight) {
      // Wait for the existing request instead of making a new one
      try {
        return (await inFlight.promise) as T;
      } catch {
        // If the in-flight request fails, we'll try again below
      }
    }

    // Create new request with single-flight protection
    const requestPromise = this.executeWithSingleFlight(key, fallback, options);
    return requestPromise;
  }

  // Set value in cache
  set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    if (!this.isCircuitClosed()) {
      return Promise.resolve();
    }

    try {
      // Evict if necessary
      if (this.cache.size >= CACHE_CONSTANTS.MAX_ENTRIES) {
        this.evict();
      }

      const now = Date.now();
      const ttl = options.ttl ?? CACHE_CONSTANTS.DEFAULT_TTL;
      const expiresAt = ttl > 0 ? now + ttl * 1000 : null;

      const entry: CacheEntry<T> = {
        value: options.encrypt ? (null as T) : value,
        createdAt: now,
        expiresAt,
        accessCount: 0,
        lastAccessedAt: now,
        version: options.version ?? 1,
        isEncrypted: options.encrypt ?? false,
      };

      // Encrypt if requested
      if (options.encrypt) {
        const serialized = JSON.stringify(value);
        entry.encryptedData = this.encryption.encrypt(serialized);
      }

      this.cache.set(key, entry);
      this.recordSuccess();
    } catch (error) {
      this.recordFailure();
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
    return Promise.resolve();
  }

  // Delete from cache
  delete(key: string): Promise<void> {
    this.cache.delete(key);
    return Promise.resolve();
  }

  // Delete by pattern (prefix)
  deleteByPrefix(prefix: string): Promise<number> {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return Promise.resolve(deleted);
  }

  // Check if key exists
  exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return Promise.resolve(false);

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return Promise.resolve(false);
    }

    return Promise.resolve(true);
  }

  // Set JSON value (convenience method)
  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, value, { ttl: ttlSeconds });
  }

  // Get JSON value (convenience method)
  async getJson<T>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }

  // Invalidate cache entry by version
  invalidateVersion(key: string, version: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry && entry.version < version) {
      this.cache.delete(key);
    }
    return Promise.resolve();
  }

  // Health check
  healthCheck(): Promise<boolean> {
    return Promise.resolve(this.circuitBreaker.state !== CircuitState.OPEN);
  }

  // Get cache statistics
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    let encryptedCount = 0;
    let memoryEstimate = 0;

    for (const entry of this.cache.values()) {
      if (entry.isEncrypted) encryptedCount++;
      memoryEstimate += this.estimateEntrySize(entry);
    }

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      entries: this.cache.size,
      evictions: this.evictions,
      encryptedEntries: encryptedCount,
      memoryUsageEstimate: memoryEstimate,
      circuitState: this.circuitBreaker.state,
    };
  }

  // Reset statistics
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  // Clear entire cache
  clear(): Promise<void> {
    this.cache.clear();
    this.logger.log('Cache cleared');
    return Promise.resolve();
  }

  // Execute with single-flight protection
  private async executeWithSingleFlight<T>(
    key: string,
    fallback: () => Promise<T>,
    options?: CacheSetOptions,
  ): Promise<T | null> {
    const promise = (async () => {
      try {
        const value = await fallback();
        await this.set(key, value, options);
        return value;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, {
      promise,
      startedAt: Date.now(),
    });

    // Set timeout to prevent hanging requests
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(resolve, CACHE_CONSTANTS.SINGLE_FLIGHT_TIMEOUT, null);
    });

    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  }

  // LRU/LFU eviction
  private evict(): void {
    const entriesToEvict = Math.ceil(
      CACHE_CONSTANTS.MAX_ENTRIES * CACHE_CONSTANTS.EVICTION_THRESHOLD,
    );

    // Sort entries by eviction policy
    const entries = Array.from(this.cache.entries());

    if (this.evictionPolicy === EvictionPolicy.LRU) {
      entries.sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);
    } else {
      // LFU
      entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    }

    // Evict oldest/least used entries
    for (let i = 0; i < entriesToEvict && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.evictions++;
    }

    this.logger.debug(`Evicted ${entriesToEvict} cache entries`);
  }

  // Start cleanup interval for expired entries
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Run every minute
  }

  // Remove expired entries
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }

    // Check circuit breaker timeout
    this.checkCircuitBreaker();
  }

  // Circuit breaker: check if closed
  private isCircuitClosed(): boolean {
    if (this.circuitBreaker.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.circuitBreaker.state === CircuitState.HALF_OPEN) {
      return true; // Allow one request through
    }

    // Check if timeout has passed for OPEN state
    if (this.circuitBreaker.openedAt) {
      const elapsed = Date.now() - this.circuitBreaker.openedAt;
      if (elapsed >= CACHE_CONSTANTS.CIRCUIT_BREAKER_TIMEOUT) {
        this.circuitBreaker.state = CircuitState.HALF_OPEN;
        return true;
      }
    }

    return false;
  }

  // Circuit breaker: record success
  private recordSuccess(): void {
    if (this.circuitBreaker.state === CircuitState.HALF_OPEN) {
      this.circuitBreaker.state = CircuitState.CLOSED;
      this.circuitBreaker.failures = 0;
      this.logger.log('Circuit breaker closed');
    }
  }

  // Circuit breaker: record failure
  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (
      this.circuitBreaker.failures >= CACHE_CONSTANTS.CIRCUIT_BREAKER_THRESHOLD
    ) {
      this.circuitBreaker.state = CircuitState.OPEN;
      this.circuitBreaker.openedAt = Date.now();
      this.logger.warn('Circuit breaker opened due to failures');
    }
  }

  // Circuit breaker: check and update state
  private checkCircuitBreaker(): void {
    if (
      this.circuitBreaker.state === CircuitState.OPEN &&
      this.circuitBreaker.openedAt
    ) {
      const elapsed = Date.now() - this.circuitBreaker.openedAt;
      if (elapsed >= CACHE_CONSTANTS.CIRCUIT_BREAKER_TIMEOUT) {
        this.circuitBreaker.state = CircuitState.HALF_OPEN;
        this.logger.log('Circuit breaker half-open');
      }
    }
  }

  // Estimate memory size of an entry
  private estimateEntrySize(entry: CacheEntry): number {
    let size = 100; // Base overhead

    if (entry.encryptedData) {
      size += entry.encryptedData.length * 2;
    } else if (entry.value) {
      size += JSON.stringify(entry.value).length * 2;
    }

    return size;
  }
}
