"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.DomainError = void 0;
class DomainError extends Error {
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.DomainError = DomainError;
class ValidationError extends DomainError {
    constructor(message, details) {
        super(message, "VALIDATION_ERROR", 400);
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends DomainError {
    constructor(message = "Authentication required.") {
        super(message, "UNAUTHORIZED", 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends DomainError {
    constructor(message = "You do not have permission to perform this action.") {
        super(message, "FORBIDDEN", 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends DomainError {
    constructor(message = "Resource not found.") {
        super(message, "NOT_FOUND", 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends DomainError {
    constructor(message = "Resource already exists.") {
        super(message, "CONFLICT", 409);
    }
}
exports.ConflictError = ConflictError;
//# sourceMappingURL=DomainError.js.map