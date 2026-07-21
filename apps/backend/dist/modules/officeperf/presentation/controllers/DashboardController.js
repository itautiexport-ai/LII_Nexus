"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const DashboardService_1 = require("../../application/services/DashboardService");
const ScoreService_1 = require("../../application/services/ScoreService");
const MySqlFlowchartRepository_1 = require("../../infrastructure/repositories/MySqlFlowchartRepository");
const MySqlDelegationRepository_1 = require("../../infrastructure/repositories/MySqlDelegationRepository");
const MySqlChecklistRepository_1 = require("../../infrastructure/repositories/MySqlChecklistRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const scoreService = new ScoreService_1.ScoreService(new MySqlFlowchartRepository_1.MySqlFlowchartRepository(), new MySqlDelegationRepository_1.MySqlDelegationRepository(), new MySqlChecklistRepository_1.MySqlChecklistRepository());
const service = new DashboardService_1.DashboardService(new MySqlFlowchartRepository_1.MySqlFlowchartRepository(), new MySqlDelegationRepository_1.MySqlDelegationRepository(), new EmployeeScopeService_1.EmployeeScopeService(), scoreService);
exports.DashboardController = {
    async employee(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getEmployeeDashboard(req.user.sub));
    },
    async manager(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getManagerDashboard(req.user.sub));
    },
    async department(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getDepartmentDashboard(req.params.departmentId));
    },
    async company(_req, res) {
        return (0, apiResponse_1.ok)(res, await service.getCompanyDashboard());
    },
};
//# sourceMappingURL=DashboardController.js.map