import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/asyncHandler';

export const authRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios y administración de sesiones
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo cliente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 example: juan@ejemplo.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Secret123!
 *               phone:
 *                 type: string
 *                 example: "4151234567"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente con tokens
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: El correo ya está registrado
 */
authRoutes.post('/register', asyncHandler(AuthController.register));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: juan@ejemplo.com
 *               password:
 *                 type: string
 *                 example: Secret123!
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso, retorna tokens JWT
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: Credenciales inválidas
 */
authRoutes.post('/login', asyncHandler(AuthController.login));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar access token usando refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 9a78...
 *     responses:
 *       200:
 *         description: Nuevos tokens generados (rotación)
 *       400:
 *         description: Refresh token requerido o inválido
 *       401:
 *         description: Refresh token expirado o revocado
 */
authRoutes.post('/refresh', asyncHandler(AuthController.refresh));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión revocando el refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 9a78...
 *     responses:
 *       200:
 *         description: Sesión cerrada y token revocado
 *       401:
 *         description: No autenticado
 */
authRoutes.post('/logout', authenticateJwt, asyncHandler(AuthController.logout));

/**
 * @swagger
 * /api/auth/fcm-token:
 *   patch:
 *     summary: Actualizar token de Firebase Cloud Messaging para notificaciones push
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken]
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 example: fzL-8Qe...
 *     responses:
 *       200:
 *         description: Token FCM actualizado
 *       401:
 *         description: No autenticado
 */
authRoutes.patch('/fcm-token', authenticateJwt, asyncHandler(AuthController.updateFcmToken));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 */
authRoutes.get('/me', authenticateJwt, asyncHandler(AuthController.me));
