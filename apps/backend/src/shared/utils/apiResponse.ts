import { Response } from "express";

export function ok(res: Response, data: unknown, meta: unknown = null, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, meta, error: null });
}

export function created(res: Response, data: unknown) {
  return ok(res, data, null, 201);
}
