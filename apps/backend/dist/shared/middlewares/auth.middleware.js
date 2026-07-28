"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_service_1 = require("../../infrastructure/security/jwt.service");
const DomainError_1 = require("../../core/domain/errors/DomainError");
const connection_1 = require("../../infrastructure/database/mysql/connection");
async function authMiddleware(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return next(new DomainError_1.UnauthorizedError("Missing or malformed Authorization header."));
    }
    const token = header.slice("Bearer ".length);
    try {
        const payload = jwt_service_1.JwtService.verifyAccessToken(token);
        // Fetch fresh roles from DB for strict permission enforcement
        const [rows] = await connection_1.pool.query(`
      SELECT r.name 
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [payload.sub]);
        const freshRoles = rows.map((r) => r.name);
        req.user = {
            sub: payload.sub,
            id: payload.sub, // Added id for AuthController compatibility
            email: payload.email,
            roles: freshRoles
        };
        next();
    }
    catch (err) {
        return next(new DomainError_1.UnauthorizedError("Invalid or expired access token."));
    }
}
//# sourceMappingURL=auth.middleware.js.map