import { Router } from "express";
import { MySqlFactoryDocumentRepository } from "../../infrastructure/repositories/MySqlFactoryDocumentRepository";
import { FactoryDocumentService } from "../../application/services/FactoryDocumentService";
import { FactoryDocumentController } from "../controllers/FactoryDocumentController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
const repo = new MySqlFactoryDocumentRepository();
const service = new FactoryDocumentService(repo);
const controller = new FactoryDocumentController(service);

router.use(authMiddleware as any);

router.get("/factory-documents", asyncHandler(controller.list.bind(controller)));
router.get("/factory-documents/:id", asyncHandler(controller.getById.bind(controller)));
router.post("/factory-documents", asyncHandler(controller.create.bind(controller)));
router.patch("/factory-documents/:id", asyncHandler(controller.update.bind(controller)));
router.put("/factory-documents/:id", asyncHandler(controller.update.bind(controller)));
router.delete("/factory-documents/:id", asyncHandler(controller.delete.bind(controller)));

export default router;

