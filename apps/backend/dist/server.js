"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./infrastructure/logging/logger");
const connection_1 = require("./infrastructure/database/mysql/connection");
const app = (0, app_1.createApp)();
const server = app.listen(env_1.env.port, () => {
    logger_1.logger.info(`LII Performance Nexus API listening on port ${env_1.env.port} [${env_1.env.nodeEnv}]`);
});
async function shutdown(signal) {
    logger_1.logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
        await connection_1.pool.end();
        process.exit(0);
    });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
    logger_1.logger.error("Unhandled promise rejection", { reason });
});
process.on("uncaughtException", (err) => {
    logger_1.logger.error("Uncaught exception", { message: err.message, stack: err.stack });
    process.exit(1);
});
//# sourceMappingURL=server.js.map