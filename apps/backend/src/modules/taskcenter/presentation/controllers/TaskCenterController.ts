import { Request, Response } from "express";
import { TaskCenterService } from "../../application/services/TaskCenterService";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

export class TaskCenterController {
  constructor(private service: TaskCenterService) {}

  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const isSystemAdmin = req.user?.roles?.includes("System Admin") || false;
      const stats = await this.service.getDashboardStats(req.user!.sub, isSystemAdmin);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Failed to fetch task center stats" });
    }
  };
}
