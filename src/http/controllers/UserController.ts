import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../../infrastructure/db/prisma.client';
import type { UserRole } from '../../domain/entities/User';

const CreateEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['KITCHEN', 'DELIVERY', 'ADMIN']),
  phone: z.string().optional(),
});

export const UserController = {
  async registerEmployee(req: Request, res: Response) {
    const parsed = CreateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) return res.status(409).json({ error: 'El correo ya se encuentra registrado' });

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role as UserRole,
        phone: parsed.data.phone,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    res.status(201).json(user);
  },

  async listEmployees(req: Request, res: Response) {
    const role = req.query.role as UserRole | undefined;
    const whereClause: any = {
      role: role ? role : { in: ['KITCHEN', 'DELIVERY', 'ADMIN'] },
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
  },

  async deactivate(req: Request, res: Response) {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
    res.json({ message: 'Usuario desactivado lógicamente (soft delete)' });
  },

  async reactivate(req: Request, res: Response) {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { isActive: true, deletedAt: null },
    });
    res.json({ message: 'Usuario reactivado con éxito' });
  },
};
