"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractorController = void 0;
const ContractorService_1 = require("../../application/services/ContractorService");
const MySqlContractorRepository_1 = require("../../infrastructure/repositories/MySqlContractorRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new ContractorService_1.ContractorService(new MySqlContractorRepository_1.MySqlContractorRepository());
exports.ContractorController = {
    async list(req, res) {
        return (0, apiResponse_1.ok)(res, await service.list(req.query.status));
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Contractor deleted." });
    },
};
//# sourceMappingURL=ContractorController.js.map