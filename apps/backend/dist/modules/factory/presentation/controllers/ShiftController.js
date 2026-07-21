"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftController = void 0;
const ShiftService_1 = require("../../application/services/ShiftService");
const MySqlShiftRepository_1 = require("../../infrastructure/repositories/MySqlShiftRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new ShiftService_1.ShiftService(new MySqlShiftRepository_1.MySqlShiftRepository());
exports.ShiftController = {
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
        return (0, apiResponse_1.ok)(res, { message: "Shift deleted." });
    },
};
//# sourceMappingURL=ShiftController.js.map