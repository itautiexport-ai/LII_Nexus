import { Response } from "express";
import { ContractorService } from "../../application/services/ContractorService";
import { MySqlContractorRepository } from "../../infrastructure/repositories/MySqlContractorRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { MasterStatus } from "../../domain/entities/FactoryDepartment";

const service = new ContractorService(new MySqlContractorRepository());

export const ContractorController = {
  async list(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.list(req.query.status as MasterStatus | undefined));
  },
  async create(req: AuthenticatedRequest, res: Response) {
    return created(res, await service.create(req.body, req.user!.sub));
  },
  async update(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.update(req.params.id, req.body, req.user!.sub));
  },
  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "Contractor deleted." });
  },
};
