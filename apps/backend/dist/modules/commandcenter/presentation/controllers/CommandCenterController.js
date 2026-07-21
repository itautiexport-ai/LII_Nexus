"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandCenterController = void 0;
const CommandCenterService_1 = require("../../application/services/CommandCenterService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new CommandCenterService_1.CommandCenterService();
exports.CommandCenterController = {
    async getOverview(_req, res) {
        return (0, apiResponse_1.ok)(res, await service.getOverview());
    },
};
//# sourceMappingURL=CommandCenterController.js.map