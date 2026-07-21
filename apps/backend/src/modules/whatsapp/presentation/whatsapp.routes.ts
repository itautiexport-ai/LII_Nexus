import { Router } from "express";
import { WhatsAppController } from "./controllers/WhatsAppController";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/whatsapp/status", asyncHandler(WhatsAppController.getStatus));
router.post("/whatsapp/logout", asyncHandler(WhatsAppController.logout));

export default router;
