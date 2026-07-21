"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const HelpTicketController_1 = require("../controllers/HelpTicketController");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
const ctrl = new HelpTicketController_1.HelpTicketController();
router.get("/help-tickets", (0, asyncHandler_1.asyncHandler)(ctrl.listAll.bind(ctrl)));
router.post("/help-tickets", (0, asyncHandler_1.asyncHandler)(ctrl.create.bind(ctrl)));
router.get("/help-tickets/assigned-to-me", (0, asyncHandler_1.asyncHandler)(ctrl.listAssignedToMe.bind(ctrl)));
router.get("/help-tickets/assigned-by-me", (0, asyncHandler_1.asyncHandler)(ctrl.listAssignedByMe.bind(ctrl)));
router.get("/help-tickets/:id", (0, asyncHandler_1.asyncHandler)(ctrl.getById.bind(ctrl)));
router.patch("/help-tickets/:id/status", (0, asyncHandler_1.asyncHandler)(ctrl.updateStatus.bind(ctrl)));
exports.default = router;
//# sourceMappingURL=helpTicket.routes.js.map