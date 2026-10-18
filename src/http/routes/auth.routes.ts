import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJwt } from '../middlewares/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.post('/refresh', AuthController.refresh);
authRoutes.post('/logout', authenticateJwt, AuthController.logout);
authRoutes.patch('/fcm-token', authenticateJwt, AuthController.updateFcmToken);
authRoutes.get('/me', authenticateJwt, AuthController.me);
