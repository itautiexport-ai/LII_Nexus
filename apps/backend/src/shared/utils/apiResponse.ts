import { Response } from "express";

export function ok(res: Response, data: unknown, meta: unknown = null, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, meta, error: null });
}

export function created(res: Response, data: unknown) {
  return ok(res, data, null, 201);
}

export function badRequest(res: Response, message: string, details: unknown = null) {
  return res.status(400).json({
    success: false,
    data: null,
    meta: null,
    error: { code: "BAD_REQUEST", message, details },
  });
}

export function notFound(res: Response, message: string = "Resource not found.") {
  return res.status(404).json({
    success: false,
    data: null,
    meta: null,
    error: { code: "NOT_FOUND", message, details: null },
  });
}
