import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  LocalStorageService,
  LocalCollection,
} from '../../../infrastructure/local-storage';
import {
  CreateDepositData,
  Deposit,
  DepositStatus,
  UpdateDepositData,
} from '../entities/deposit.entity';

const DEPOSITS_COLLECTION = 'deposits';

/**
 * Local storage implementation of DepositRepository for testing purposes.
 * This repository stores data in a local JSON file instead of Firebase,
 * allowing you to test without interfering with production data.
 *
 * Usage:
 * - Import LocalStorageModule.forRoot() in your test module
 * - Inject DepositLocalRepository instead of DepositRepository
 * - Data will be stored in: data/local-storage-test/local-storage.json
 */
@Injectable()
export class DepositLocalRepository {
  private readonly logger = new Logger(DepositLocalRepository.name);
  private collection: LocalCollection<Deposit>;

  constructor(private readonly localStorage: LocalStorageService) {
    this.collection =
      this.localStorage.collection<Deposit>(DEPOSITS_COLLECTION);
    this.logger.log('Deposit local repository initialized');
  }

  async create(data: CreateDepositData): Promise<Deposit> {
    const id = uuidv4();
    const now = new Date();

    const deposit: Deposit = {
      id,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      depositId: data.depositId,
      amount: data.amount,
      phpAmount: data.phpAmount,
      currency: data.currency,
      status: DepositStatus.PENDING,
      type: data.type,
      createdAt: now,
      time: now.toISOString(),
      metadata: data.metadata,
    };

    await this.collection.set(id, deposit);
    this.logger.log(`Deposit created locally: ${id}`);

    return deposit;
  }

  async findById(id: string): Promise<Deposit | null> {
    const data = await this.collection.getData(id);
    if (!data) {
      return null;
    }
    return this.deserializeDeposit(data);
  }

  async findByDepositId(depositId: string): Promise<Deposit | null> {
    const result = await this.collection.findFirstData(
      (deposit) => deposit.depositId === depositId,
    );
    if (!result) {
      return null;
    }
    return this.deserializeDeposit(result);
  }

  async findByUserId(userId: string, limit: number = 20): Promise<Deposit[]> {
    const results = await this.collection.queryData({
      where: (deposit) => deposit.userId === userId,
      orderBy: (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      limit,
    });
    return results.map((d) => this.deserializeDeposit(d));
  }

  async findByStatus(
    status: DepositStatus,
    limit: number = 100,
  ): Promise<Deposit[]> {
    const results = await this.collection.queryData({
      where: (deposit) => deposit.status === status,
      orderBy: (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      limit,
    });
    return results.map((d) => this.deserializeDeposit(d));
  }

  async update(id: string, data: UpdateDepositData): Promise<Deposit | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updatedDeposit: Deposit = {
      ...existing,
      ...(data.status !== undefined && { status: data.status }),
      ...(data.externalReferenceId !== undefined && {
        externalReferenceId: data.externalReferenceId,
      }),
      ...(data.statusMessage !== undefined && {
        statusMessage: data.statusMessage,
      }),
      ...(data.failureReason !== undefined && {
        failureReason: data.failureReason,
      }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    await this.collection.set(id, updatedDeposit);
    this.logger.log(`Deposit updated locally: ${id}`);

    return this.findById(id);
  }

  async updateStatus(
    id: string,
    status: DepositStatus,
    statusMessage?: string,
  ): Promise<Deposit | null> {
    const updateData: UpdateDepositData = { status, statusMessage };

    if (status === DepositStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.update(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    const exists = await this.collection.exists(id);
    if (!exists) {
      return false;
    }

    await this.collection.delete(id);
    this.logger.log(`Deposit deleted locally: ${id}`);

    return true;
  }

  /**
   * Clear all deposits (useful for test cleanup)
   */
  async clearAll(): Promise<void> {
    await this.collection.clear();
    this.logger.log('All local deposits cleared');
  }

  /**
   * Get total count of deposits
   */
  async count(): Promise<number> {
    return this.collection.count();
  }

  /**
   * Get all deposits (for debugging/testing)
   */
  async findAll(): Promise<Deposit[]> {
    const all = await this.collection.getAllData();
    return all.map((d) => this.deserializeDeposit(d));
  }

  /**
   * Deserialize deposit from stored format
   * Handles Date serialization from JSON
   */
  private deserializeDeposit(data: Deposit): Deposit {
    return {
      ...data,
      createdAt:
        data.createdAt instanceof Date
          ? data.createdAt
          : new Date(data.createdAt),
      completedAt: data.completedAt
        ? data.completedAt instanceof Date
          ? data.completedAt
          : new Date(data.completedAt)
        : undefined,
    };
  }
}
