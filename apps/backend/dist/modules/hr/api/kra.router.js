"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kraRouter = void 0;
const express_1 = require("express");
const KraController_1 = require("../application/controllers/KraController");
const auth_middleware_1 = require("../../../shared/middlewares/auth.middleware");
exports.kraRouter = (0, express_1.Router)();
exports.kraRouter.use(auth_middleware_1.authMiddleware);
exports.kraRouter.get("/", KraController_1.KraController.list);
exports.kraRouter.post("/", KraController_1.KraController.create);
exports.kraRouter.delete("/:id", KraController_1.KraController.remove);
//# sourceMappingURL=kra.router.js.map