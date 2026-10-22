import { Router } from "express";
import { CatalogueShareController } from "../controllers/CatalogueShareController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
const controller = new CatalogueShareController();

// Public routes for buyers to view shared presentations
router.get("/shared-decks/:token", asyncHandler(controller.getSharedDeckByToken));
router.post("/shared-decks/:token/view", asyncHandler(controller.recordDeckView));

// Authenticated routes for internal users to create and manage shared decks
router.post("/share-deck", authMiddleware, asyncHandler(controller.createSharedDeck));
router.get("/my-shared-decks", authMiddleware, asyncHandler(controller.getMySharedDecks));

export default router;
