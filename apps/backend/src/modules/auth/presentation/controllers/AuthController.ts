import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../../application/services/AuthService";
import { MySqlUserRepository } from "../../../identity/infrastructure/repositories/MySqlUserRepository";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok } from "../../../../shared/utils/apiResponse";
import { env } from "../../../../config/env";
import { UnauthorizedError } from "../../../../core/domain/errors/DomainError";

const authService = new AuthService(new MySqlUserRepository(), new MySqlRoleRepository());

export const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

const REFRESH_COOKIE = "lii_refresh_token";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    domain: env.nodeEnv === "production" ? env.cookieDomain : undefined,
    maxAge: env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
}

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    setRefreshCookie(res, result.refreshToken);
    return ok(res, { accessToken: result.accessToken, user: result.user });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedError("No refresh token provided.");
    const result = await authService.refresh(refreshToken);
    return ok(res, result);
  },

  async me(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) throw new UnauthorizedError("Not authenticated.");
    const user = await authService.me(userId);
    return ok(res, { user });
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
    return ok(res, { message: "Logged out." });
  },
};
