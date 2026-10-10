import { Response } from "express";
import { StandaloneChecklistService } from "../../application/services/StandaloneChecklistService";
import { CreateStandaloneChecklistSchema } from "../../application/dto/checklist.dto";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { isAdminUser } from "../../../../shared/middlewares/rbac.middleware";

export class StandaloneChecklistController {
  constructor(private service: StandaloneChecklistService) {}

  createChecklist = async (req: AuthenticatedRequest, res: Response) => {
    const isAllowed = await isAdminUser(req.user!.sub);
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: "Access Denied: Only users with designation Admin, Management, or Management Executive are allowed to create checklists." });
    }

    const dto = CreateStandaloneChecklistSchema.parse(req.body);
    const assignedBy = dto.assignBy;
    
    const checklist = await this.service.createChecklist(dto, assignedBy);
    res.status(201).json({ success: true, data: checklist });
  };

  updateChecklist = async (req: AuthenticatedRequest, res: Response) => {
    const isAllowed = await isAdminUser(req.user!.sub);
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: "Access Denied: Only users with designation Admin, Management, or Management Executive are allowed to edit checklists." });
    }

    const { id } = req.params;
    await this.service.updateChecklist(id, req.body);
    res.json({ success: true, message: "Checklist updated successfully" });
  };

  getAllChecklists = async (req: AuthenticatedRequest, res: Response) => {
    const checklists = await this.service.getAllChecklists();
    res.json({ success: true, data: checklists });
  };

  deleteChecklist = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await this.service.deleteChecklist(id);
    res.json({ success: true, message: "Checklist deleted successfully" });
  };

  getMyDashboard = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.sub;
    const dashboardData = await this.service.getDashboardData(userId);
    res.json({ success: true, data: dashboardData });
  };

  completeChecklist = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { notes, attachmentUrl, occurrenceDate } = req.body;
    const userId = req.user!.sub;
    await this.service.completeChecklist(id, userId, notes, attachmentUrl, occurrenceDate);
    res.json({ success: true, message: "Checklist completed successfully" });
  };
}
