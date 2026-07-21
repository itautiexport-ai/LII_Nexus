"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingController = void 0;
const MeetingService_1 = require("../../application/services/MeetingService");
const MeetingActionService_1 = require("../../application/services/MeetingActionService");
const MOMGeneratorService_1 = require("../../application/services/MOMGeneratorService");
const MOMExportService_1 = require("../../application/services/MOMExportService");
const MeetingDashboardService_1 = require("../../application/services/MeetingDashboardService");
const MySqlMeetingRepository_1 = require("../../infrastructure/repositories/MySqlMeetingRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const repo = new MySqlMeetingRepository_1.MySqlMeetingRepository();
const scope = new EmployeeScopeService_1.EmployeeScopeService();
const meetingService = new MeetingService_1.MeetingService(repo, scope);
const actionService = new MeetingActionService_1.MeetingActionService(repo);
const momGenerator = new MOMGeneratorService_1.MOMGeneratorService(repo);
const momExporter = new MOMExportService_1.MOMExportService();
const dashboardService = new MeetingDashboardService_1.MeetingDashboardService(repo);
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.MeetingController = {
    async list(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const { items, total } = await meetingService.list({
            page, pageSize,
            search: req.query.search,
            meetingType: req.query.meetingType,
            status: req.query.status,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
        });
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async getById(req, res) {
        return (0, apiResponse_1.ok)(res, await meetingService.getDetail(req.params.id));
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await meetingService.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await meetingService.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await meetingService.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Meeting deleted." });
    },
    async setReviewSection(req, res) {
        const { reviewType, notes } = req.body;
        return (0, apiResponse_1.ok)(res, await meetingService.setReviewSection(req.params.id, reviewType, notes ?? null, req.user.sub));
    },
    async addDecision(req, res) {
        return (0, apiResponse_1.created)(res, await meetingService.addDecision(req.params.id, req.body.decisionText, req.user.sub));
    },
    async addAttachment(req, res) {
        return (0, apiResponse_1.created)(res, await meetingService.addAttachment(req.params.id, req.body.fileName, req.body.fileUrl, req.user.sub));
    },
    async createAction(req, res) {
        const override = await hasPermission(req.user.sub, "meeting.action.assign_any");
        const { description, assignedTo, targetDate, priority } = req.body;
        return (0, apiResponse_1.created)(res, await actionService.createAction(req.params.id, description, assignedTo, targetDate, priority, req.user.sub, override));
    },
    async listPendingActions(_req, res) {
        return (0, apiResponse_1.ok)(res, await actionService.listPending());
    },
    async listCompletedActions(_req, res) {
        return (0, apiResponse_1.ok)(res, await actionService.listCompleted());
    },
    async getMom(req, res) {
        return (0, apiResponse_1.ok)(res, await momGenerator.generate(req.params.id));
    },
    async exportMomPdf(req, res) {
        const mom = await momGenerator.generate(req.params.id);
        const buffer = await momExporter.toPdfBuffer(mom);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=mom-${req.params.id}.pdf`);
        return res.send(buffer);
    },
    async dashboard(_req, res) {
        return (0, apiResponse_1.ok)(res, await dashboardService.getOverview());
    },
};
//# sourceMappingURL=MeetingController.js.map