"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function get(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
exports.env = {
    nodeEnv: get("NODE_ENV", "development"),
    port: parseInt(get("PORT", "4000"), 10),
    apiVersion: get("API_VERSION", "v1"),
    db: {
        host: get("DB_HOST", "localhost"),
        port: parseInt(get("DB_PORT", "3306"), 10),
        name: get("DB_NAME", "lii_nexus"),
        user: get("DB_USER", "root"),
        password: get("DB_PASSWORD", ""),
        poolMax: parseInt(get("DB_POOL_MAX", "20"), 10),
    },
    jwt: {
        accessSecret: get("JWT_ACCESS_SECRET", "dev_access_secret"),
        refreshSecret: get("JWT_REFRESH_SECRET", "dev_refresh_secret"),
        accessExpiresIn: get("JWT_ACCESS_EXPIRES_IN", "15m"),
        refreshExpiresInDays: parseInt(get("JWT_REFRESH_EXPIRES_IN_DAYS", "7"), 10),
    },
    bcryptSaltRounds: parseInt(get("BCRYPT_SALT_ROUNDS", "12"), 10),
    cookieDomain: get("COOKIE_DOMAIN", "localhost"),
    corsAllowedOrigins: get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(","),
};
//# sourceMappingURL=env.js.map