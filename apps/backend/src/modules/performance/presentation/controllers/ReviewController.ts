import { Response } from "express";
import { ReviewService } from "../../application/services/ReviewService";
import { MySqlReviewRepository } from "../../infrastructure/repositories/MySqlReviewRepository";
import { MySqlGoalRepository } from "../../infrastructure/repositories/MySqlGoalRepository";
import { EmployeeScopeService } from "../../application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const reviewService = new ReviewService(new MySqlReviewRepository(), new MySqlGoalRepository(), new EmployeeScopeService());
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const ReviewController = {
  async listMine(req: AuthenticatedRequest, res: Response) {
    return ok(res, await reviewService.listMine(req.user!.sub));
  },

  async listIManage(req: AuthenticatedRequest, res: Response) {
    return ok(res, await reviewService.listIManage(req.user!.sub));
  },

  async listForEmployee(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.review.view");
    return ok(res, await reviewService.listForEmployee(req.params.employeeId, req.user!.sub, override));
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.review.view");
    return ok(res, await reviewService.getById(req.params.id, req.user!.sub, override));
  },

  async initiate(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.review.create");
    return created(res, await reviewService.initiate(req.body.employeeId, req.user!.sub, override));
  },

  async submitSelf(req: AuthenticatedRequest, res: Response) {
    return ok(res, await reviewService.submitSelfAssessment(req.params.id, req.body.selfSummary, req.user!.sub));
  },

  async submitManager(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "performance.review.manager_submit");
    return ok(res, await reviewService.submitManagerAssessment(req.params.id, req.body, req.user!.sub, override));
  },
};
