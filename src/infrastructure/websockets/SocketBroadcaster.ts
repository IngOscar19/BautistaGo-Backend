import { Server } from 'socket.io';
import type { IWebSocketBroadcaster } from '../../domain/interfaces';

export class SocketBroadcaster implements IWebSocketBroadcaster {
  constructor(private readonly io: Server) {}

  broadcastToRoom(room: string, event: string, data: Record<string, unknown>): void {
    this.io.to(room).emit(event, data);
  }
}
