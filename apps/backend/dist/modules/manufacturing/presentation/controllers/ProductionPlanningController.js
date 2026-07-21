"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionPlanningController = void 0;
const ProductionPlanningService_1 = require("../../application/services/ProductionPlanningService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
exports.ProductionPlanningController = {
    async createRecord(req, res) {
        const input = req.body;
        const createdBy = req.user?.id || "system";
        // Add attachment_url if a file was uploaded
        const file = req.file;
        if (file) {
            input.attachmentUrl = `/uploads/${file.filename}`;
        }
        const record = await ProductionPlanningService_1.productionPlanningService.createRecord(input, createdBy);
        return (0, apiResponse_1.created)(res, record);
    },
    async getRecords(req, res) {
        const records = await ProductionPlanningService_1.productionPlanningService.getRecords();
        return (0, apiResponse_1.ok)(res, records);
    },
    async deleteRecord(req, res) {
        const { id } = req.params;
        await ProductionPlanningService_1.productionPlanningService.deleteRecord(id);
        return (0, apiResponse_1.ok)(res, { message: "Record deleted successfully" });
    },
    async updateCbmSplit(req, res) {
        const { id } = req.params;
        const { sezCbm, sirsiCbm, vendorCbm, vendorName } = req.body;
        await ProductionPlanningService_1.productionPlanningService.updateCbmSplit(id, Number(sezCbm), Number(sirsiCbm), Number(vendorCbm), vendorName);
        return (0, apiResponse_1.ok)(res, { message: "CBM split updated successfully" });
    },
    async updateProcessCbm(req, res) {
        const { id } = req.params;
        const { machineShopCbm, assemblyCbm, sandingCbm, finishingCbm, packingCbm } = req.body;
        await ProductionPlanningService_1.productionPlanningService.updateProcessCbm(id, Number(machineShopCbm), Number(assemblyCbm), Number(sandingCbm), Number(finishingCbm), Number(packingCbm));
        return (0, apiResponse_1.ok)(res, { message: "Process CBM updated successfully" });
    }
};
//# sourceMappingURL=ProductionPlanningController.js.map