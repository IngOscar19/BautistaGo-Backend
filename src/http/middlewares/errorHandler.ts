import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function globalErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.flatten(),
    });
  }

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
  }

  return res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err?.message : undefined,
  });
}
