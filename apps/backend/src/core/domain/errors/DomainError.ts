export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  public readonly details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400);
    this.details = details;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Authentication required.") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Resource not found.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message = "Resource already exists.") {
    super(message, "CONFLICT", 409);
  }
}
