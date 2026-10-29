import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { authRoutes } from './http/routes/auth.routes';
import { orderRoutes } from './http/routes/order.routes';
import { productRoutes } from './http/routes/product.routes';
import { userRoutes } from './http/routes/user.routes';
import { analyticsRoutes } from './http/routes/analytics.routes';
import { globalErrorHandler } from './http/middlewares/errorHandler';
import { requestLogger } from './http/middlewares/requestLogger';

export const app = express();

// Seguridad HTTP
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(','),
  credentials: true,
}));

// Mitigación de ataques de fuerza bruta (RNF 3.3.2)
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' },
}));

// Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de requests HTTP (winston)
app.use(requestLogger);

// Enrutador API REST
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejo centralizado de excepciones
app.use(globalErrorHandler);
