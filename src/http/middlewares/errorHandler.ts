import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger';

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    logger.warn('Error de validación Zod', { details: err.flatten() });
    res.status(400).json({
      error: 'Error de validación',
      message: 'Error de validación',
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn(`AppError [${err.statusCode}]: ${err.message}`, {
      statusCode: err.statusCode,
      code: err.code,
    });
    res.status(err.statusCode).json({
      error: err.message,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  logger.error('Error no controlado', { error: err });

  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Error interno del servidor',
    message: isProd
      ? 'Ocurrió un error inesperado en el servidor'
      : (err instanceof Error ? err.message : 'Error interno del servidor'),
  });
}
