import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { globalErrorHandler } from '../errorHandler';
import { requestLogger } from '../requestLogger';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger';

describe('GlobalErrorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {};
    mockResponse = {
      status: statusMock,
    };
    mockNext = jest.fn();
  });

  it('AppError 400 → responde con statusCode y message', () => {
    const error = new AppError('Solicitud inválida', 400, 'BAD_REQUEST');

    globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Solicitud inválida',
      message: 'Solicitud inválida',
      code: 'BAD_REQUEST',
    });
  });

  it('NotFoundError → responde 404 con mensaje y código NOT_FOUND', () => {
    const error = new NotFoundError('Pedido');

    globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Pedido no encontrado',
      message: 'Pedido no encontrado',
      code: 'NOT_FOUND',
    });
  });

  it('UnauthorizedError, ForbiddenError, ConflictError y BadRequestError asignan status codes correctos', () => {
    const errors = [
      { err: new UnauthorizedError(), expectedStatus: 401, code: 'UNAUTHORIZED' },
      { err: new ForbiddenError(), expectedStatus: 403, code: 'FORBIDDEN' },
      { err: new ConflictError('Ya existe'), expectedStatus: 409, code: 'CONFLICT' },
      { err: new BadRequestError('Dato incorrecto'), expectedStatus: 400, code: 'BAD_REQUEST' },
    ];

    for (const { err, expectedStatus, code } of errors) {
      statusMock.mockClear();
      jsonMock.mockClear();

      globalErrorHandler(err, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: err.message,
          message: err.message,
          code,
        })
      );
    }
  });

  it('ZodError → responde 400 con detalles de validación', () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const result = schema.safeParse({ name: 'a' });
    expect(result.success).toBe(false);

    if (!result.success) {
      globalErrorHandler(result.error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de validación',
          message: 'Error de validación',
          details: expect.any(Object),
        })
      );
    }
  });

  it('Error genérico → responde 500 con mensaje genérico en producción', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const error = new Error('Fallo crítico interno en base de datos');

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        message: 'Ocurrió un error inesperado en el servidor',
      });
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('Error genérico → responde 500 con detalle en desarrollo', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const error = new Error('Error detallado para depuración');

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        message: 'Error detallado para depuración',
      });
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

describe('RequestLogger', () => {
  it('registra método, path, ip y userAgent e invoca next()', () => {
    const loggerSpy = jest.spyOn(logger, 'info').mockImplementation();
    const req = {
      method: 'POST',
      path: '/api/orders',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'JestTestRunner/1.0',
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    requestLogger(req, res, next);

    expect(loggerSpy).toHaveBeenCalledWith('POST /api/orders', {
      ip: '127.0.0.1',
      userAgent: 'JestTestRunner/1.0',
    });
    expect(next).toHaveBeenCalledTimes(1);

    loggerSpy.mockRestore();
  });
});
