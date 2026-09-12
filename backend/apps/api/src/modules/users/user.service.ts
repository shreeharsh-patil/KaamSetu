import { IUserRepository, userRepository } from './user.repository.js';
import type { IUserEntity, ICreateUserInput, IUpdateUserInput } from '@kaamsetu/types';
import { UserStatus } from '@kaamsetu/types';
import { NotFoundError, ConflictError } from '../../errors/index.js';

export class UserService {
  constructor(private readonly userRepo: IUserRepository = userRepository) {}

  async getUserById(id: string): Promise<IUserEntity> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserByPhone(phone: string): Promise<IUserEntity | null> {
    return this.userRepo.findByPhone(phone);
  }

  async createUser(input: ICreateUserInput): Promise<IUserEntity> {
    const existing = await this.userRepo.findByPhone(input.phoneNumber);
    if (existing) {
      throw new ConflictError(`User with phone number ${input.phoneNumber} already exists`);
    }

    if (input.email) {
      const existingEmail = await this.userRepo.findByEmail(input.email);
      if (existingEmail) {
        throw new ConflictError(`User with email ${input.email} already exists`);
      }
    }

    return this.userRepo.create(input);
  }

  async updateUser(id: string, input: IUpdateUserInput): Promise<IUserEntity> {
    await this.getUserById(id);

    if (input.phoneNumber) {
      const existingPhone = await this.userRepo.findByPhone(input.phoneNumber);
      if (existingPhone && existingPhone.id !== id) {
        throw new ConflictError(`Phone number is already associated with another account`);
      }
    }

    if (input.email) {
      const existingEmail = await this.userRepo.findByEmail(input.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictError(`Email is already associated with another account`);
      }
    }

    const updated = await this.userRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return updated;
  }

  async softDeleteUser(id: string): Promise<void> {
    await this.getUserById(id);
    await this.userRepo.update(id, { status: UserStatus.DELETED });
    await this.userRepo.softDelete(id);
  }
}

export const userService = new UserService();
