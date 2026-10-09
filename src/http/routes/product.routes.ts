import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

export const productRoutes = Router();

// Catálogo público
productRoutes.get('/', ProductController.list);
productRoutes.get('/:id', ProductController.getById);

// Operaciones protegidas para Administradores
productRoutes.post('/', authenticateJwt, requireRole('ADMIN'), ProductController.create);
productRoutes.patch('/:id/availability', authenticateJwt, requireRole('ADMIN', 'KITCHEN'), ProductController.toggleAvailability);
productRoutes.delete('/:id', authenticateJwt, requireRole('ADMIN'), ProductController.softDelete);
