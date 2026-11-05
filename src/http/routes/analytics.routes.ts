import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/asyncHandler';

export const analyticsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Métricas y reportes operativos del negocio (Exclusivo Administradores)
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Obtener métricas y KPIs operativos del negocio (Admin)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio para cálculo de métricas
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin para cálculo de métricas
 *     responses:
 *       200:
 *         description: Métricas consolidadas (ventas, pedidos, tiempos promedio)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
 */
analyticsRoutes.get('/dashboard', authenticateJwt, requireRole('ADMIN'), asyncHandler(AnalyticsController.getMetrics));
