import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

export const userRoutes = Router();

// Gestión de personal exclusivo para ADMIN
userRoutes.use(authenticateJwt, requireRole('ADMIN'));

userRoutes.post('/employees', UserController.registerEmployee);
userRoutes.get('/employees', UserController.listEmployees);
userRoutes.delete('/:id', UserController.deactivate);
userRoutes.patch('/:id/reactivate', UserController.reactivate);
