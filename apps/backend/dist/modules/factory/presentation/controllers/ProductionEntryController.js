"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionEntryController = void 0;
const ProductionEntryService_1 = require("../../application/services/ProductionEntryService");
const MySqlProductionEntryRepository_1 = require("../../infrastructure/repositories/MySqlProductionEntryRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const entryService = new ProductionEntryService_1.ProductionEntryService(new MySqlProductionEntryRepository_1.MySqlProductionEntryRepository(), new EmployeeScopeService_1.EmployeeScopeService());
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.ProductionEntryController = {
    async listForEmployee(req, res) {
        const override = await hasPermission(req.user.sub, "factory.entry.view");
        const { from, to } = req.query;
        const entries = await entryService.listForEmployee(req.params.employeeId, req.user.sub, override, { from, to });
        return (0, apiResponse_1.ok)(res, entries);
    },
    async lineShiftSummary(req, res) {
        const { lineId, shiftId, date } = req.query;
        if (!lineId || !shiftId || !date) {
            return res.status(400).json({
                success: false, data: null, meta: null,
                error: { code: "VALIDATION_ERROR", message: "lineId, shiftId, and date query params are required.", details: null },
            });
        }
        return (0, apiResponse_1.ok)(res, await entryService.getLineShiftSummary(lineId, shiftId, date));
    },
    async create(req, res) {
        const override = await hasPermission(req.user.sub, "factory.entry.create");
        return (0, apiResponse_1.created)(res, await entryService.create(req.body, req.user.sub, override));
    },
    async update(req, res) {
        const override = await hasPermission(req.user.sub, "factory.entry.update");
        return (0, apiResponse_1.ok)(res, await entryService.update(req.params.id, req.body, req.user.sub, override));
    },
    async remove(req, res) {
        const override = await hasPermission(req.user.sub, "factory.entry.delete");
        await entryService.remove(req.params.id, req.user.sub, override);
        return (0, apiResponse_1.ok)(res, { message: "Production entry deleted." });
    },
};
//# sourceMappingURL=ProductionEntryController.js.map