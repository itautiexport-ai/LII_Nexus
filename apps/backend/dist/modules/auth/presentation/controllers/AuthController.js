"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = exports.loginSchema = void 0;
const zod_1 = require("zod");
const AuthService_1 = require("../../application/services/AuthService");
const MySqlUserRepository_1 = require("../../../identity/infrastructure/repositories/MySqlUserRepository");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const env_1 = require("../../../../config/env");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const authService = new AuthService_1.AuthService(new MySqlUserRepository_1.MySqlUserRepository(), new MySqlRoleRepository_1.MySqlRoleRepository());
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().min(1),
    password: zod_1.z.string().min(1),
});
const REFRESH_COOKIE = "lii_refresh_token";
function setRefreshCookie(res, token) {
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: env_1.env.nodeEnv === "production",
        sameSite: "strict",
        domain: env_1.env.nodeEnv === "production" ? env_1.env.cookieDomain : undefined,
        maxAge: env_1.env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
        path: "/api/v1/auth",
    });
}
exports.AuthController = {
    async login(req, res) {
        const { email, password } = req.body;
        const result = await authService.login(email, password, {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        });
        setRefreshCookie(res, result.refreshToken);
        return (0, apiResponse_1.ok)(res, { accessToken: result.accessToken, user: result.user });
    },
    async refresh(req, res) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        if (!refreshToken)
            throw new DomainError_1.UnauthorizedError("No refresh token provided.");
        const result = await authService.refresh(refreshToken);
        return (0, apiResponse_1.ok)(res, result);
    },
    async me(req, res) {
        const userId = req.user?.id;
        if (!userId)
            throw new DomainError_1.UnauthorizedError("Not authenticated.");
        const user = await authService.me(userId);
        return (0, apiResponse_1.ok)(res, { user });
    },
    async logout(req, res) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        if (refreshToken) {
            await authService.logout(refreshToken);
        }
        res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
        return (0, apiResponse_1.ok)(res, { message: "Logged out." });
    },
};
//# sourceMappingURL=AuthController.js.map