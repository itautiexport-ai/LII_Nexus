"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_service_1 = require("../../infrastructure/security/jwt.service");
const DomainError_1 = require("../../core/domain/errors/DomainError");
function authMiddleware(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw new DomainError_1.UnauthorizedError("Missing or malformed Authorization header.");
    }
    const token = header.slice("Bearer ".length);
    try {
        const payload = jwt_service_1.JwtService.verifyAccessToken(token);
        req.user = { sub: payload.sub, email: payload.email, roles: payload.roles };
        next();
    }
    catch {
        throw new DomainError_1.UnauthorizedError("Invalid or expired access token.");
    }
}
//# sourceMappingURL=auth.middleware.js.map