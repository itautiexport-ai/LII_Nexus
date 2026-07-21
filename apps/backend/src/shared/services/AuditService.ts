import { v4 as uuid } from "uuid";
import { pool } from "../../infrastructure/database/mysql/connection";

/* Minimal internal write-log helper, not a user-facing module (out of scope
   for this build). Kept because every write in an admin/security context
   should leave a trace - this just persists it; a full audit-viewing module
   with its own permissions/API is a later addition, per the architecture doc. */
interface AuditEntry {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
}

export const AuditService = {
  async record(entry: AuditEntry): Promise<void> {
    await pool.query(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, before_state, after_state)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid(),
        entry.actorUserId,
        entry.action,
        entry.entityType,
        entry.entityId ?? null,
        entry.beforeState ? JSON.stringify(entry.beforeState) : null,
        entry.afterState ? JSON.stringify(entry.afterState) : null,
      ]
    );
  },
};
