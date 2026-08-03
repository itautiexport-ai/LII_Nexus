import { Response } from "express";
import { KpiDefinitionService } from "../../application/services/KpiDefinitionService";
import { MySqlKpiRepository } from "../../infrastructure/repositories/MySqlKpiRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { MasterStatus } from "../../domain/entities/Kpi";

const service = new KpiDefinitionService(new MySqlKpiRepository());

export const KpiDefinitionController = {
  async list(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.list(req.query.status as MasterStatus | undefined));
  },
  async getDetail(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getDetail(req.params.id));
  },
  async create(req: AuthenticatedRequest, res: Response) {
    return created(res, await service.create(req.body, req.user!.sub));
  },
  async update(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.update(req.params.id, req.body, req.user!.sub));
  },
  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "KPI definition deleted." });
  },
  async setDepartmentWeightage(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.setDepartmentWeightage(req.params.id, req.body.departmentId, req.body.weightage, req.user!.sub));
  },
  async removeDepartmentWeightage(req: AuthenticatedRequest, res: Response) {
    await service.removeDepartmentWeightage(req.params.id, req.params.departmentId, req.user!.sub);
    return ok(res, { message: "Department weightage override removed." });
  },
};
