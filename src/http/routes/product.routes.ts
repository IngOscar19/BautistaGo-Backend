import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/asyncHandler';

export const productRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Catálogo de platillos y productos de Carnitas Bautista
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener catálogo de productos disponibles
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: includeAll
 *         schema:
 *           type: boolean
 *         description: Incluir productos no disponibles (requiere admin)
 *     responses:
 *       200:
 *         description: Lista de productos del menú
 *   post:
 *     summary: Crear un nuevo producto en el catálogo (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, pricingType]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Carnitas Surtidas
 *               description:
 *                 type: string
 *                 example: Carnitas tradicionales estilo Michoacán
 *               price:
 *                 type: number
 *                 example: 280.0
 *               pricingType:
 *                 type: string
 *                 enum: [BY_WEIGHT_KG, BY_WEIGHT_G, BY_PIECE]
 *                 example: BY_WEIGHT_KG
 *               category:
 *                 type: string
 *                 example: Carnitas
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://ejemplo.com/carnitas.jpg
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
 */
productRoutes.get('/', asyncHandler(ProductController.list));

productRoutes.post('/', authenticateJwt, requireRole('ADMIN'), asyncHandler(ProductController.create));

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener detalle de un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información del producto
 *       404:
 *         description: Producto no encontrado
 *   delete:
 *     summary: Eliminación lógica (soft delete) de un producto (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Producto marcado como eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
 */
productRoutes.get('/:id', asyncHandler(ProductController.getById));

/**
 * @swagger
 * /api/products/{id}/availability:
 *   patch:
 *     summary: Conmutar disponibilidad de un producto (Admin / Cocina)
 *     tags: [Products]
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
 *         description: Disponibilidad actualizada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Permisos insuficientes
 */
productRoutes.patch(
  '/:id/availability',
  authenticateJwt,
  requireRole('ADMIN', 'KITCHEN_OPERATOR'),
  asyncHandler(ProductController.toggleAvailability)
);

productRoutes.delete('/:id', authenticateJwt, requireRole('ADMIN'), asyncHandler(ProductController.softDelete));
