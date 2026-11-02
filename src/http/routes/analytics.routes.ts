import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

export const analyticsRoutes = Router();

// Acceso a métricas exclusivo para ADMIN
analyticsRoutes.get('/dashboard', authenticateJwt, requireRole('ADMIN'), AnalyticsController.getMetrics);
