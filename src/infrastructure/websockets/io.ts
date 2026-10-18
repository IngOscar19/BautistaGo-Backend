import { Server } from 'socket.io';

// Instancia compartida de Socket.io. Se crea aquí (sin side effects de servidor
// HTTP) para que controllers y main.ts la usen sin importarse mutuamente.
export const io = new Server({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(','),
    methods: ['GET', 'POST'],
  },
});
