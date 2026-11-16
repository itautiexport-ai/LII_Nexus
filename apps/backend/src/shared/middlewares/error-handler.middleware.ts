import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { DomainError } from "../../core/domain/errors/DomainError";
import { logger } from "../../infrastructure/logging/logger";

export function errorHandlerMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if ((err as any)?.type === "entity.too.large") {
    return res.status(413).json({
      success: false, data: null, meta: null,
      error: { code: "PAYLOAD_TOO_LARGE", message: "Form is too large. Upload product images separately and save only their URLs.", details: null },
    });
  }
  if (err instanceof DomainError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { requestId: (req as any).requestId, stack: err.stack });
    }
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: err.code,
        message: err.message,
        details: (err as any).details ?? null,
      },
    });
  }

  logger.error("Unhandled error", {
    requestId: (req as any).requestId,
    message: (err as Error)?.message,
    stack: (err as Error)?.stack,
  });
  fs.appendFileSync("error_debug.log", JSON.stringify({ message: (err as Error)?.message, stack: (err as Error)?.stack }) + "\n");

  return res.status(500).json({
    success: false,
    data: null,
    meta: null,
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred.", details: null },
  });
}
