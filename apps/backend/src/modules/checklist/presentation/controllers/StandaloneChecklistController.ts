import { Response } from "express";
import { StandaloneChecklistService } from "../../application/services/StandaloneChecklistService";
import { CreateStandaloneChecklistSchema } from "../../application/dto/checklist.dto";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { MySqlEmployeeRepository } from "../../../organization/infrastructure/repositories/MySqlEmployeeRepository";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";

export class StandaloneChecklistController {
  constructor(private service: StandaloneChecklistService) {}

  createChecklist = async (req: AuthenticatedRequest, res: Response) => {
    const roleRepo = new MySqlRoleRepository();
    const userRoles = await roleRepo.getRolesForUser(req.user!.sub);
    const isSystemAdmin = userRoles.some(r => r.name === "System Admin");

    if (!isSystemAdmin) {
      const repo = new MySqlEmployeeRepository();
      const employee = await repo.findByUserId(req.user!.sub);
      if (!employee) {
        return res.status(403).json({ success: false, message: "Only employees can create checklists." });
      }
      const title = employee.designationTitle?.trim().toLowerCase() || "";
      const isAllowed = title === "admin" || title === "admin executive" || title === "director" || title === "executive director";
      if (!isAllowed) {
        return res.status(403).json({ success: false, message: "Access Denied: Only employees with designation Admin, Admin Executive, or Director are allowed to add checklists." });
      }
    }

    const dto = CreateStandaloneChecklistSchema.parse(req.body);
    const assignedBy = dto.assignBy;
    
    const checklist = await this.service.createChecklist(dto, assignedBy);
    res.status(201).json({ success: true, data: checklist });
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
    const { notes, attachmentUrl } = req.body;
    const userId = req.user!.sub;
    await this.service.completeChecklist(id, userId, notes, attachmentUrl);
    res.json({ success: true, message: "Checklist completed successfully" });
  };
}
