import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./infrastructure/logging/logger";
import { pool } from "./infrastructure/database/mysql/connection";
import { ChecklistReminderJob } from "./modules/checklist/application/services/ChecklistReminderJob";

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`LII Performance Nexus API listening on port ${env.port} [${env.nodeEnv}]`);
  
  // Initialize Cron Jobs
  ChecklistReminderJob.getInstance().init();
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { message: err.message, stack: err.stack });
  process.exit(1);
});
