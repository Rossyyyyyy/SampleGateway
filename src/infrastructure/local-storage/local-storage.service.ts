import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  LocalStorageConfig,
  LocalStorageData,
  QueryOptions,
  StorageCollection,
  StorageDocument,
} from './interfaces/local-storage.interface';

const STORAGE_VERSION = '1.0.0';
const DEFAULT_STORAGE_FILE = 'local-storage.json';

@Injectable()
export class LocalStorageService implements OnModuleDestroy {
  private readonly logger = new Logger(LocalStorageService.name);
  private data: LocalStorageData;
  private readonly filePath: string;
  private readonly prettyPrint: boolean;
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly autoSaveInterval: number;

  constructor(config?: Partial<LocalStorageConfig>) {
    const basePath =
      config?.basePath ||
      path.join(process.cwd(), 'data', 'local-storage-test');
    this.filePath = path.join(basePath, DEFAULT_STORAGE_FILE);
    this.prettyPrint = config?.prettyPrint ?? true;
    this.autoSaveInterval = config?.autoSaveInterval ?? 0;

    this.ensureDirectoryExists(basePath);
    this.data = this.loadOrCreateStorage();
    this.logger.log(`Local storage initialized at: ${this.filePath}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    await this.save();
    this.logger.log('Local storage saved and closed');
  }

  /**
   * Get or create a collection
   */
  collection<T = unknown>(name: string): LocalCollection<T> {
    if (!this.data.collections[name]) {
      this.data.collections[name] = this.createEmptyCollection(name);
      this.scheduleSave();
    }
    return new LocalCollection<T>(this, name);
  }

  /**
   * List all collection names
   */
  listCollections(): string[] {
    return Object.keys(this.data.collections);
  }

  /**
   * Delete a collection
   */
  deleteCollection(name: string): boolean {
    if (this.data.collections[name]) {
      delete this.data.collections[name];
      this.scheduleSave();
      return true;
    }
    return false;
  }

  /**
   * Clear all data (useful for test cleanup)
   */
  clearAll(): void {
    this.data = this.createEmptyStorage();
    this.scheduleSave();
    this.logger.log('Local storage cleared');
  }

  /**
   * Force save to disk
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async save(): Promise<void> {
    try {
      this.data.metadata.updatedAt = new Date().toISOString();
      const content = this.prettyPrint
        ? JSON.stringify(this.data, null, 2)
        : JSON.stringify(this.data);
      fs.writeFileSync(this.filePath, content, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to save local storage: ${error}`);
      throw error;
    }
  }

  /**
   * Get raw storage data (for debugging)
   */
  getRawData(): LocalStorageData {
    return { ...this.data };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.save();
      return fs.existsSync(this.filePath);
    } catch {
      return false;
    }
  }

  // Internal methods used by LocalCollection
  _getCollection<T>(name: string): StorageCollection<T> | undefined {
    return this.data.collections[name] as StorageCollection<T> | undefined;
  }

  _setDocument<T>(
    collectionName: string,
    id: string,
    document: StorageDocument<T>,
  ): void {
    const collection = this.data.collections[collectionName];
    if (collection) {
      collection.documents[id] = document as StorageDocument<unknown>;
      collection.metadata.documentCount = Object.keys(
        collection.documents,
      ).length;
      collection.metadata.updatedAt = new Date().toISOString();
      this.scheduleSave();
    }
  }

  _deleteDocument(collectionName: string, id: string): boolean {
    const collection = this.data.collections[collectionName];
    if (collection && collection.documents[id]) {
      delete collection.documents[id];
      collection.metadata.documentCount = Object.keys(
        collection.documents,
      ).length;
      collection.metadata.updatedAt = new Date().toISOString();
      this.scheduleSave();
      return true;
    }
    return false;
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.logger.log(`Created storage directory: ${dirPath}`);
    }
  }

  private loadOrCreateStorage(): LocalStorageData {
    if (fs.existsSync(this.filePath)) {
      try {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(content) as LocalStorageData;
        data.metadata.lastAccessed = new Date().toISOString();
        this.logger.log('Loaded existing local storage');
        return data;
      } catch (error) {
        this.logger.warn(`Failed to load storage file, creating new: ${error}`);
        return this.createEmptyStorage();
      }
    }
    return this.createEmptyStorage();
  }

  private createEmptyStorage(): LocalStorageData {
    const now = new Date().toISOString();
    return {
      version: STORAGE_VERSION,
      collections: {},
      metadata: {
        createdAt: now,
        updatedAt: now,
        lastAccessed: now,
      },
    };
  }

  private createEmptyCollection(name: string): StorageCollection {
    const now = new Date().toISOString();
    return {
      name,
      documents: {},
      metadata: {
        createdAt: now,
        updatedAt: now,
        documentCount: 0,
      },
    };
  }

  private scheduleSave(): void {
    if (this.autoSaveInterval === 0) {
      // Immediate save
      this.save().catch((err) => this.logger.error(`Auto-save failed: ${err}`));
    } else if (!this.saveTimeout) {
      this.saveTimeout = setTimeout(() => {
        this.saveTimeout = null;
        this.save().catch((err) =>
          this.logger.error(`Auto-save failed: ${err}`),
        );
      }, this.autoSaveInterval);
    }
  }
}

