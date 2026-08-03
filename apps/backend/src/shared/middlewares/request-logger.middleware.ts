import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import { logger } from "../../infrastructure/logging/logger";

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuid();
  (req as any).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = Date.now();
  res.on("finish", () => {
    logger.info("HTTP request", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      userId: (req as any).user?.sub ?? null,
    });
  });
  next();
}
