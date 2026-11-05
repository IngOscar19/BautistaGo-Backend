import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

export const orderRoutes = Router();

// Cliente crea comanda / pedido
orderRoutes.post('/', authenticateJwt, OrderController.create);

// Historial del cliente autenticado
orderRoutes.get('/my-history', authenticateJwt, OrderController.getCustomerHistory);

// Listado paginado para panel de administración y cocina
orderRoutes.get(
  '/',
  authenticateJwt,
  requireRole('KITCHEN_OPERATOR', 'DELIVERY_DRIVER', 'ADMIN'),
  OrderController.getAll
);

// Consulta de orden por ID
orderRoutes.get('/:id', authenticateJwt, OrderController.getById);

// Listar órdenes por estado (ej. cocina o repartidores)
orderRoutes.get(
  '/status/:status',
  authenticateJwt,
  requireRole('KITCHEN_OPERATOR', 'DELIVERY_DRIVER', 'ADMIN'),
  OrderController.getByStatus
);

// Avance de estado de comanda (Cocina -> Listo -> Reparto -> Entregado)
orderRoutes.patch(
  '/:id/status',
  authenticateJwt,
  requireRole('KITCHEN_OPERATOR', 'DELIVERY_DRIVER', 'ADMIN'),
  OrderController.advanceStatus
);

// Asignación de repartidor (panel de administración)
orderRoutes.patch('/:id/assign-driver', authenticateJwt, requireRole('ADMIN'), OrderController.assignDriver);

// Cancelación de comanda
orderRoutes.post('/:id/cancel', authenticateJwt, requireRole('KITCHEN_OPERATOR', 'ADMIN'), OrderController.cancel);
