"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = errorHandlerMiddleware;
const DomainError_1 = require("../../core/domain/errors/DomainError");
const logger_1 = require("../../infrastructure/logging/logger");
function errorHandlerMiddleware(err, req, res, _next) {
    if (err instanceof DomainError_1.DomainError) {
        if (err.statusCode >= 500) {
            logger_1.logger.error(err.message, { requestId: req.requestId, stack: err.stack });
        }
        return res.status(err.statusCode).json({
            success: false,
            data: null,
            meta: null,
            error: {
                code: err.code,
                message: err.message,
                details: err.details ?? null,
            },
        });
    }
    logger_1.logger.error("Unhandled error", {
        requestId: req.requestId,
        message: err?.message,
        stack: err?.stack,
    });
    require("fs").appendFileSync("error_debug.log", JSON.stringify({ message: err?.message, stack: err?.stack }) + "\\n");
    return res.status(500).json({
        success: false,
        data: null,
        meta: null,
        error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred.", details: null },
    });
}
//# sourceMappingURL=error-handler.middleware.js.map