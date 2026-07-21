"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const path_1 = __importDefault(require("path"));
const router_1 = __importDefault(require("./api/v1/router"));
const request_logger_middleware_1 = require("./shared/middlewares/request-logger.middleware");
const error_handler_middleware_1 = require("./shared/middlewares/error-handler.middleware");
const WhatsAppBotService_1 = require("./modules/whatsapp/application/services/WhatsAppBotService");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: env_1.env.corsAllowedOrigins, credentials: true }));
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use(request_logger_middleware_1.requestLoggerMiddleware);
    app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
    app.use(`/api/${env_1.env.apiVersion}`, router_1.default);
    // Serve uploads statically
    app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
    app.use(error_handler_middleware_1.errorHandlerMiddleware);
    WhatsAppBotService_1.whatsappBot.initialize();
    return app;
}
//# sourceMappingURL=app.js.map