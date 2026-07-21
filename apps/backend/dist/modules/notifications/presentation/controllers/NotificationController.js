"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const NotificationService_1 = require("../../application/services/NotificationService");
const TemplateService_1 = require("../../application/services/TemplateService");
const EscalationRuleService_1 = require("../../application/services/EscalationRuleService");
const EscalationEngineService_1 = require("../../application/services/EscalationEngineService");
const MySqlNotificationRepository_1 = require("../../infrastructure/repositories/MySqlNotificationRepository");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const repo = new MySqlNotificationRepository_1.MySqlNotificationRepository();
const service = new NotificationService_1.NotificationService(repo);
const templateService = new TemplateService_1.TemplateService(repo);
const escalationRuleService = new EscalationRuleService_1.EscalationRuleService(repo);
const escalationEngine = new EscalationEngineService_1.EscalationEngineService(repo);
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.NotificationController = {
    async listMine(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const status = req.query.status;
        const isRead = req.query.isRead === undefined ? undefined : req.query.isRead === "true";
        const { items, total } = await service.listMine(req.user.sub, page, pageSize, status, isRead);
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async unreadCount(req, res) {
        return (0, apiResponse_1.ok)(res, { count: await service.unreadCount(req.user.sub) });
    },
    async markRead(req, res) {
        const override = await hasPermission(req.user.sub, "notification.view");
        return (0, apiResponse_1.ok)(res, await service.markRead(req.params.id, req.user.sub, override));
    },
    async markAllRead(req, res) {
        const count = await service.markAllRead(req.user.sub);
        return (0, apiResponse_1.ok)(res, { markedCount: count });
    },
    async updateStatus(req, res) {
        const override = await hasPermission(req.user.sub, "notification.view");
        return (0, apiResponse_1.ok)(res, await service.updateStatus(req.params.id, req.body.status, req.user.sub, override));
    },
    async listTemplates(_req, res) {
        return (0, apiResponse_1.ok)(res, await templateService.list());
    },
    async updateTemplate(req, res) {
        return (0, apiResponse_1.ok)(res, await templateService.update(req.params.id, req.body, req.user.sub));
    },
    async listEscalationRules(_req, res) {
        return (0, apiResponse_1.ok)(res, await escalationRuleService.list());
    },
    async updateEscalationRule(req, res) {
        return (0, apiResponse_1.ok)(res, await escalationRuleService.update(Number(req.params.level), req.body, req.user.sub));
    },
    async runEscalationCheck(_req, res) {
        return (0, apiResponse_1.ok)(res, await escalationEngine.runCheck());
    },
};
//# sourceMappingURL=NotificationController.js.map