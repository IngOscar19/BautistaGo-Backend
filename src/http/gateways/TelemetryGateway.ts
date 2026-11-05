import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '../../infrastructure/logging/logger';

const GeoLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
  speed: z.number().nonnegative().optional(),
});

export const TelemetryEmitSchema = z.object({
  orderId: z.string().uuid(),
  coords: GeoLocationSchema,
});

type TelemetryUser = JwtPayload & {
  id: string;
  role?: string;
};

interface DriverSubscribePayload {
  driverId?: string;
}

const TELEMETRY_MIN_INTERVAL_MS = 2000;

export class TelemetryGateway {
  private readonly lastTelemetryAt = new WeakMap<Socket, number>();

  constructor(private readonly io: Server) {
    this.setup();
  }

  private setup(): void {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;

      if (!token) {
        logger.warn('Conexión WebSocket rechazada: token ausente', {
          socketId: socket.id,
        });
        return next(new Error('Autenticación requerida'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        (socket as any).user = decoded;
        next();
      } catch (error) {
        logger.warn('Conexión WebSocket rechazada: token inválido o expirado', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
        next(new Error('Token WS inválido o expirado'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user as TelemetryUser | undefined;

      logger.debug('Socket conectado', {
        socketId: socket.id,
        userId: user?.id,
        role: user?.role,
      });

      socket.on('kitchen:subscribe', () => {
        socket.join('kitchen_room');
      });

      socket.on('order:subscribe', (orderId: string) => {
        socket.join(`order_room_${orderId}`);
      });

      socket.on('driver:subscribe', (payload?: DriverSubscribePayload) => {
        const requestedDriverId = payload?.driverId;
        const isAdmin = user?.role === 'ADMIN';
        const driverId = isAdmin && requestedDriverId ? requestedDriverId : user?.id;

        if (!driverId) {
          logger.warn('Suscripción a driver_room rechazada: driverId no disponible', {
            socketId: socket.id,
          });
          return;
        }

        if (!isAdmin && requestedDriverId && requestedDriverId !== user?.id) {
          logger.warn('Suscripción a driver_room rechazada: driverId no coincide con el token', {
            socketId: socket.id,
            requestedDriverId,
            userId: user?.id,
          });
          return;
        }

        socket.join(`driver_room_${driverId}`);
        logger.debug('Socket suscrito a driver_room', {
          socketId: socket.id,
          driverId,
        });
      });

      socket.on('telemetry:emit', (payload: unknown) => {
        const now = Date.now();
        const lastEmittedAt = this.lastTelemetryAt.get(socket) ?? 0;

        if (now - lastEmittedAt < TELEMETRY_MIN_INTERVAL_MS) {
          logger.debug('Telemetría omitida por throttle', {
            socketId: socket.id,
            elapsedMs: now - lastEmittedAt,
          });
          return;
        }

        this.lastTelemetryAt.set(socket, now);

        const parsed = TelemetryEmitSchema.safeParse(payload);
        if (!parsed.success) {
          logger.warn('Telemetría descartada: payload inválido', {
            socketId: socket.id,
            errors: parsed.error.flatten(),
          });
          return;
        }

        const { orderId, coords } = parsed.data;

        socket.to(`order_room_${orderId}`).emit('telemetry:location', {
          coords,
          timestamp: now,
        });
      });

      socket.on('disconnect', () => {
        logger.debug('Socket desconectado', { socketId: socket.id });
        socket.rooms.forEach(room => socket.leave(room));
      });
    });
  }
}
