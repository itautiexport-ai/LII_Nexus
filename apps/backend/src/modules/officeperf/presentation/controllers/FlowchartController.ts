import { Response } from "express";
import { FlowchartService } from "../../application/services/FlowchartService";
import { MySqlFlowchartRepository } from "../../infrastructure/repositories/MySqlFlowchartRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { RunStatus } from "../../domain/entities/Flowchart";

const service = new FlowchartService(new MySqlFlowchartRepository(), new EmployeeScopeService());
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const FlowchartController = {
  async startRun(req: AuthenticatedRequest, res: Response) {
    const run = await service.startRun(req.body.workflowId, req.body.reference, req.body.notes, req.user!.sub);
    return created(res, run);
  },

  async listRuns(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const workflowId = req.query.workflowId as string | undefined;
    const status = req.query.status as RunStatus | undefined;
    const { items, total } = await service.listRuns(page, pageSize, workflowId, status);
    return ok(res, items, { page, pageSize, totalItems: total });
  },

  async getRunDetail(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getRunDetail(req.params.id));
  },

  async listMyTasks(req: AuthenticatedRequest, res: Response) {
    const { from, to } = req.query as { from?: string; to?: string };
    return ok(res, await service.listMyTasks(req.user!.sub, from, to));
  },

  async assignTask(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "flowchart.task.assign");
    return ok(res, await service.assignTask(req.params.taskId, req.body.employeeId, req.user!.sub, override));
  },

  async updateTaskStatus(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "flowchart.task.update");
    return ok(res, await service.updateTaskStatus(req.params.taskId, req.body.status, req.body.remarks, req.user!.sub, override));
  },
};
