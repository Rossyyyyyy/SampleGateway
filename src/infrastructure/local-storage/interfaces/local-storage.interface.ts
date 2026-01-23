/**
 * Local Storage Interfaces
 * Used for testing purposes to store data locally in JSON files
 */

export interface LocalStorageConfig {
  /** Base directory path for storage files */
  basePath: string;
  /** Whether to pretty print JSON (default: true) */
  prettyPrint?: boolean;
  /** Auto-save interval in milliseconds (0 = immediate save, default: 0) */
  autoSaveInterval?: number;
}

export interface StorageDocument<T = unknown> {
  id: string;
  data: T;
  createdAt: string;
  updatedAt: string;
}

export interface StorageCollection<T = unknown> {
  name: string;
  documents: Record<string, StorageDocument<T>>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    documentCount: number;
  };
}

export interface QueryOptions<T = unknown> {
  /** Filter function for documents */
  where?: (doc: T) => boolean;
  /** Sort function for documents */
  orderBy?: (a: T, b: T) => number;
  /** Maximum number of results */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
}

export interface LocalStorageData {
  version: string;
  collections: Record<string, StorageCollection>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastAccessed: string;
  };
}
