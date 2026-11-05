import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/asyncHandler';

export const orderRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión del ciclo de vida de comandas y pedidos
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear un nuevo pedido / comanda
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderType, items]
 *             properties:
 *               orderType:
 *                 type: string
 *                 enum: [COUNTER, DINE_IN, DELIVERY]
 *                 example: DELIVERY
 *               deliveryAddress:
 *                 type: string
 *                 example: "Calle Aldama 12, Centro, San Miguel de Allende"
 *               deliveryLat:
 *                 type: number
 *                 example: 20.91436
 *               deliveryLng:
 *                 type: number
 *                 example: -100.74523
 *               deliveryFee:
 *                 type: number
 *                 example: 35.0
 *               notes:
 *                 type: string
 *                 example: "Tocar el timbre blanco"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity, unitPrice]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                       example: 1.5
 *                     unitPrice:
 *                       type: number
 *                       example: 280.0
 *                     pricingTypeSnapshot:
 *                       type: string
 *                       enum: [BY_WEIGHT_KG, BY_WEIGHT_G, BY_PIECE]
 *                     notes:
 *                       type: string
 *                       example: "Bien doradas con cuerito"
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *       400:
 *         description: Error de validación en los datos
 *       401:
 *         description: No autenticado
 *   get:
 *     summary: Listar pedidos paginados con filtros (Cocina / Reparto / Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_KITCHEN, IN_PREPARATION, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Listado paginado de pedidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Permisos insuficientes
 */
orderRoutes.post('/', authenticateJwt, asyncHandler(OrderController.create));

orderRoutes.get(
  '/',
  authenticateJwt,
  requireRole('KITCHEN_OPERATOR', 'DELIVERY_DRIVER', 'ADMIN'),
  asyncHandler(OrderController.getAll)
);

/**
 * @swagger
 * /api/orders/my-history:
 *   get:
 *     summary: Historial de pedidos del cliente autenticado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Historial de pedidos del cliente
 *       401:
 *         description: No autenticado
 */
orderRoutes.get('/my-history', authenticateJwt, asyncHandler(OrderController.getCustomerHistory));

/**
 * @swagger
 * /api/orders/status/{status}:
 *   get:
 *     summary: Listar pedidos por estado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PENDING_KITCHEN, IN_PREPARATION, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Lista de pedidos con el estado especificado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Permisos insuficientes
 */
orderRoutes.get(
  '/status/:status',
  authenticateJwt,
  requireRole('KITCHEN_OPERATOR', 'DELIVERY_DRIVER', 'ADMIN'),
  asyncHandler(OrderController.getByStatus)
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Consultar detalle de un pedido por ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del pedido
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Pedido no encontrado
 */
orderRoutes.get('/:id', authenticateJwt, asyncHandler(OrderController.getById));

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Avanzar el estado de una comanda (Cocina -> Listo -> Reparto -> Entregado) con control de concurrencia
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerFcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado avanzado exitosamente
 *       400:
 *         description: Transición inválida
 *       409:
 *         description: Conflicto de concurrencia optimista (pedido modificado simultáneamente)
 */
orderRoutes.patch(
  '/:id/status',
  authenticateJwt,
  requireRole('KITCHEN_OPERATOR', 'DELIVERY_DRIVER', 'ADMIN'),
  asyncHandler(OrderController.advanceStatus)
);

/**
 * @swagger
 * /api/orders/{id}/assign-driver:
 *   patch:
 *     summary: Asignar repartidor a un pedido (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [driverId]
 *             properties:
 *               driverId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Repartidor asignado exitosamente
 *       404:
 *         description: Pedido o repartidor no encontrado
 */
orderRoutes.patch(
  '/:id/assign-driver',
  authenticateJwt,
  requireRole('ADMIN'),
  asyncHandler(OrderController.assignDriver)
);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancelar una comanda
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido cancelado
 *       400:
 *         description: No se puede cancelar en el estado actual
 */
orderRoutes.post(
  '/:id/cancel',
  authenticateJwt,
  requireRole('KITCHEN_OPERATOR', 'ADMIN'),
  asyncHandler(OrderController.cancel)
);
