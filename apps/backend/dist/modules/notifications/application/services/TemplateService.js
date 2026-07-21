"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class TemplateService {
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.listTemplates();
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.listTemplates();
        if (!existing.some((t) => t.id === id))
            throw new DomainError_1.NotFoundError("Notification template not found.");
        const updated = await this.repo.updateTemplate(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "NOTIFICATION_TEMPLATE_UPDATED", entityType: "notification_template", entityId: id, afterState: changes });
        return updated;
    }
}
exports.TemplateService = TemplateService;
//# sourceMappingURL=TemplateService.js.map