"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BcryptService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../../config/env");
exports.BcryptService = {
    hash(plain) {
        return bcryptjs_1.default.hash(plain, env_1.env.bcryptSaltRounds);
    },
    compare(plain, hash) {
        return bcryptjs_1.default.compare(plain, hash);
    },
};
//# sourceMappingURL=bcrypt.service.js.map