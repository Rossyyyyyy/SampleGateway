import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from './local-storage.service';
import { LocalStorageData } from './interfaces/local-storage.interface';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let testBasePath: string;

  beforeEach(() => {
    // Create a unique temp directory for each test
    testBasePath = path.join(
      process.cwd(),
      'data',
      'local-storage-test',
      `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    );
    service = new LocalStorageService({ basePath: testBasePath });
  });

  afterEach(async () => {
    // Cleanup: remove the test directory
    await service.onModuleDestroy();
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }
  });

  describe('initialization', () => {
    it('should create storage directory if it does not exist', () => {
      expect(fs.existsSync(testBasePath)).toBe(true);
    });

    it('should create storage file on first save', async () => {
      await service.save();
      const filePath = path.join(testBasePath, 'local-storage.json');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should initialize with empty collections', () => {
      const data = service.getRawData();
      expect(data.collections).toEqual({});
      expect(data.version).toBeDefined();
    });
  });

  describe('collection management', () => {
    it('should create a new collection when accessed', () => {
      service.collection('users');
      const collections = service.listCollections();
      expect(collections).toContain('users');
    });

    it('should return the same collection instance', () => {
      service.collection('users');
      service.collection('users');
      // Both should reference the same underlying data (only one entry in list)
      expect(
        service.listCollections().filter((c) => c === 'users').length,
      ).toBe(1);
    });

    it('should list all collections', () => {
      service.collection('users');
      service.collection('orders');
      service.collection('products');
      const collections = service.listCollections();
      expect(collections).toEqual(
        expect.arrayContaining(['users', 'orders', 'products']),
      );
    });

    it('should delete a collection', () => {
      service.collection('users');
      expect(service.listCollections()).toContain('users');

      const result = service.deleteCollection('users');
      expect(result).toBe(true);
      expect(service.listCollections()).not.toContain('users');
    });

    it('should return false when deleting non-existent collection', () => {
      const result = service.deleteCollection('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all collections and data', async () => {
      const users = service.collection('users');
      await users.create({ name: 'Test' });

      service.clearAll();

      expect(service.listCollections()).toEqual([]);
      const data = service.getRawData();
      expect(data.collections).toEqual({});
    });
  });

  describe('healthCheck', () => {
    it('should return true when storage is working', async () => {
      const healthy = await service.healthCheck();
      expect(healthy).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should persist data to JSON file', async () => {
      const users = service.collection('users');
      await users.create({ name: 'John', email: 'john@test.com' });
      await service.save();

      const filePath = path.join(testBasePath, 'local-storage.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as LocalStorageData;

      expect(data.collections.users).toBeDefined();
      expect(data.collections.users.metadata.documentCount).toBe(1);
    });

    it('should load existing data on initialization', async () => {
      // Create data with first instance
      const users = service.collection('users');
      const created = await users.create({ name: 'John' });
      await service.save();

      // Create new instance pointing to same location
      const service2 = new LocalStorageService({ basePath: testBasePath });
      const users2 = service2.collection('users');
      const loaded = await users2.getData(created.id);

      expect(loaded).toEqual({ name: 'John' });
      await service2.onModuleDestroy();
    });
  });
});

describe('LocalCollection', () => {
  let service: LocalStorageService;
  let testBasePath: string;

  interface TestUser {
    name: string;
    email: string;
    age?: number;
    role?: string;
  }

  beforeEach(() => {
    testBasePath = path.join(
      process.cwd(),
      'data',
      'local-storage-test',
      `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    );
    service = new LocalStorageService({ basePath: testBasePath });
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }
  });

  describe('create', () => {
    it('should create a document with auto-generated ID', async () => {
      const users = service.collection<TestUser>('users');
      const doc = await users.create({ name: 'John', email: 'john@test.com' });

      expect(doc.id).toBeDefined();
      expect(doc.id).toHaveLength(36); // UUID format
      expect(doc.data.name).toBe('John');
      expect(doc.createdAt).toBeDefined();
      expect(doc.updatedAt).toBeDefined();
    });

    it('should increment document count', async () => {
      const users = service.collection<TestUser>('users');
      await users.create({ name: 'John', email: 'john@test.com' });
      await users.create({ name: 'Jane', email: 'jane@test.com' });

      const count = await users.count();
      expect(count).toBe(2);
    });
  });

  describe('set', () => {
    it('should create a document with specific ID', async () => {
      const users = service.collection<TestUser>('users');
      const doc = await users.set('custom-id', {
        name: 'John',
        email: 'john@test.com',
      });

      expect(doc.id).toBe('custom-id');
      expect(doc.data.name).toBe('John');
    });

    it('should update existing document when ID exists', async () => {
      const users = service.collection<TestUser>('users');
      const original = await users.set('custom-id', {
        name: 'John',
        email: 'john@test.com',
      });

      const updated = await users.set('custom-id', {
        name: 'John Updated',
        email: 'john.updated@test.com',
      });

      expect(updated.createdAt).toBe(original.createdAt);
      expect(updated.data.name).toBe('John Updated');
    });
  });

  describe('get', () => {
    it('should retrieve a document by ID', async () => {
      const users = service.collection<TestUser>('users');
      const created = await users.create({
        name: 'John',
        email: 'john@test.com',
      });

      const retrieved = await users.get(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.data.name).toBe('John');
    });

    it('should return null for non-existent document', async () => {
      const users = service.collection<TestUser>('users');
      const retrieved = await users.get('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getData', () => {
    it('should retrieve only document data without metadata', async () => {
      const users = service.collection<TestUser>('users');
      const created = await users.create({
        name: 'John',
        email: 'john@test.com',
      });

      const data = await users.getData(created.id);
      expect(data).toEqual({ name: 'John', email: 'john@test.com' });
    });
  });

  describe('update', () => {
    it('should partially update a document', async () => {
      const users = service.collection<TestUser>('users');
      const created = await users.create({
        name: 'John',
        email: 'john@test.com',
        age: 25,
      });

      const updated = await users.update(created.id, { age: 26 });
      expect(updated?.data.name).toBe('John');
      expect(updated?.data.email).toBe('john@test.com');
      expect(updated?.data.age).toBe(26);
    });

    it('should return null when updating non-existent document', async () => {
      const users = service.collection<TestUser>('users');
      const result = await users.update('non-existent', { name: 'Updated' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing document', async () => {
      const users = service.collection<TestUser>('users');
      const created = await users.create({
        name: 'John',
        email: 'john@test.com',
      });

      const deleted = await users.delete(created.id);
      expect(deleted).toBe(true);

      const retrieved = await users.get(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent document', async () => {
      const users = service.collection<TestUser>('users');
      const deleted = await users.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing document', async () => {
      const users = service.collection<TestUser>('users');
      const created = await users.create({
        name: 'John',
        email: 'john@test.com',
      });

      const exists = await users.exists(created.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent document', async () => {
      const users = service.collection<TestUser>('users');
      const exists = await users.exists('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should retrieve all documents', async () => {
      const users = service.collection<TestUser>('users');
      await users.create({ name: 'John', email: 'john@test.com' });
      await users.create({ name: 'Jane', email: 'jane@test.com' });

      const all = await users.getAll();
      expect(all).toHaveLength(2);
    });

    it('should return empty array for empty collection', async () => {
      const users = service.collection<TestUser>('users');
      const all = await users.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      const users = service.collection<TestUser>('users');
      await users.create({
        name: 'Alice',
        email: 'alice@test.com',
        age: 30,
        role: 'admin',
      });
      await users.create({
        name: 'Bob',
        email: 'bob@test.com',
        age: 25,
        role: 'user',
      });
      await users.create({
        name: 'Charlie',
        email: 'charlie@test.com',
        age: 35,
        role: 'user',
      });
      await users.create({
        name: 'Diana',
        email: 'diana@test.com',
        age: 28,
        role: 'admin',
      });
    });

    it('should filter documents with where clause', async () => {
      const users = service.collection<TestUser>('users');
      const admins = await users.queryData({
        where: (u) => u.role === 'admin',
      });

      expect(admins).toHaveLength(2);
      expect(admins.every((u) => u.role === 'admin')).toBe(true);
    });

    it('should sort documents with orderBy', async () => {
      const users = service.collection<TestUser>('users');
      const sorted = await users.queryData({
        orderBy: (a, b) => (a.age || 0) - (b.age || 0),
      });

      expect(sorted[0].name).toBe('Bob'); // age 25
      expect(sorted[3].name).toBe('Charlie'); // age 35
    });

    it('should limit results', async () => {
      const users = service.collection<TestUser>('users');
      const limited = await users.queryData({ limit: 2 });
      expect(limited).toHaveLength(2);
    });

    it('should skip results with offset', async () => {
      const users = service.collection<TestUser>('users');
      // With 4 users from beforeEach, offset 2 should return 2 remaining
      const skipped = await users.queryData({ offset: 2 });

      expect(skipped).toHaveLength(2);
    });

    it('should combine filter, sort, and limit', async () => {
      const users = service.collection<TestUser>('users');
      const results = await users.queryData({
        where: (u) => u.role === 'user',
        orderBy: (a, b) => (b.age || 0) - (a.age || 0),
        limit: 1,
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Charlie'); // oldest user with role 'user'
    });
  });

  describe('findFirst', () => {
    it('should find first matching document', async () => {
      const users = service.collection<TestUser>('users');
      await users.create({
        name: 'John',
        email: 'john@test.com',
        role: 'user',
      });
      await users.create({
        name: 'Jane',
        email: 'jane@test.com',
        role: 'admin',
      });

      const admin = await users.findFirstData((u) => u.role === 'admin');
      expect(admin?.name).toBe('Jane');
    });

    it('should return null when no match found', async () => {
      const users = service.collection<TestUser>('users');
      await users.create({
        name: 'John',
        email: 'john@test.com',
        role: 'user',
      });

      const admin = await users.findFirstData((u) => u.role === 'admin');
      expect(admin).toBeNull();
    });
  });

  describe('count', () => {
    it('should count all documents', async () => {
      const users = service.collection<TestUser>('users');
      await users.create({ name: 'John', email: 'john@test.com' });
      await users.create({ name: 'Jane', email: 'jane@test.com' });

      const count = await users.count();
      expect(count).toBe(2);
    });

    it('should count documents matching filter', async () => {
      const users = service.collection<TestUser>('users');
      await users.create({
        name: 'John',
        email: 'john@test.com',
        role: 'user',
      });
      await users.create({
        name: 'Jane',
        email: 'jane@test.com',
        role: 'admin',
      });
      await users.create({ name: 'Bob', email: 'bob@test.com', role: 'user' });

      const userCount = await users.count((u) => u.role === 'user');
      expect(userCount).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all documents from collection', async () => {
      const users = service.collection<TestUser>('users');
      await users.create({ name: 'John', email: 'john@test.com' });
      await users.create({ name: 'Jane', email: 'jane@test.com' });

      await users.clear();

      const count = await users.count();
      expect(count).toBe(0);
    });
  });
});
