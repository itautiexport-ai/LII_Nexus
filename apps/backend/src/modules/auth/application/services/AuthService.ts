import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { IUserRepository } from "../../../identity/domain/repositories/IUserRepository";
import { IRoleRepository } from "../../../rbac/domain/repositories/IRoleRepository";
import { BcryptService } from "../../../../infrastructure/security/bcrypt.service";
import { JwtService } from "../../../../infrastructure/security/jwt.service";
import { RefreshTokenService } from "../../../../infrastructure/security/token.service";
import { UnauthorizedError } from "../../../../core/domain/errors/DomainError";
import { env } from "../../../../config/env";
import { toPublicUser } from "../../../identity/domain/entities/User";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: ReturnType<typeof toPublicUser>;
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository, private readonly roleRepository: IRoleRepository) {}

  async login(identifier: string, password: string, meta: { ip?: string; userAgent?: string }): Promise<LoginResult> {
    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user || user.status !== "active") {
      throw new UnauthorizedError("Invalid Login ID or password.");
    }

    const passwordMatches = await BcryptService.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid Login ID or password.");
    }

    const roles = await this.roleRepository.getRolesForUser(user.id);
    const roleNames = roles.map((r) => r.name);

    const accessToken = JwtService.signAccessToken({ sub: user.id, email: user.email, roles: roleNames });

    const refreshToken = RefreshTokenService.generate();
    const refreshTokenHash = RefreshTokenService.hash(refreshToken);
    const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), user.id, refreshTokenHash, expiresAt, meta.ip ?? null, meta.userAgent ?? null]
    );

    await this.userRepository.touchLastLogin(user.id);

    return { accessToken, refreshToken, user: toPublicUser(user, roleNames) };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const tokenHash = RefreshTokenService.hash(refreshToken);
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()",
      [tokenHash]
    );
    const tokenRow = rows[0];
    if (!tokenRow) {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }

    const user = await this.userRepository.findById(tokenRow.user_id);
    if (!user || user.status !== "active") {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }

    const roles = await this.roleRepository.getRolesForUser(user.id);
    const accessToken = JwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      roles: roles.map((r) => r.name),
    });

    return { accessToken };
  }

  async me(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError("User not found.");
    const roles = await this.roleRepository.getRolesForUser(userId);
    const roleNames = roles.map((r) => r.name);
    return toPublicUser(user, roleNames);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = RefreshTokenService.hash(refreshToken);
    await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
  }
}
