/**
 * Local Storage Example - Testing Without Production Interference
 *
 * This file demonstrates how to use the LocalStorageService for testing.
 * Data is stored in: data/local-storage-test/local-storage.json
 *
 * Run this example:
 *   npx ts-node test/local-storage.example.ts
 */

import { LocalStorageService } from '../src/infrastructure/local-storage';
import { DepositLocalRepository } from '../src/modules/deposits/repositories/deposit.local.repository';
import {
  DepositType,
  DepositStatus,
} from '../src/modules/deposits/entities/deposit.entity';

// Example interfaces for demonstration
interface User {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface Transaction {
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
}

async function basicUsageExample() {
  console.log('\n=== Basic LocalStorageService Usage ===\n');

  // Initialize the storage service
  const storage = new LocalStorageService({
    basePath: 'data/local-storage-test',
    prettyPrint: true,
  });

  // Create a collection for users
  const users = storage.collection<User>('users');

  // Create documents
  const user1 = await users.create({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
  });
  console.log('Created user:', user1);

  // Set a document with specific ID
  await users.set('custom-id', {
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
  });
  console.log('Created user with custom ID: custom-id');

  // Get a document
  const retrieved = await users.get(user1.id);
  console.log('Retrieved user:', retrieved);

  // Update a document
  const updated = await users.update(user1.id, { role: 'user' });
  console.log('Updated user:', updated);

  // Query documents
  const admins = await users.queryData({
    where: (u) => u.role === 'admin',
    limit: 10,
  });
  console.log('Admin users:', admins);

  // Count documents
  const count = await users.count();
  console.log('Total users:', count);

  // Delete a document
  await users.delete('custom-id');
  console.log('Deleted user: custom-id');

  // Save and cleanup
  await storage.save();
  console.log('\nData saved to: data/local-storage-test/local-storage.json');
}

async function transactionExample() {
  console.log('\n=== Transaction Collection Example ===\n');

  const storage = new LocalStorageService();
  const transactions = storage.collection<Transaction>('transactions');

  // Add some transactions
  await transactions.create({
    amount: 1000.0,
    currency: 'PHP',
    description: 'Deposit from UnionBank',
    status: 'completed',
  });

  await transactions.create({
    amount: 500.0,
    currency: 'PHP',
    description: 'Transfer to account',
    status: 'pending',
  });

  await transactions.create({
    amount: 250.0,
    currency: 'PHP',
    description: 'Payment processing',
    status: 'failed',
  });

  // Query by status
  const pendingTxns = await transactions.queryData({
    where: (t) => t.status === 'pending',
  });
  console.log('Pending transactions:', pendingTxns);

  // Query with sorting
  const sortedByAmount = await transactions.queryData({
    orderBy: (a, b) => b.amount - a.amount,
    limit: 5,
  });
  console.log('Top transactions by amount:', sortedByAmount);

  // Find first matching
  const firstFailed = await transactions.findFirstData(
    (t) => t.status === 'failed',
  );
  console.log('First failed transaction:', firstFailed);

  await storage.save();
}

async function depositRepositoryExample() {
  console.log('\n=== DepositLocalRepository Example ===\n');

  // This shows how to use the local repository instead of Firebase
  const storage = new LocalStorageService();
  const depositRepo = new DepositLocalRepository(storage);

  // Create a deposit
  const deposit = await depositRepo.create({
    userId: 'user-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    depositId: 'DEP-001',
    amount: 1000,
    phpAmount: 1000,
    currency: 'PHP',
    type: DepositType.INSTAPAY,
    metadata: {
      source: 'test',
      testRun: new Date().toISOString(),
    },
  });
  console.log('Created deposit:', deposit);

  // Find by ID
  const found = await depositRepo.findById(deposit.id);
  console.log('Found by ID:', found?.id);

  // Find by deposit ID
  const byDepositId = await depositRepo.findByDepositId('DEP-001');
  console.log('Found by deposit ID:', byDepositId?.depositId);

  // Update status
  const updated = await depositRepo.updateStatus(
    deposit.id,
    DepositStatus.COMPLETED,
    'Processing completed successfully',
  );
  console.log('Updated status:', updated?.status);

  // Get count
  const count = await depositRepo.count();
  console.log('Total deposits:', count);

  await storage.save();
}

async function cleanupExample() {
  console.log('\n=== Cleanup Example ===\n');

  const storage = new LocalStorageService();

  // List all collections
  console.log('Collections:', storage.listCollections());

  // Clear a specific collection
  const users = storage.collection('users');
  await users.clear();
  console.log('Users collection cleared');

  // Clear all data
  storage.clearAll();
  console.log('All data cleared');

  await storage.save();
}

// Run all examples
async function main() {
  try {
    await basicUsageExample();
    await transactionExample();
    await depositRepositoryExample();
    await cleanupExample();

    console.log('\n=== All examples completed! ===');
    console.log('Check: data/local-storage-test/local-storage.json\n');
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

void main();
