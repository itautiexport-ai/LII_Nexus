"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const AttendanceService_1 = require("../../application/services/AttendanceService");
const service = new AttendanceService_1.AttendanceService();
exports.AttendanceController = {
    async saveBulk(req, res) {
        const data = await service.saveBulk(req.body.records);
        return (0, apiResponse_1.ok)(res, data);
    }
};
//# sourceMappingURL=AttendanceController.js.map