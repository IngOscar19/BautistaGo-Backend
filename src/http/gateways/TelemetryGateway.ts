import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  speed?: number;
}

export class TelemetryGateway {
  constructor(private readonly io: Server) {
    this.setup();
  }

  private setup(): void {
    // Protección estricta con JWT en handshake (RNF 3.3.2)
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Autenticación requerida'));

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        (socket as any).user = decoded;
        next();
      } catch {
        next(new Error('Token WS inválido o expirado'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      // Suscripción de pantalla de cocina
      socket.on('kitchen:subscribe', () => {
        socket.join('kitchen_room');
      });

      // Suscripción de cliente a su comanda
      socket.on('order:subscribe', (orderId: string) => {
        socket.join(`order_room_${orderId}`);
      });

      // Emisión de coordenadas del repartidor (RF4, RF 3.2.12)
      socket.on('telemetry:emit', (payload: { orderId: string; coords: GeoLocation }) => {
        socket.to(`order_room_${payload.orderId}`).emit('telemetry:location', {
          coords: payload.coords,
          timestamp: Date.now(),
        });
      });

      socket.on('disconnect', () => {
        socket.rooms.forEach(r => socket.leave(r));
      });
    });
  }
}
