import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../../infrastructure/db/prisma.client';
import { logger } from '../../shared/logger';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { UserRole } from '../../domain/entities/User';

const RegisterSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const LogoutSchema = z.object({
  refreshToken: z.string().min(10),
});

const FcmTokenSchema = z.object({
  fcmToken: z.string().min(10, 'Token FCM inválido'),
});

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

function signAccessToken(payload: JwtPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn });
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function msFromDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const factors: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * factors[match[2]];
}

async function issueTokens(payload: JwtPayload): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken(payload);
  const refreshToken = randomBytes(48).toString('hex');

  await prisma.refreshToken.create({
    data: {
      userId: payload.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + msFromDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d')),
    },
  });

  return { accessToken, refreshToken };
}

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
      }

      const existing = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (existing) {
        return res.status(409).json({ error: 'El correo electrónico ya se encuentra registrado' });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      const user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: 'CUSTOMER',
          phone: parsed.data.phone,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      });

      const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role });

      logger.info('Usuario registrado', { userId: user.id, email: user.email });
      res.status(201).json({ user, ...tokens });
    } catch (err) {
      logger.error('Error al registrar usuario', { error: err });
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
      }

      const user = await prisma.user.findFirst({
        where: { email: parsed.data.email, deletedAt: null, isActive: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role });

      logger.info('Inicio de sesión exitoso', { userId: user.id });
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        ...tokens,
      });
    } catch (err) {
      logger.error('Error al iniciar sesión', { error: err });
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RefreshSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
      }

      const stored = await prisma.refreshToken.findUnique({
        where: { tokenHash: sha256(parsed.data.refreshToken) },
      });

      if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Refresh token inválido o expirado' });
      }

      const user = await prisma.user.findFirst({
        where: { id: stored.userId, deletedAt: null, isActive: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Refresh token inválido o expirado' });
      }

      // Rotación: se invalida el token anterior y se emite uno nuevo (RF de seguridad)
      const tokens = await prisma.$transaction(async (tx) => {
        await tx.refreshToken.update({
          where: { id: stored.id },
          data: { isRevoked: true },
        });

        const refreshToken = randomBytes(48).toString('hex');
        await tx.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: sha256(refreshToken),
            expiresAt: new Date(Date.now() + msFromDuration(process.env.JWT_REFRESH_EXPIITS_IN || '7d')),
          },
        });

        return {
          accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role }),
          refreshToken,
        };
      });

      logger.info('Refresh token rotado', { userId: user.id });
      res.json(tokens);
    } catch (err) {
      logger.error('Error al refrescar token', { error: err });
      next(err);
    }
  },

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = LogoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
      }

      await prisma.refreshToken.updateMany({
        where: { tokenHash: sha256(parsed.data.refreshToken), isRevoked: false },
        data: { isRevoked: true },
      });

      logger.info('Sesión cerrada', { userId: req.user?.id });
      res.json({ message: 'Sesión cerrada' });
    } catch (err) {
      logger.error('Error al cerrar sesión', { error: err });
      next(err);
    }
  },

  async updateFcmToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const parsed = FcmTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: { fcmToken: parsed.data.fcmToken },
      });

      res.json({ message: 'Token FCM actualizado' });
    } catch (err) {
      logger.error('Error al actualizar token FCM', { error: err });
      next(err);
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (err) {
      logger.error('Error al obtener usuario autenticado', { error: err });
      next(err);
    }
  },
};
