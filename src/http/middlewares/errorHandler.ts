import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger';

<<<<<<< HEAD
export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
=======
export function globalErrorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error Handler]', err);

>>>>>>> feature/BE-01-project-scaffold
  if (err instanceof ZodError) {
    logger.warn('Error de validación Zod', { details: err.flatten() });
    res.status(400).json({
      error: 'Error de validación',
      message: 'Error de validación',
      details: err.flatten(),
    });
    return;
  }

<<<<<<< HEAD
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
=======
  // Errores de regla de negocio / dominio
  if (err instanceof Error) {
    const isDomainError =
      err.message.includes('no encontrado') ||
      err.message.includes('No se puede') ||
      err.message.includes('Pedido ya') ||
      err.message.includes('La fecha de inicio') ||
      err.message.includes('registrado') ||
      err.message.includes('inválido');

    if (isDomainError) {
      return res.status(400).json({
        error: err.message,
      });
    }
>>>>>>> feature/BE-01-project-scaffold
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
