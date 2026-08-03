import { Router } from "express";
import { ComplaintController } from "../controllers/ComplaintController";
import { ComplaintService } from "../../application/services/ComplaintService";
import { MySqlComplaintRepository } from "../../infrastructure/repositories/MySqlComplaintRepository";

const router = Router();
const repo = new MySqlComplaintRepository();
const service = new ComplaintService(repo);
const controller = new ComplaintController(service);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
