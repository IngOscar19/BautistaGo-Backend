import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../../infrastructure/db/prisma.client';
import type { UserRole } from '../../domain/entities/User';
import { ConflictError } from '../../shared/errors/AppError';

const CreateEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['KITCHEN_OPERATOR', 'DELIVERY_DRIVER', 'ADMIN']),
  phone: z.string().optional(),
});

export const UserController = {
  async registerEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateEmployeeSchema.parse(req.body);

      const exists = await prisma.user.findUnique({ where: { email: parsed.email } });
      if (exists) {
        throw new ConflictError('El correo ya se encuentra registrado');
      }

      const passwordHash = await bcrypt.hash(parsed.password, 12);
      const user = await prisma.user.create({
        data: {
          name: parsed.name,
          email: parsed.email,
          passwordHash,
          role: parsed.role as UserRole,
          phone: parsed.phone,
        },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });

      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  async listEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as UserRole | undefined;
      const whereClause: any = {
        role: role ? role : { in: ['KITCHEN_OPERATOR', 'DELIVERY_DRIVER', 'ADMIN'] },
      };

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          deletedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.user.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      });
      res.json({ message: 'Usuario desactivado lógicamente (soft delete)' });
    } catch (err) {
      next(err);
    }
  },

  async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.user.update({
        where: { id },
        data: { isActive: true, deletedAt: null },
      });
      res.json({ message: 'Usuario reactivado con éxito' });
    } catch (err) {
      next(err);
    }
  },
};
