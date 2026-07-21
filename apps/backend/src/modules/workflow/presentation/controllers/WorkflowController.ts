import { Response } from "express";
import { WorkflowService } from "../../application/services/WorkflowService";
import { MySqlWorkflowRepository } from "../../infrastructure/repositories/MySqlWorkflowRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { WorkflowStatus } from "../../domain/entities/Workflow";

const service = new WorkflowService(new MySqlWorkflowRepository());

export const WorkflowController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const search = req.query.search as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const status = req.query.status as WorkflowStatus | undefined;
    const { items, total } = await service.list(page, pageSize, search, departmentId, status);
    return ok(res, items, { page, pageSize, totalItems: total });
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getById(req.params.id));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    return created(res, await service.create(req.body, req.user!.sub));
  },

  async updateMeta(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.updateMeta(req.params.id, req.body, req.user!.sub));
  },

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.updateStatus(req.params.id, req.body.status, req.user!.sub));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "Workflow deleted." });
  },

  async addStage(req: AuthenticatedRequest, res: Response) {
    return created(res, await service.addStage(req.params.id, req.body, req.user!.sub));
  },

  async updateStage(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.updateStage(req.params.id, req.params.stageId, req.body, req.user!.sub));
  },

  async removeStage(req: AuthenticatedRequest, res: Response) {
    await service.removeStage(req.params.id, req.params.stageId, req.user!.sub);
    return ok(res, { message: "Stage removed." });
  },

  async reorderStages(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.reorderStages(req.params.id, req.body.stageIds, req.user!.sub));
  },
};
