import type { User, UserRole } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByRole(role: UserRole): Promise<User[]>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  softDelete(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
}
