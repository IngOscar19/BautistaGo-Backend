import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { User, type UserRole } from '../../domain/entities/User';
import type { IUserRepository } from '../../domain/interfaces';
import type { CreateUserDTO } from '../dtos/CreateUserDTO';

export class UserFacade {
  constructor(private readonly userRepo: IUserRepository) {}

  async registerUser(dto: CreateUserDTO): Promise<User> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = new User(
      randomUUID(),
      dto.name,
      dto.email,
      passwordHash,
      dto.role,
      dto.phone,
      true,
      null
    );

    return await this.userRepo.save(user);
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepo.findById(id);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await this.userRepo.findByRole(role);
  }

  async deactivateUser(id: string): Promise<void> {
    await this.userRepo.softDelete(id);
  }

  async reactivateUser(id: string): Promise<void> {
    await this.userRepo.reactivate(id);
  }
}
