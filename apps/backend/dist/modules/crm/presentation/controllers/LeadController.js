"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadController = void 0;
const LeadService_1 = require("../../application/services/LeadService");
const MySqlCrmRepository_1 = require("../../infrastructure/repositories/MySqlCrmRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const CrmExcelService_1 = require("../../application/services/CrmExcelService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const repo = new MySqlCrmRepository_1.MySqlCrmRepository();
const service = new LeadService_1.LeadService(repo, new EmployeeScopeService_1.EmployeeScopeService());
const excelService = new CrmExcelService_1.CrmExcelService();
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.LeadController = {
    async list(req, res) {
        const override = await hasPermission(req.user.sub, "crm.lead.view");
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const { items, total } = await service.list({
            page, pageSize,
            search: req.query.search,
            status: req.query.status,
            salesStage: req.query.salesStage,
            leadSource: req.query.leadSource,
            leadCategory: req.query.leadCategory,
            priority: req.query.priority,
            overdueOnly: req.query.overdueOnly === "true",
        }, req.user.sub, override);
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async getById(req, res) {
        const override = await hasPermission(req.user.sub, "crm.lead.view");
        return (0, apiResponse_1.ok)(res, await service.getById(req.params.id, req.user.sub, override));
    },
    async create(req, res) {
        const override = await hasPermission(req.user.sub, "crm.lead.create");
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub, override));
    },
    async update(req, res) {
        const override = await hasPermission(req.user.sub, "crm.lead.update");
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub, override));
    },
    async assign(req, res) {
        return (0, apiResponse_1.ok)(res, await service.assign(req.params.id, req.body.merchantId, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Lead deleted." });
    },
    async logFollowup(req, res) {
        const override = await hasPermission(req.user.sub, "crm.lead.update");
        return (0, apiResponse_1.created)(res, await service.logFollowup(req.params.id, req.body.dueDate, req.body.remarks, req.body.nextAction, req.user.sub, override));
    },
    async addFile(req, res) {
        const override = await hasPermission(req.user.sub, "crm.lead.update");
        return (0, apiResponse_1.created)(res, await service.addFile(req.params.id, req.body.fileName, req.body.fileUrl, req.user.sub, override));
    },
    async exportExcel(req, res) {
        const override = await hasPermission(req.user.sub, "crm.lead.view");
        const { items } = await service.list({ page: 1, pageSize: 10000 }, req.user.sub, override);
        const buffer = excelService.exportLeads(items);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=crm-leads-export.xlsx");
        return res.send(buffer);
    },
    async importExcel(req, res) {
        const file = req.file;
        if (!file)
            throw new DomainError_1.ValidationError("No file uploaded. Attach an .xlsx file under the 'file' field.");
        const rows = excelService.parseImportFile(file.buffer);
        const count = await service.bulkImport(rows, req.user.sub);
        return (0, apiResponse_1.created)(res, { imported: count });
    },
};
//# sourceMappingURL=LeadController.js.map