"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const bcrypt_service_1 = require("../../../../infrastructure/security/bcrypt.service");
const jwt_service_1 = require("../../../../infrastructure/security/jwt.service");
const token_service_1 = require("../../../../infrastructure/security/token.service");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const env_1 = require("../../../../config/env");
const User_1 = require("../../../identity/domain/entities/User");
class AuthService {
    constructor(userRepository, roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }
    async login(identifier, password, meta) {
        const user = await this.userRepository.findByIdentifier(identifier);
        if (!user || user.status !== "active") {
            throw new DomainError_1.UnauthorizedError("Invalid Login ID or password.");
        }
        const passwordMatches = await bcrypt_service_1.BcryptService.compare(password, user.passwordHash);
        if (!passwordMatches) {
            throw new DomainError_1.UnauthorizedError("Invalid Login ID or password.");
        }
        const roles = await this.roleRepository.getRolesForUser(user.id);
        const roleNames = roles.map((r) => r.name);
        const accessToken = jwt_service_1.JwtService.signAccessToken({ sub: user.id, email: user.email, roles: roleNames });
        const refreshToken = token_service_1.RefreshTokenService.generate();
        const refreshTokenHash = token_service_1.RefreshTokenService.hash(refreshToken);
        const expiresAt = new Date(Date.now() + env_1.env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000);
        await connection_1.pool.query(`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`, [(0, uuid_1.v4)(), user.id, refreshTokenHash, expiresAt, meta.ip ?? null, meta.userAgent ?? null]);
        await this.userRepository.touchLastLogin(user.id);
        return { accessToken, refreshToken, user: (0, User_1.toPublicUser)(user, roleNames) };
    }
    async refresh(refreshToken) {
        const tokenHash = token_service_1.RefreshTokenService.hash(refreshToken);
        const [rows] = await connection_1.pool.query("SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()", [tokenHash]);
        const tokenRow = rows[0];
        if (!tokenRow) {
            throw new DomainError_1.UnauthorizedError("Invalid or expired refresh token.");
        }
        const user = await this.userRepository.findById(tokenRow.user_id);
        if (!user || user.status !== "active") {
            throw new DomainError_1.UnauthorizedError("Invalid or expired refresh token.");
        }
        const roles = await this.roleRepository.getRolesForUser(user.id);
        const accessToken = jwt_service_1.JwtService.signAccessToken({
            sub: user.id,
            email: user.email,
            roles: roles.map((r) => r.name),
        });
        return { accessToken };
    }
    async me(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new DomainError_1.UnauthorizedError("User not found.");
        const roles = await this.roleRepository.getRolesForUser(userId);
        const roleNames = roles.map((r) => r.name);
        return (0, User_1.toPublicUser)(user, roleNames);
    }
    async logout(refreshToken) {
        const tokenHash = token_service_1.RefreshTokenService.hash(refreshToken);
        await connection_1.pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map