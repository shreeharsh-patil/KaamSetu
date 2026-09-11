import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { withTransaction } from '../src/database/transaction.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { UserRole } from '@kaamsetu/types';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('Database withTransaction Helper (Phase 1)', () => {
  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ phoneNumber: /^\+9199997/ });
    await disconnectMongoDB();
  });

  it('should execute operations within withTransaction helper successfully', async () => {
    const result = await withTransaction(async (session) => {
      const user = await userRepository.create(
        {
          phoneNumber: '9999700001',
          role: UserRole.CUSTOMER,
        },
        session
      );
      return user;
    });

    expect(result).toBeDefined();
    expect(result.phoneNumber).toBe('+919999700001');

    const found = await userRepository.findById(result.id);
    expect(found).not.toBeNull();
  });
});
