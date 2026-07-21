"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = requestLoggerMiddleware;
const uuid_1 = require("uuid");
const logger_1 = require("../../infrastructure/logging/logger");
function requestLoggerMiddleware(req, res, next) {
    const requestId = (0, uuid_1.v4)();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    const start = Date.now();
    res.on("finish", () => {
        logger_1.logger.info("HTTP request", {
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            userId: req.user?.sub ?? null,
        });
    });
    next();
}
//# sourceMappingURL=request-logger.middleware.js.map