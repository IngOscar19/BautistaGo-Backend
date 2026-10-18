/**
 * Tests de integración del módulo de auth (BE-04).
 * Requisitos: Postgres corriendo (docker compose up -d), migraciones aplicadas
 * y DATABASE_URL apuntando a la base correcta.
 */
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../infrastructure/db/prisma.client';

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const email = `test.auth.${suffix}@bautistago.mx`;
const password = 'Secret123!';

let accessToken = '';
let refreshToken = '';
let userId = '';

describe('Auth (integración)', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('register crea usuario con rol CUSTOMER y devuelve tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Usuario de Prueba', email, password });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    userId = res.body.user.id;
  });

  it('login devuelve tokens para credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('ruta protegida con token válido retorna el perfil', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it('ruta protegida sin token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('login con contraseña incorrecta → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'contraseña-equivocada' });

    expect(res.status).toBe(401);
  });

  it('refresh rota el token y revoca el anterior', async () => {
    const oldRefreshToken = refreshToken;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(oldRefreshToken);

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;

    const reuse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(reuse.status).toBe(401);
  });

  it('logout revoca el refresh token (ya no puede refrescarse)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Sesión cerrada');

    const afterLogout = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(afterLogout.status).toBe(401);
  });

  it('ruta con rol incorrecto (CUSTOMER intenta acceso ADMIN) → 403', async () => {
    const res = await request(app)
      .get('/api/users/employees')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it('PATCH /api/auth/fcm-token actualiza el token FCM del usuario', async () => {
    const res = await request(app)
      .patch('/api/auth/fcm-token')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fcmToken: `fcm-token-prueba-${suffix}` });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Token FCM actualizado');
  });
});
