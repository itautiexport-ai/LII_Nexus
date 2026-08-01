import { Router, Request, Response } from "express";
import { FormatController } from "../controllers/FormatController";
import { authMiddleware, AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const router = Router();
const controller = new FormatController();

// Anyone with access to the module can list
router.get("/", authMiddleware, controller.listFormats);

// Only System Admin can create new formats
router.post("/", authMiddleware, (req: Request, res: Response) => {
  const userRoles = (req as AuthenticatedRequest).user?.roles || [];
  if (!userRoles.includes("System Admin")) {
    return res.status(403).json({ success: false, error: { message: "Forbidden" } });
  }
  controller.createFormat(req, res);
});

export default router;