/**
 * Collection wrapper for type-safe document operations
 */
export class LocalCollection<T = unknown> {
  constructor(
    private readonly storage: LocalStorageService,
    private readonly name: string,
  ) {}

  /**
   * Create a new document with auto-generated ID
   */
  async create(data: T): Promise<StorageDocument<T>> {
    const id = crypto.randomUUID();
    return this.set(id, data);
  }

  /**
   * Set a document with specific ID (create or update)
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async set(id: string, data: T): Promise<StorageDocument<T>> {
    const now = new Date().toISOString();
    const existing = this.getDocument(id);

    const document: StorageDocument<T> = {
      id,
      data,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.storage._setDocument(this.name, id, document);
    return document;
  }

  /**
   * Get a document by ID
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async get(id: string): Promise<StorageDocument<T> | null> {
    return this.getDocument(id);
  }

  /**
   * Get document data by ID (without metadata)
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getData(id: string): Promise<T | null> {
    const doc = this.getDocument(id);
    return doc?.data || null;
  }

  /**
   * Update a document (partial update)
   */
  async update(
    id: string,
    updates: Partial<T>,
  ): Promise<StorageDocument<T> | null> {
    const existing = this.getDocument(id);
    if (!existing) {
      return null;
    }

    const updatedData = { ...existing.data, ...updates };
    return this.set(id, updatedData);
  }

  /**
   * Delete a document
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async delete(id: string): Promise<boolean> {
    return this.storage._deleteDocument(this.name, id);
  }

  /**
   * Check if document exists
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async exists(id: string): Promise<boolean> {
    return this.getDocument(id) !== null;
  }

  /**
   * Get all documents in collection
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getAll(): Promise<StorageDocument<T>[]> {
    const collection = this.storage._getCollection<T>(this.name);
    if (!collection) {
      return [];
    }
    return Object.values(collection.documents);
  }

  /**
   * Get all document data (without metadata)
   */
  async getAllData(): Promise<T[]> {
    const docs = await this.getAll();
    return docs.map((doc) => doc.data);
  }

  /**
   * Query documents with filters, sorting, and pagination
   */
  async query(options: QueryOptions<T>): Promise<StorageDocument<T>[]> {
    let results = await this.getAll();

    // Apply filter
    if (options.where) {
      results = results.filter((doc) => options.where!(doc.data));
    }

    // Apply sort
    if (options.orderBy) {
      results.sort((a, b) => options.orderBy!(a.data, b.data));
    }

    // Apply offset
    if (options.offset && options.offset > 0) {
      results = results.slice(options.offset);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Query and return only document data
   */
  async queryData(options: QueryOptions<T>): Promise<T[]> {
    const docs = await this.query(options);
    return docs.map((doc) => doc.data);
  }

  /**
   * Count documents (optionally with filter)
   */
  async count(where?: (doc: T) => boolean): Promise<number> {
    if (where) {
      const results = await this.query({ where });
      return results.length;
    }
    const collection = this.storage._getCollection<T>(this.name);
    return collection?.metadata.documentCount || 0;
  }

  /**
   * Find first document matching condition
   */
  async findFirst(
    where: (doc: T) => boolean,
  ): Promise<StorageDocument<T> | null> {
    const results = await this.query({ where, limit: 1 });
    return results[0] || null;
  }

  /**
   * Find first document data matching condition
   */
  async findFirstData(where: (doc: T) => boolean): Promise<T | null> {
    const doc = await this.findFirst(where);
    return doc?.data || null;
  }

  /**
   * Clear all documents in this collection
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async clear(): Promise<void> {
    const collection = this.storage._getCollection<T>(this.name);
    if (collection) {
      collection.documents = {};
      collection.metadata.documentCount = 0;
      collection.metadata.updatedAt = new Date().toISOString();
    }
  }

  private getDocument(id: string): StorageDocument<T> | null {
    const collection = this.storage._getCollection<T>(this.name);
    if (!collection) {
      return null;
    }
    return collection.documents[id] || null;
  }
}
