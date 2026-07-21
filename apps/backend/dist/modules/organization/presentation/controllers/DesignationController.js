"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignationController = void 0;
const DesignationService_1 = require("../../application/services/DesignationService");
const MySqlDesignationRepository_1 = require("../../infrastructure/repositories/MySqlDesignationRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new DesignationService_1.DesignationService(new MySqlDesignationRepository_1.MySqlDesignationRepository());
exports.DesignationController = {
    async list(_req, res) {
        return (0, apiResponse_1.ok)(res, await service.list());
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Designation deleted." });
    },
};
//# sourceMappingURL=DesignationController.js.map