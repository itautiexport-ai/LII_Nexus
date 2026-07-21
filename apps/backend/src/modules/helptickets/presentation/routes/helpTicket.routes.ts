import { Router } from "express";
import { HelpTicketController } from "../controllers/HelpTicketController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

const ctrl = new HelpTicketController();

router.get("/help-tickets", asyncHandler(ctrl.listAll.bind(ctrl)));
router.post("/help-tickets", asyncHandler(ctrl.create.bind(ctrl)));
router.get("/help-tickets/assigned-to-me", asyncHandler(ctrl.listAssignedToMe.bind(ctrl)));
router.get("/help-tickets/assigned-by-me", asyncHandler(ctrl.listAssignedByMe.bind(ctrl)));
router.get("/help-tickets/:id", asyncHandler(ctrl.getById.bind(ctrl)));
router.patch("/help-tickets/:id/status", asyncHandler(ctrl.updateStatus.bind(ctrl)));

export default router;
