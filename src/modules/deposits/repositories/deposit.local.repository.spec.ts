import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from '../../../infrastructure/local-storage';
import { DepositLocalRepository } from './deposit.local.repository';
import {
  DepositStatus,
  DepositType,
  CreateDepositData,
} from '../entities/deposit.entity';

describe('DepositLocalRepository', () => {
  let storage: LocalStorageService;
  let repository: DepositLocalRepository;
  let testBasePath: string;

  const createTestDeposit = (
    overrides: Partial<CreateDepositData> = {},
  ): CreateDepositData => ({
    userId: 'user-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    depositId: `DEP-${Date.now()}`,
    amount: 1000,
    phpAmount: 1000,
    currency: 'PHP',
    type: DepositType.INSTAPAY,
    ...overrides,
  });

  beforeEach(() => {
    testBasePath = path.join(
      process.cwd(),
      'data',
      'local-storage-test',
      `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    );
    storage = new LocalStorageService({ basePath: testBasePath });
    repository = new DepositLocalRepository(storage);
  });

  afterEach(async () => {
    await storage.onModuleDestroy();
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }
  });

  describe('create', () => {
    it('should create a new deposit with generated ID', async () => {
      const data = createTestDeposit();
      const deposit = await repository.create(data);

      expect(deposit.id).toBeDefined();
      expect(deposit.id).toHaveLength(36); // UUID format
      expect(deposit.userId).toBe(data.userId);
      expect(deposit.firstName).toBe(data.firstName);
      expect(deposit.lastName).toBe(data.lastName);
      expect(deposit.email).toBe(data.email);
      expect(deposit.depositId).toBe(data.depositId);
      expect(deposit.amount).toBe(data.amount);
      expect(deposit.phpAmount).toBe(data.phpAmount);
      expect(deposit.currency).toBe(data.currency);
      expect(deposit.type).toBe(data.type);
      expect(deposit.status).toBe(DepositStatus.PENDING);
      expect(deposit.createdAt).toBeInstanceOf(Date);
      expect(deposit.time).toBeDefined();
    });

    it('should create deposit with metadata', async () => {
      const data = createTestDeposit({
        metadata: { source: 'test', transactionRef: 'REF-001' },
      });
      const deposit = await repository.create(data);

      expect(deposit.metadata).toEqual({
        source: 'test',
        transactionRef: 'REF-001',
      });
    });

    it('should create multiple deposits', async () => {
      await repository.create(createTestDeposit({ depositId: 'DEP-001' }));
      await repository.create(createTestDeposit({ depositId: 'DEP-002' }));
      await repository.create(createTestDeposit({ depositId: 'DEP-003' }));

      const count = await repository.count();
      expect(count).toBe(3);
    });
  });

  describe('findById', () => {
    it('should find deposit by ID', async () => {
      const created = await repository.create(createTestDeposit());
      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.depositId).toBe(created.depositId);
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should deserialize dates correctly', async () => {
      const created = await repository.create(createTestDeposit());
      const found = await repository.findById(created.id);

      expect(found?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findByDepositId', () => {
    it('should find deposit by depositId', async () => {
      const data = createTestDeposit({ depositId: 'UNIQUE-DEP-ID' });
      await repository.create(data);

      const found = await repository.findByDepositId('UNIQUE-DEP-ID');
      expect(found).not.toBeNull();
      expect(found?.depositId).toBe('UNIQUE-DEP-ID');
    });

    it('should return null for non-existent depositId', async () => {
      const found = await repository.findByDepositId('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all deposits for a user', async () => {
      await repository.create(
        createTestDeposit({ userId: 'user-A', depositId: 'DEP-1' }),
      );
      await repository.create(
        createTestDeposit({ userId: 'user-A', depositId: 'DEP-2' }),
      );
      await repository.create(
        createTestDeposit({ userId: 'user-B', depositId: 'DEP-3' }),
      );

      const userADeposits = await repository.findByUserId('user-A');
      expect(userADeposits).toHaveLength(2);
      expect(userADeposits.every((d) => d.userId === 'user-A')).toBe(true);
    });

    it('should return deposits sorted by createdAt descending', async () => {
      // Create deposits with slight delay to ensure different timestamps
      await repository.create(
        createTestDeposit({ userId: 'user-A', depositId: 'DEP-1' }),
      );
      await new Promise((r) => setTimeout(r, 10));
      await repository.create(
        createTestDeposit({ userId: 'user-A', depositId: 'DEP-2' }),
      );

      const deposits = await repository.findByUserId('user-A');
      expect(deposits[0].depositId).toBe('DEP-2'); // Most recent first
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create(
          createTestDeposit({ userId: 'user-A', depositId: `DEP-${i}` }),
        );
      }

      const deposits = await repository.findByUserId('user-A', 3);
      expect(deposits).toHaveLength(3);
    });

    it('should return empty array for user with no deposits', async () => {
      const deposits = await repository.findByUserId('non-existent-user');
      expect(deposits).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find all deposits with specific status', async () => {
      const dep1 = await repository.create(
        createTestDeposit({ depositId: 'DEP-1' }),
      );
      const dep2 = await repository.create(
        createTestDeposit({ depositId: 'DEP-2' }),
      );
      await repository.create(createTestDeposit({ depositId: 'DEP-3' }));

      await repository.updateStatus(dep1.id, DepositStatus.COMPLETED);
      await repository.updateStatus(dep2.id, DepositStatus.COMPLETED);

      const completed = await repository.findByStatus(DepositStatus.COMPLETED);
      expect(completed).toHaveLength(2);
      expect(completed.every((d) => d.status === DepositStatus.COMPLETED)).toBe(
        true,
      );

      const pending = await repository.findByStatus(DepositStatus.PENDING);
      expect(pending).toHaveLength(1);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create(createTestDeposit({ depositId: `DEP-${i}` }));
      }

      const deposits = await repository.findByStatus(DepositStatus.PENDING, 3);
      expect(deposits).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('should update deposit fields', async () => {
      const created = await repository.create(createTestDeposit());
      const updated = await repository.update(created.id, {
        status: DepositStatus.PROCESSING,
        externalReferenceId: 'EXT-REF-001',
        statusMessage: 'Processing started',
      });

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe(DepositStatus.PROCESSING);
      expect(updated?.externalReferenceId).toBe('EXT-REF-001');
      expect(updated?.statusMessage).toBe('Processing started');
    });

    it('should preserve unchanged fields', async () => {
      const created = await repository.create(
        createTestDeposit({
          firstName: 'Original',
          amount: 500,
        }),
      );

      const updated = await repository.update(created.id, {
        status: DepositStatus.COMPLETED,
      });

      expect(updated?.firstName).toBe('Original');
      expect(updated?.amount).toBe(500);
    });

    it('should return null for non-existent deposit', async () => {
      const result = await repository.update('non-existent', {
        status: DepositStatus.COMPLETED,
      });
      expect(result).toBeNull();
    });

    it('should update metadata', async () => {
      const created = await repository.create(
        createTestDeposit({ metadata: { original: true } }),
      );

      const updated = await repository.update(created.id, {
        metadata: { original: true, updated: true, newField: 'value' },
      });

      expect(updated?.metadata).toEqual({
        original: true,
        updated: true,
        newField: 'value',
      });
    });
  });

  describe('updateStatus', () => {
    it('should update status with message', async () => {
      const created = await repository.create(createTestDeposit());
      const updated = await repository.updateStatus(
        created.id,
        DepositStatus.PROCESSING,
        'Transaction is being processed',
      );

      expect(updated?.status).toBe(DepositStatus.PROCESSING);
      expect(updated?.statusMessage).toBe('Transaction is being processed');
    });

    it('should set completedAt when status is COMPLETED', async () => {
      const created = await repository.create(createTestDeposit());
      const updated = await repository.updateStatus(
        created.id,
        DepositStatus.COMPLETED,
        'Success',
      );

      expect(updated?.status).toBe(DepositStatus.COMPLETED);
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should not set completedAt for non-COMPLETED status', async () => {
      const created = await repository.create(createTestDeposit());
      const updated = await repository.updateStatus(
        created.id,
        DepositStatus.FAILED,
        'Transaction failed',
      );

      expect(updated?.status).toBe(DepositStatus.FAILED);
      expect(updated?.completedAt).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete an existing deposit', async () => {
      const created = await repository.create(createTestDeposit());
      const deleted = await repository.delete(created.id);

      expect(deleted).toBe(true);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent deposit', async () => {
      const deleted = await repository.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should decrement count after deletion', async () => {
      const dep1 = await repository.create(
        createTestDeposit({ depositId: 'DEP-1' }),
      );
      await repository.create(createTestDeposit({ depositId: 'DEP-2' }));

      expect(await repository.count()).toBe(2);

      await repository.delete(dep1.id);

      expect(await repository.count()).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should remove all deposits', async () => {
      await repository.create(createTestDeposit({ depositId: 'DEP-1' }));
      await repository.create(createTestDeposit({ depositId: 'DEP-2' }));
      await repository.create(createTestDeposit({ depositId: 'DEP-3' }));

      expect(await repository.count()).toBe(3);

      await repository.clearAll();

      expect(await repository.count()).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return all deposits', async () => {
      await repository.create(createTestDeposit({ depositId: 'DEP-1' }));
      await repository.create(createTestDeposit({ depositId: 'DEP-2' }));

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when no deposits', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return correct count', async () => {
      expect(await repository.count()).toBe(0);

      await repository.create(createTestDeposit({ depositId: 'DEP-1' }));
      expect(await repository.count()).toBe(1);

      await repository.create(createTestDeposit({ depositId: 'DEP-2' }));
      expect(await repository.count()).toBe(2);
    });
  });

  describe('data persistence', () => {
    it('should persist deposits across service restarts', async () => {
      // Create a deposit
      const created = await repository.create(
        createTestDeposit({ depositId: 'PERSIST-TEST' }),
      );
      await storage.save();

      // Create new instances (simulating restart)
      const storage2 = new LocalStorageService({ basePath: testBasePath });
      const repository2 = new DepositLocalRepository(storage2);

      // Verify data persisted
      const found = await repository2.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.depositId).toBe('PERSIST-TEST');

      await storage2.onModuleDestroy();
    });
  });

  describe('deposit types', () => {
    it('should handle all deposit types', async () => {
      const types = [
        DepositType.INSTAPAY,
        DepositType.PESONET,
        DepositType.BANK_TRANSFER,
        DepositType.CASH_IN,
      ];

      for (const type of types) {
        const deposit = await repository.create(
          createTestDeposit({ type, depositId: `DEP-${type}` }),
        );
        expect(deposit.type).toBe(type);
      }

      const all = await repository.findAll();
      expect(all).toHaveLength(4);
    });
  });

  describe('edge cases', () => {
    it('should handle deposits with zero amount', async () => {
      const deposit = await repository.create(
        createTestDeposit({ amount: 0, phpAmount: 0 }),
      );
      expect(deposit.amount).toBe(0);
      expect(deposit.phpAmount).toBe(0);
    });

    it('should handle deposits with large amounts', async () => {
      const deposit = await repository.create(
        createTestDeposit({ amount: 999999999.99, phpAmount: 999999999.99 }),
      );
      expect(deposit.amount).toBe(999999999.99);
    });

    it('should handle special characters in user data', async () => {
      const deposit = await repository.create(
        createTestDeposit({
          firstName: "O'Connor",
          lastName: 'Müller-Schmidt',
          email: 'test+special@example.com',
        }),
      );
      expect(deposit.firstName).toBe("O'Connor");
      expect(deposit.lastName).toBe('Müller-Schmidt');
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        repository.create(createTestDeposit({ depositId: `CONCURRENT-${i}` })),
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);

      const count = await repository.count();
      expect(count).toBe(10);
    });
  });
});
