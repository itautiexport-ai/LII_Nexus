import { Response } from "express";
import { ProductionEntryService } from "../../application/services/ProductionEntryService";
import { MySqlProductionEntryRepository } from "../../infrastructure/repositories/MySqlProductionEntryRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const entryService = new ProductionEntryService(new MySqlProductionEntryRepository(), new EmployeeScopeService());
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const ProductionEntryController = {
  async listForEmployee(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "factory.entry.view");
    const { from, to } = req.query as { from?: string; to?: string };
    const entries = await entryService.listForEmployee(req.params.employeeId, req.user!.sub, override, { from, to });
    return ok(res, entries);
  },

  async lineShiftSummary(req: AuthenticatedRequest, res: Response) {
    const { lineId, shiftId, date } = req.query as { lineId?: string; shiftId?: string; date?: string };
    if (!lineId || !shiftId || !date) {
      return res.status(400).json({
        success: false, data: null, meta: null,
        error: { code: "VALIDATION_ERROR", message: "lineId, shiftId, and date query params are required.", details: null },
      });
    }
    return ok(res, await entryService.getLineShiftSummary(lineId, shiftId, date));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "factory.entry.create");
    return created(res, await entryService.create(req.body, req.user!.sub, override));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "factory.entry.update");
    return ok(res, await entryService.update(req.params.id, req.body, req.user!.sub, override));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "factory.entry.delete");
    await entryService.remove(req.params.id, req.user!.sub, override);
    return ok(res, { message: "Production entry deleted." });
  },
};
