"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../infrastructure/database/mysql/connection");
exports.AuditService = {
    async record(entry) {
        await connection_1.pool.query(`INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, before_state, after_state)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            (0, uuid_1.v4)(),
            entry.actorUserId,
            entry.action,
            entry.entityType,
            entry.entityId ?? null,
            entry.beforeState ? JSON.stringify(entry.beforeState) : null,
            entry.afterState ? JSON.stringify(entry.afterState) : null,
        ]);
    },
};
//# sourceMappingURL=AuditService.js.map