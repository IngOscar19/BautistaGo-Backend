import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

export const productRoutes = Router();

// Catálogo público
productRoutes.get('/', ProductController.list);
productRoutes.get('/:id', ProductController.getById);

// Operaciones protegidas para Administradores
productRoutes.post('/', authenticateJwt, requireRole('ADMIN'), ProductController.create);
<<<<<<< HEAD
<<<<<<< HEAD
productRoutes.patch('/:id/availability', authenticateJwt, requireRole('ADMIN', 'KITCHEN_OPERATOR'), ProductController.toggleAvailability);
=======
productRoutes.patch(
  '/:id/availability',
  authenticateJwt,
  requireRole('ADMIN', 'KITCHEN_OPERATOR'),
  ProductController.toggleAvailability
);
>>>>>>> feature/BE-01-project-scaffold
=======
productRoutes.patch('/:id/availability', authenticateJwt, requireRole('ADMIN', 'KITCHEN_OPERATOR'), ProductController.toggleAvailability);
>>>>>>> feature/BE-02-domain-entities
productRoutes.delete('/:id', authenticateJwt, requireRole('ADMIN'), ProductController.softDelete);
