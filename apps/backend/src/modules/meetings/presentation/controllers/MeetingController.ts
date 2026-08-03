import { Response } from "express";
import { MeetingService } from "../../application/services/MeetingService";
import { MeetingActionService } from "../../application/services/MeetingActionService";
import { MOMGeneratorService } from "../../application/services/MOMGeneratorService";
import { MOMExportService } from "../../application/services/MOMExportService";
import { MeetingDashboardService } from "../../application/services/MeetingDashboardService";
import { MySqlMeetingRepository } from "../../infrastructure/repositories/MySqlMeetingRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { MeetingStatus, MeetingType } from "../../domain/entities/Meeting";

const repo = new MySqlMeetingRepository();
const scope = new EmployeeScopeService();
const meetingService = new MeetingService(repo, scope);
const actionService = new MeetingActionService(repo);
const momGenerator = new MOMGeneratorService(repo);
const momExporter = new MOMExportService();
const dashboardService = new MeetingDashboardService(repo);
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const MeetingController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const { items, total } = await meetingService.list({
      page, pageSize,
      search: req.query.search as string | undefined,
      meetingType: req.query.meetingType as MeetingType | undefined,
      status: req.query.status as MeetingStatus | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    });
    return ok(res, items, { page, pageSize, totalItems: total });
  },
  async getById(req: AuthenticatedRequest, res: Response) {
    return ok(res, await meetingService.getDetail(req.params.id));
  },
  async create(req: AuthenticatedRequest, res: Response) {
    return created(res, await meetingService.create(req.body, req.user!.sub));
  },
  async update(req: AuthenticatedRequest, res: Response) {
    return ok(res, await meetingService.update(req.params.id, req.body, req.user!.sub));
  },
  async remove(req: AuthenticatedRequest, res: Response) {
    await meetingService.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "Meeting deleted." });
  },

  async setReviewSection(req: AuthenticatedRequest, res: Response) {
    const { reviewType, notes } = req.body;
    return ok(res, await meetingService.setReviewSection(req.params.id, reviewType, notes ?? null, req.user!.sub));
  },
  async addDecision(req: AuthenticatedRequest, res: Response) {
    return created(res, await meetingService.addDecision(req.params.id, req.body.decisionText, req.user!.sub));
  },
  async addAttachment(req: AuthenticatedRequest, res: Response) {
    return created(res, await meetingService.addAttachment(req.params.id, req.body.fileName, req.body.fileUrl, req.user!.sub));
  },

  async createAction(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "meeting.action.assign_any");
    const { description, assignedTo, targetDate, priority } = req.body;
    return created(res, await actionService.createAction(req.params.id, description, assignedTo, targetDate, priority, req.user!.sub, override));
  },
  async listPendingActions(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await actionService.listPending());
  },
  async listCompletedActions(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await actionService.listCompleted());
  },

  async getMom(req: AuthenticatedRequest, res: Response) {
    return ok(res, await momGenerator.generate(req.params.id));
  },
  async exportMomPdf(req: AuthenticatedRequest, res: Response) {
    const mom = await momGenerator.generate(req.params.id);
    const buffer = await momExporter.toPdfBuffer(mom);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=mom-${req.params.id}.pdf`);
    return res.send(buffer);
  },

  async dashboard(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await dashboardService.getOverview());
  },
};
