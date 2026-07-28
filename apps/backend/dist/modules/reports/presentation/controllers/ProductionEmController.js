"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionEmController = void 0;
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const ProductionEmService_1 = require("../../application/services/ProductionEmService");
const service = new ProductionEmService_1.ProductionEmService();
exports.ProductionEmController = {
    async getReport(req, res) {
        const startDate = req.query.startDate || "";
        const endDate = req.query.endDate || "";
        const data = await service.getProductionEmReport(startDate, endDate);
        return (0, apiResponse_1.ok)(res, data);
    }
};
//# sourceMappingURL=ProductionEmController.js.map