import { Request, Response } from "express";
import { StandaloneChecklistService } from "../../application/services/StandaloneChecklistService";
import { CreateStandaloneChecklistSchema, BulkDeleteStandaloneChecklistSchema } from "../../application/dto/checklist.dto";

export class StandaloneChecklistController {
  constructor(private service: StandaloneChecklistService) {}

  createChecklist = async (req: Request, res: Response) => {
    const dto = CreateStandaloneChecklistSchema.parse(req.body);
    const assignedBy = dto.assignBy;
    
    const checklist = await this.service.createChecklist(dto, assignedBy);
    res.status(201).json({ success: true, data: checklist });
  };

  getAllChecklists = async (req: Request, res: Response) => {
    const checklists = await this.service.getAllChecklists();
    res.json({ success: true, data: checklists });
  };

  deleteChecklist = async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.service.deleteChecklist(id);
    res.json({ success: true, message: "Checklist deleted successfully" });
  };

  completeChecklist = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id; // Assumes authMiddleware sets req.user
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await this.service.completeChecklist(id, userId);
    res.json({ success: true, message: "Checklist completed successfully and rescheduled" });
  };

  bulkDeleteChecklists = async (req: Request, res: Response) => {
    const { ids } = BulkDeleteStandaloneChecklistSchema.parse(req.body);
    await this.service.bulkDeleteChecklists(ids);
    res.json({ success: true, message: "Checklists deleted successfully" });
  };

  getBulkTemplate = async (req: Request, res: Response) => {
    const buffer = await this.service.getBulkTemplate();
    res.setHeader("Content-Disposition", "attachment; filename=Checklist_Bulk_Upload_Template.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  };

  bulkUploadChecklists = async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    const result = await this.service.bulkUploadChecklists(req.file.buffer, (req as any).user.sub);
    res.json({ success: true, data: result });
  };
}
