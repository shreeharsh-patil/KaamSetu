import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { UserRole, UserStatus } from '@kaamsetu/types';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('UserRepository (Phase 1)', () => {
  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    try {
      await UserModel.collection.dropIndex('email_1');
    } catch {
      // index might not exist
    }
    await UserModel.syncIndexes();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ phoneNumber: /^\+9199999/ });
    await disconnectMongoDB();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({ phoneNumber: /^\+9199999/ });
  });

  it('should create a user and normalize the phone number to E.164', async () => {
    const user = await userRepository.create({
      phoneNumber: '9999900001', // 10 digits without prefix
      role: UserRole.CUSTOMER,
      preferredLanguage: 'hi',
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.phoneNumber).toBe('+919999900001');
    expect(user.role).toBe(UserRole.CUSTOMER);
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.preferredLanguage).toBe('hi');
    expect(user.deletedAt).toBeNull();
  });

  it('should find user by phone number using normalized format', async () => {
    await userRepository.create({
      phoneNumber: '9999900002',
      role: UserRole.WORKER,
    });

    // Query with different representations of the same number
    const found1 = await userRepository.findByPhone('+919999900002');
    const found2 = await userRepository.findByPhone('9999900002');
    const found3 = await userRepository.findByPhone('09999900002');

    expect(found1).not.toBeNull();
    expect(found2).not.toBeNull();
    expect(found3).not.toBeNull();
    expect(found1?.id).toBe(found2?.id);
    expect(found2?.id).toBe(found3?.id);
  });

  it('should reject duplicate phone numbers due to unique index', async () => {
    await userRepository.create({
      phoneNumber: '9999900003',
    });

    await expect(
      userRepository.create({
        phoneNumber: '+919999900003',
      })
    ).rejects.toThrow();
  });

  it('should allow multiple users with null email (sparse index) but reject duplicate email', async () => {
    const user1 = await userRepository.create({
      phoneNumber: '9999900004',
      email: null,
    });

    const user2 = await userRepository.create({
      phoneNumber: '9999900005',
      email: null,
    });

    expect(user1.email).toBeNull();
    expect(user2.email).toBeNull();

    // Now test duplicate email
    await userRepository.create({
      phoneNumber: '9999900006',
      email: 'unique-worker@example.com',
    });

    await expect(
      userRepository.create({
        phoneNumber: '9999900007',
        email: 'unique-worker@example.com',
      })
    ).rejects.toThrow();
  });

  it('should soft delete user and exclude from standard queries', async () => {
    const user = await userRepository.create({
      phoneNumber: '9999900008',
    });

    const deleted = await userRepository.softDelete(user.id);
    expect(deleted).toBe(true);

    // Standard search should not find it
    const activeUser = await userRepository.findById(user.id);
    expect(activeUser).toBeNull();

    // With includeDeleted = true, it should return with deletedAt set
    const deletedUser = await userRepository.findById(user.id, true);
    expect(deletedUser).not.toBeNull();
    expect(deletedUser?.deletedAt).toBeInstanceOf(Date);

    // Restore user
    await userRepository.restore(user.id);
    const restoredUser = await userRepository.findById(user.id);
    expect(restoredUser).not.toBeNull();
    expect(restoredUser?.deletedAt).toBeNull();
  });
});
