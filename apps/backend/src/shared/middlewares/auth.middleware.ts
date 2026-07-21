import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../infrastructure/security/jwt.service";
import { UnauthorizedError } from "../../core/domain/errors/DomainError";

export interface AuthenticatedRequest extends Request {
  user?: { sub: string; email: string; roles: string[] };
}

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header.");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = JwtService.verifyAccessToken(token);
    req.user = { sub: payload.sub, email: payload.email, roles: payload.roles };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired access token.");
  }
}
