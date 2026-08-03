import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../infrastructure/security/jwt.service";
import { UnauthorizedError } from "../../core/domain/errors/DomainError";
import { pool } from "../../infrastructure/database/mysql/connection";

export interface AuthenticatedRequest extends Request {
  user?: { sub: string; email: string; roles: string[]; id?: string };
}

export async function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or malformed Authorization header."));
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = JwtService.verifyAccessToken(token);
    
    // Fetch fresh roles from DB for strict permission enforcement
    const [rows] = await pool.query<any[]>(`
      SELECT r.name 
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [payload.sub]);
    
    const freshRoles = rows.map((r: any) => r.name);
    
    req.user = { 
      sub: payload.sub, 
      id: payload.sub, // Added id for AuthController compatibility
      email: payload.email, 
      roles: freshRoles 
    };
    next();
  } catch (err) {
    return next(new UnauthorizedError("Invalid or expired access token."));
  }
}
