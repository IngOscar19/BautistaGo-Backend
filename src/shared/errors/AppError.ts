export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = 'No autenticado') {
    super(msg, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(msg = 'Permisos insuficientes') {
    super(msg, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(msg: string) {
    super(msg, 409, 'CONFLICT');
  }
}

export class BadRequestError extends AppError {
  constructor(msg: string, code = 'BAD_REQUEST') {
    super(msg, 400, code);
  }
}
