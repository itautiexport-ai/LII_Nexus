import express from "express";
import "express-async-errors";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import path from "path";
import v1Router from "./api/v1/router";
import { requestLoggerMiddleware } from "./shared/middlewares/request-logger.middleware";
import { errorHandlerMiddleware } from "./shared/middlewares/error-handler.middleware";
import { whatsappBot } from "./modules/whatsapp/application/services/WhatsAppBotService";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.nodeEnv === "development") return callback(null, true);
        if (env.corsAllowedOrigins.includes(origin) || origin.includes("localhost") || origin.includes("127.0.0.1")) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLoggerMiddleware);

  app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

  app.use(`/api/${env.apiVersion}`, v1Router);
  
  // Serve uploads statically
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.use(errorHandlerMiddleware);

  whatsappBot.initialize();

  return app;
}
