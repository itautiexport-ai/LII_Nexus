import { Response } from "express";
import { NotificationService } from "../../application/services/NotificationService";
import { TemplateService } from "../../application/services/TemplateService";
import { EscalationRuleService } from "../../application/services/EscalationRuleService";
import { EscalationEngineService } from "../../application/services/EscalationEngineService";
import { MySqlNotificationRepository } from "../../infrastructure/repositories/MySqlNotificationRepository";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { NotificationStatus } from "../../domain/entities/Notification";

const repo = new MySqlNotificationRepository();
const service = new NotificationService(repo);
const templateService = new TemplateService(repo);
const escalationRuleService = new EscalationRuleService(repo);
const escalationEngine = new EscalationEngineService(repo);
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const NotificationController = {
  async listMine(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const status = req.query.status as NotificationStatus | undefined;
    const isRead = req.query.isRead === undefined ? undefined : req.query.isRead === "true";
    const { items, total } = await service.listMine(req.user!.sub, page, pageSize, status, isRead);
    return ok(res, items, { page, pageSize, totalItems: total });
  },

  async unreadCount(req: AuthenticatedRequest, res: Response) {
    return ok(res, { count: await service.unreadCount(req.user!.sub) });
  },

  async markRead(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "notification.view");
    return ok(res, await service.markRead(req.params.id, req.user!.sub, override));
  },

  async markAllRead(req: AuthenticatedRequest, res: Response) {
    const count = await service.markAllRead(req.user!.sub);
    return ok(res, { markedCount: count });
  },

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "notification.view");
    return ok(res, await service.updateStatus(req.params.id, req.body.status, req.user!.sub, override));
  },

  async listTemplates(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await templateService.list());
  },

  async updateTemplate(req: AuthenticatedRequest, res: Response) {
    return ok(res, await templateService.update(req.params.id, req.body, req.user!.sub));
  },

  async listEscalationRules(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await escalationRuleService.list());
  },

  async updateEscalationRule(req: AuthenticatedRequest, res: Response) {
    return ok(res, await escalationRuleService.update(Number(req.params.level), req.body, req.user!.sub));
  },

  async runEscalationCheck(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await escalationEngine.runCheck());
  },
};
