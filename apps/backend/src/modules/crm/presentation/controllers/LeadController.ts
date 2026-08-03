import { Response } from "express";
import { LeadService } from "../../application/services/LeadService";
import { MySqlCrmRepository } from "../../infrastructure/repositories/MySqlCrmRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { CrmExcelService } from "../../application/services/CrmExcelService";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { LeadCategory, LeadPriority, LeadSource, LeadStatus, SalesStage } from "../../domain/entities/Lead";
import { ValidationError } from "../../../../core/domain/errors/DomainError";

const repo = new MySqlCrmRepository();
const service = new LeadService(repo, new EmployeeScopeService());
const excelService = new CrmExcelService();
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const LeadController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "crm.lead.view");
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const { items, total } = await service.list({
      page, pageSize,
      search: req.query.search as string | undefined,
      status: req.query.status as LeadStatus | undefined,
      salesStage: req.query.salesStage as SalesStage | undefined,
      leadSource: req.query.leadSource as LeadSource | undefined,
      leadCategory: req.query.leadCategory as LeadCategory | undefined,
      priority: req.query.priority as LeadPriority | undefined,
      overdueOnly: req.query.overdueOnly === "true",
    }, req.user!.sub, override);
    return ok(res, items, { page, pageSize, totalItems: total });
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "crm.lead.view");
    return ok(res, await service.getById(req.params.id, req.user!.sub, override));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "crm.lead.create");
    return created(res, await service.create(req.body, req.user!.sub, override));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "crm.lead.update");
    return ok(res, await service.update(req.params.id, req.body, req.user!.sub, override));
  },

  async assign(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.assign(req.params.id, req.body.merchantId, req.user!.sub));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "Lead deleted." });
  },

  async logFollowup(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "crm.lead.update");
    return created(res, await service.logFollowup(req.params.id, req.body.dueDate, req.body.remarks, req.body.nextAction, req.user!.sub, override));
  },

  async addFile(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "crm.lead.update");
    return created(res, await service.addFile(req.params.id, req.body.fileName, req.body.fileUrl, req.user!.sub, override));
  },

  async exportExcel(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "crm.lead.view");
    const { items } = await service.list({ page: 1, pageSize: 10000 }, req.user!.sub, override);
    const buffer = excelService.exportLeads(items);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=crm-leads-export.xlsx");
    return res.send(buffer);
  },

  async importExcel(req: AuthenticatedRequest, res: Response) {
    const file = (req as any).file;
    if (!file) throw new ValidationError("No file uploaded. Attach an .xlsx file under the 'file' field.");
    const rows = excelService.parseImportFile(file.buffer);
    const count = await service.bulkImport(rows, req.user!.sub);
    return created(res, { imported: count });
  },
};
