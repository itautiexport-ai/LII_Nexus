import { Response } from "express";
import { DashboardService } from "../../application/services/DashboardService";
import { ScoreService } from "../../application/services/ScoreService";
import { MySqlFlowchartRepository } from "../../infrastructure/repositories/MySqlFlowchartRepository";
import { MySqlDelegationRepository } from "../../infrastructure/repositories/MySqlDelegationRepository";
import { MySqlChecklistRepository } from "../../infrastructure/repositories/MySqlChecklistRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ok } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const scoreService = new ScoreService(new MySqlFlowchartRepository(), new MySqlDelegationRepository(), new MySqlChecklistRepository());
const service = new DashboardService(new MySqlFlowchartRepository(), new MySqlDelegationRepository(), new EmployeeScopeService(), scoreService);

export const DashboardController = {
  async employee(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getEmployeeDashboard(req.user!.sub));
  },
  async manager(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getManagerDashboard(req.user!.sub));
  },
  async department(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getDepartmentDashboard(req.params.departmentId));
  },
  async company(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getCompanyDashboard());
  },
};
