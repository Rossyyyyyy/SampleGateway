import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../../infrastructure/firebase/firebase.service';
import {
  CreateDepositData,
  Deposit,
  DepositStatus,
  DepositType,
  UpdateDepositData,
} from '../entities/deposit.entity';
import { v4 as uuidv4 } from 'uuid';

const DEPOSITS_COLLECTION = 'deposits';

@Injectable()
export class DepositRepository {
  private readonly logger = new Logger(DepositRepository.name);

  constructor(private readonly firebase: FirebaseService) {}

  private get collection() {
    return this.firebase.collection(DEPOSITS_COLLECTION);
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

    await this.collection.doc(id).set(this.toFirestore(deposit));
    this.logger.log(`Deposit created: ${id}`);

    return deposit;
  }

  async findById(id: string): Promise<Deposit | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return this.fromFirestore(doc);
  }

  async findByDepositId(depositId: string): Promise<Deposit | null> {
    const snapshot = await this.collection
      .where('depositId', '==', depositId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return this.fromFirestore(snapshot.docs[0]);
  }

  async findByUserId(userId: string, limit: number = 20): Promise<Deposit[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => this.fromFirestore(doc));
  }

  async findByStatus(
    status: DepositStatus,
    limit: number = 100,
  ): Promise<Deposit[]> {
    const snapshot = await this.collection
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => this.fromFirestore(doc));
  }

  async update(id: string, data: UpdateDepositData): Promise<Deposit | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.externalReferenceId !== undefined)
      updateData.externalReferenceId = data.externalReferenceId;
    if (data.statusMessage !== undefined)
      updateData.statusMessage = data.statusMessage;
    if (data.failureReason !== undefined)
      updateData.failureReason = data.failureReason;
    if (data.completedAt !== undefined)
      updateData.completedAt = data.completedAt;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    await docRef.update(updateData);
    this.logger.log(`Deposit updated: ${id}`);

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
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    this.logger.log(`Deposit deleted: ${id}`);

    return true;
  }

  private toFirestore(deposit: Deposit): Record<string, unknown> {
    return {
      ...deposit,
      createdAt: deposit.createdAt,
      completedAt: deposit.completedAt ?? null,
    };
  }

  private fromFirestore(doc: FirebaseFirestore.DocumentSnapshot): Deposit {
    const data = doc.data();
    if (!data) {
      throw new Error(`Document ${doc.id} has no data`);
    }

    return {
      id: doc.id,
      userId: data.userId as string,
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      email: data.email as string,
      depositId: data.depositId as string,
      amount: data.amount as number,
      phpAmount: data.phpAmount as number,
      currency: data.currency as string,
      status: data.status as DepositStatus,
      type: data.type as DepositType,
      createdAt: this.toDate(data.createdAt),
      time: data.time as string,
      externalReferenceId: data.externalReferenceId as string | undefined,
      statusMessage: data.statusMessage as string | undefined,
      failureReason: data.failureReason as string | undefined,
      completedAt: data.completedAt ? this.toDate(data.completedAt) : undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date();
  }
}
