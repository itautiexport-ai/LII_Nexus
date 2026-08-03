import { Response } from "express";
import { GoalService } from "../../application/services/GoalService";
import { MySqlGoalRepository } from "../../infrastructure/repositories/MySqlGoalRepository";
import { EmployeeScopeService } from "../../application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const goalService = new GoalService(new MySqlGoalRepository(), new EmployeeScopeService());
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const GoalController = {
  async listForEmployee(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.goal.view");
    const goals = await goalService.listForEmployee(req.params.employeeId, req.user!.sub, override);
    return ok(res, goals);
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.goal.create");
    const goal = await goalService.create(req.body, req.user!.sub, override);
    return created(res, goal);
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.goal.update");
    const goal = await goalService.update(req.params.id, req.body, req.user!.sub, override);
    return ok(res, goal);
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.goal.delete");
    await goalService.remove(req.params.id, req.user!.sub, override);
    return ok(res, { message: "Goal cancelled." });
  },

  async logProgress(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.goal.update");
    const entry = await goalService.logProgress(req.params.id, req.body.value, req.body.note, req.user!.sub, override);
    return created(res, entry);
  },

  async progressHistory(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.goal.view");
    const history = await goalService.getProgressHistory(req.params.id, req.user!.sub, override);
    return ok(res, history);
  },
};
