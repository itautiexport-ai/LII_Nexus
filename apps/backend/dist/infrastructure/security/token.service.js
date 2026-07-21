"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenService = void 0;
const crypto_1 = __importDefault(require("crypto"));
/* Refresh tokens are opaque random strings. We store only a SHA-256 hash of
   the token server-side, so a DB leak alone does not expose usable tokens,
   and revocation is a simple row update. */
exports.RefreshTokenService = {
    generate() {
        return crypto_1.default.randomBytes(48).toString("hex");
    },
    hash(token) {
        return crypto_1.default.createHash("sha256").update(token).digest("hex");
    },
};
//# sourceMappingURL=token.service.js.map