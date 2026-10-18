import 'dotenv/config';
import http from 'http';
import admin from 'firebase-admin';
import { app } from './app';
import { TelemetryGateway } from './http/gateways/TelemetryGateway';
import { prisma } from './infrastructure/db/prisma.client';
import { io } from './infrastructure/websockets/io';

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const httpServer = http.createServer(app);
io.attach(httpServer);

new TelemetryGateway(io);

const PORT = process.env.PORT ?? '3000';
httpServer.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`🚀 BautistaGo backend corriendo en el puerto :${PORT}`);
  } catch (err) {
    console.warn('⚠️ No se pudo conectar a la base de datos PostgreSQL en el inicio (verifique que el contenedor esté corriendo).');
  }
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
