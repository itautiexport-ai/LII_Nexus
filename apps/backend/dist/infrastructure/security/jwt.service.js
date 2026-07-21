"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
exports.JwtService = {
    signAccessToken(payload) {
        const options = { expiresIn: env_1.env.jwt.accessExpiresIn };
        return jsonwebtoken_1.default.sign(payload, env_1.env.jwt.accessSecret, options);
    },
    verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
    },
};
//# sourceMappingURL=jwt.service.js.map