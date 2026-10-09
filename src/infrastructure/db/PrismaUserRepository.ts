import type { IUserRepository } from '../../domain/interfaces';
import { User, type UserRole } from '../../domain/entities/User';
import { prisma } from './prisma.client';

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { role, deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(r => this.toDomain(r));
  }

  async save(user: User): Promise<User> {
    const row = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
    return this.toDomain(row);
  }

  async update(user: User): Promise<User> {
    const row = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        deletedAt: user.deletedAt,
      },
    });
    return this.toDomain(row);
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async reactivate(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive: true, deletedAt: null },
    });
  }

  private toDomain(row: any): User {
    return new User(
      row.id,
      row.name,
      row.email,
      row.passwordHash,
      row.role as UserRole,
      row.phone,
      row.isActive,
      row.deletedAt
    );
  }
}
