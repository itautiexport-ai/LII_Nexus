import { Response } from "express";
import { CrmDashboardService } from "../../application/services/CrmDashboardService";
import { MerchantMetricsService } from "../../application/services/MerchantMetricsService";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ok } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const dashboardService = new CrmDashboardService();
const merchantMetricsService = new MerchantMetricsService();
const scope = new EmployeeScopeService();

export const CrmDashboardController = {
  async ceo(_req: AuthenticatedRequest, res: Response) { return ok(res, await dashboardService.getCeoDashboard()); },
  async merchants(_req: AuthenticatedRequest, res: Response) { return ok(res, await dashboardService.getMerchantDashboard()); },
  async leadSource(_req: AuthenticatedRequest, res: Response) { return ok(res, await dashboardService.getLeadSourceDashboard()); },
  async exportVsDomestic(_req: AuthenticatedRequest, res: Response) { return ok(res, await dashboardService.getExportVsDomesticDashboard()); },
  async followUpDelay(_req: AuthenticatedRequest, res: Response) { return ok(res, await dashboardService.getFollowUpDelayDashboard()); },
  async forecastPipeline(_req: AuthenticatedRequest, res: Response) { return ok(res, await dashboardService.getForecastPipelineDashboard()); },
  async wonLostAnalysis(_req: AuthenticatedRequest, res: Response) { return ok(res, await dashboardService.getWonLostAnalysis()); },

  async myMerchantMetrics(req: AuthenticatedRequest, res: Response) {
    const actor = await scope.requireEmployeeForUser(req.user!.sub);
    return ok(res, await merchantMetricsService.getMetrics(actor.id));
  },
  async merchantMetricsById(req: AuthenticatedRequest, res: Response) {
    return ok(res, await merchantMetricsService.getMetrics(req.params.merchantId));
  },
};
