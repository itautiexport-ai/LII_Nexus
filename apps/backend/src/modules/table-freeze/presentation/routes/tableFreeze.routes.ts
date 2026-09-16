import { Router } from "express";
import { TableFreezeController } from "../controllers/TableFreezeController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:tableKey", TableFreezeController.get);
router.get("/", TableFreezeController.getAll);
router.post("/:tableKey", TableFreezeController.save);
router.delete("/:tableKey", TableFreezeController.reset);

export default router;
