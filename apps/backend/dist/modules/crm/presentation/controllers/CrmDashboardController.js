"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmDashboardController = void 0;
const CrmDashboardService_1 = require("../../application/services/CrmDashboardService");
const MerchantMetricsService_1 = require("../../application/services/MerchantMetricsService");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const dashboardService = new CrmDashboardService_1.CrmDashboardService();
const merchantMetricsService = new MerchantMetricsService_1.MerchantMetricsService();
const scope = new EmployeeScopeService_1.EmployeeScopeService();
exports.CrmDashboardController = {
    async ceo(_req, res) { return (0, apiResponse_1.ok)(res, await dashboardService.getCeoDashboard()); },
    async merchants(_req, res) { return (0, apiResponse_1.ok)(res, await dashboardService.getMerchantDashboard()); },
    async leadSource(_req, res) { return (0, apiResponse_1.ok)(res, await dashboardService.getLeadSourceDashboard()); },
    async exportVsDomestic(_req, res) { return (0, apiResponse_1.ok)(res, await dashboardService.getExportVsDomesticDashboard()); },
    async followUpDelay(_req, res) { return (0, apiResponse_1.ok)(res, await dashboardService.getFollowUpDelayDashboard()); },
    async forecastPipeline(_req, res) { return (0, apiResponse_1.ok)(res, await dashboardService.getForecastPipelineDashboard()); },
    async wonLostAnalysis(_req, res) { return (0, apiResponse_1.ok)(res, await dashboardService.getWonLostAnalysis()); },
    async myMerchantMetrics(req, res) {
        const actor = await scope.requireEmployeeForUser(req.user.sub);
        return (0, apiResponse_1.ok)(res, await merchantMetricsService.getMetrics(actor.id));
    },
    async merchantMetricsById(req, res) {
        return (0, apiResponse_1.ok)(res, await merchantMetricsService.getMetrics(req.params.merchantId));
    },
};
//# sourceMappingURL=CrmDashboardController.js.map