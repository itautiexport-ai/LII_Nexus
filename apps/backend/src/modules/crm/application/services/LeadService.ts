import { v4 as uuid } from "uuid";
import { CreateLeadData, ICrmRepository, ListLeadsParams, UpdateLeadData } from "../../domain/repositories/ICrmRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { SalesStage } from "../../domain/entities/Lead";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";
import { MySqlEmployeeRepository } from "../../../organization/infrastructure/repositories/MySqlEmployeeRepository";

import { pool } from "../../../../infrastructure/database/mysql/connection";

const notificationService = new NotificationService(new MySqlNotificationRepository());
const employeeRepo = new MySqlEmployeeRepository();

/** Stages that automatically resolve the coarser `status` bucket. Any other
 *  stage leaves status untouched (still 'active' unless someone manually
 *  marks a lead dead/dormant, which the spec keeps as a distinct status
 *  choice independent of the single combined "Dead / Dormant" stage). */
const STAGE_STATUS_SYNC: Partial<Record<SalesStage, "won" | "lost">> = {
  order_won: "won",
  order_lost: "lost",
};

export class LeadService {
  constructor(private readonly repo: ICrmRepository, private readonly scope: EmployeeScopeService) {}

  /**
   * Determine whether the actor can view ALL leads across the company.
   * Rules:
   * 1. Admin roles: System Admin, Admin, Super Admin, Director, CEO, Management
   * 2. Admin designations: ADMIN, SYSTEM ADMIN, DIRECTOR, CEO, CHIEF EXECUTIVE OFFICER, MANAGEMENT
   * 3. Merchant HOD: Designation has HOD and Department is CRM / Merchant / Sales, or designation is Merchant HOD.
   * All other users (Executives, Merchants, other departments) can ONLY see leads assigned to them.
   */
  async canActorViewAllLeads(actorUserId: string): Promise<boolean> {
    const [roleRows] = await pool.query<any[]>(`
      SELECT r.name 
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [actorUserId]);
    const roleNames = roleRows.map((r: any) => (r.name || "").toLowerCase().trim());

    // Check Admin / Director / Super Admin roles
    if (roleNames.some((r: string) => 
      ["admin", "system admin", "super admin", "director", "ceo", "management", "management executive"].includes(r)
    )) {
      return true;
    }

    // Check Employee designation & department
    const [empRows] = await pool.query<any[]>(`
      SELECT e.id, d.name as dept_name, desig.title as designation_title
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN designations desig ON desig.id = e.designation_id
      WHERE (e.user_id = ? OR e.id = ?) AND e.deleted_at IS NULL
      LIMIT 1
    `, [actorUserId, actorUserId]);

    if (empRows.length > 0) {
      const desig = (empRows[0].designation_title || "").toLowerCase().trim();
      const dept = (empRows[0].dept_name || "").toLowerCase().trim();

      // Admin / Director / CEO / Management designation
      if (["admin", "system admin", "director", "ceo", "chief executive officer", "management", "management executive"].includes(desig)) {
        return true;
      }

      // ONLY Merchant HOD: Designation has HOD and Department has CRM / Merchant / Sales
      const isHod = desig.includes("hod") || desig.includes("head of department");
      const isMerchantDept = dept.includes("crm") || dept.includes("merchant") || dept.includes("sales");
      if (isHod && isMerchantDept) {
        return true;
      }
      if (desig.includes("merchant hod")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine whether the actor can transfer / reassign leads.
   * STRICT REQUIREMENT: Only Admin, Management (Director, CEO, Management), and Merchant HOD.
   * Regular executives / merchants CANNOT transfer leads.
   */
  async canActorTransferLead(actorUserId: string): Promise<boolean> {
    const [empRows] = await pool.query<any[]>(`
      SELECT e.id, desig.title as designation_title, d.name as dept_name
      FROM employees e
      LEFT JOIN designations desig ON desig.id = e.designation_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE (e.user_id = ? OR e.id = ?) AND e.deleted_at IS NULL
      LIMIT 1
    `, [actorUserId, actorUserId]);

    const desig = empRows.length > 0 ? (empRows[0].designation_title || "").toLowerCase().trim() : "";
    const dept = empRows.length > 0 ? (empRows[0].dept_name || "").toLowerCase().trim() : "";

    // 1. Any designation containing "executive" is strictly DENIED
    if (desig.includes("executive")) {
      return false;
    }

    // 2. Admin by email
    const [userRows] = await pool.query<any[]>(`
      SELECT email FROM users WHERE id = ? LIMIT 1
    `, [actorUserId]);
    if (userRows.length > 0) {
      const email = (userRows[0].email || "").toLowerCase().trim();
      if (email === "admin" || email === "admin@liinexus.com") {
        return true;
      }
    }

    const [roleRows] = await pool.query<any[]>(`
      SELECT r.name 
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [actorUserId]);
    const roleNames = roleRows.map((r: any) => (r.name || "").toLowerCase().trim());

    // 3. Admin roles / designations
    if (roleNames.some((r: string) => ["admin", "system admin", "super admin", "administrator"].includes(r))) {
      return true;
    }
    if (["admin", "system admin", "administrator"].includes(desig)) {
      return true;
    }

    // 4. Management (Director, CEO, Management, Manager)
    if (roleNames.some((r: string) => ["director", "ceo", "management", "manager"].includes(r))) {
      return true;
    }
    if (
      desig.includes("admin") ||
      desig.includes("manage") ||
      desig.includes("director") ||
      desig.includes("ceo") ||
      desig === "md"
    ) {
      return true;
    }

    return false;
  }

  /**
   * Resolves all possible assigned_merchant_id values corresponding to this actor.
   * In crm_leads, assigned_merchant_id references master_merchants(id).
   */
  async getMerchantIdsForActor(actorUserId: string): Promise<string[]> {
    const [merchants] = await pool.query<any[]>("SELECT id, name FROM master_merchants WHERE status = 'active' OR status IS NULL");
    const [userRows] = await pool.query<any[]>(`
      SELECT u.id, u.full_name, u.email, e.id as emp_id, e.full_name as emp_name
      FROM users u
      LEFT JOIN employees e ON (e.user_id = u.id OR e.id = u.id) AND e.deleted_at IS NULL
      WHERE u.id = ?
      LIMIT 1
    `, [actorUserId]);

    if (userRows.length === 0) return [];
    const u = userRows[0];
    const ids = new Set<string>();
    if (u.id) ids.add(u.id);
    if (u.emp_id) ids.add(u.emp_id);

    const uName = (u.full_name || "").trim().toLowerCase();
    const empName = (u.emp_name || "").trim().toLowerCase();
    const uFirst = uName.split(" ")[0];

    for (const m of merchants) {
      const mName = m.name.trim().toLowerCase();
      const mFirst = mName.split(" ")[0];

      if (mName === uName || mName === empName) {
        ids.add(m.id);
      } else if (uFirst && uFirst === mFirst && (uName.includes(mFirst) || mName.includes(uFirst))) {
        ids.add(m.id);
      } else if (uName.includes(mName) || mName.includes(uName)) {
        ids.add(m.id);
      }
    }
    return Array.from(ids);
  }

  /** Self-assigned or Admin/Merchant HOD override */
  private async assertCanAccessLead(assignedMerchantId: string | null, actorUserId: string, _hasOverride?: boolean) {
    const canSeeAll = await this.canActorViewAllLeads(actorUserId);
    if (canSeeAll) return;

    if (!assignedMerchantId) {
      throw new ForbiddenError("This lead is unassigned. Only Admin or Merchant HOD can access it.");
    }
    const merchantIds = await this.getMerchantIdsForActor(actorUserId);
    if (!merchantIds.includes(assignedMerchantId)) {
      throw new ForbiddenError("You can only access leads assigned to you.");
    }
  }

  /** createdBy/updatedBy/loggedBy/uploadedBy are attribution fields, not
   *  access-control fields - resolved best-effort (nullable) so an admin/CEO
   *  with no personal Employee Master record can still create/edit/log
   *  against leads via their override permission. This is the same fix
   *  applied to employee_kpi_scores.entered_by after the identical bug
   *  surfaced in the Scoring Engine. */
  private async resolveActorEmployeeId(actorUserId: string): Promise<string | null> {
    const actor = await this.scope.getEmployeeForUser(actorUserId);
    return actor?.id ?? null;
  }

  async list(params: ListLeadsParams, actorUserId: string, _hasViewOverride?: boolean) {
    const canSeeAll = await this.canActorViewAllLeads(actorUserId);
    if (canSeeAll) {
      return this.repo.list(params);
    }
    const merchantIds = await this.getMerchantIdsForActor(actorUserId);
    if (merchantIds.length === 0) {
      return { items: [], total: 0 };
    }
    return this.repo.list({ ...params, assignedMerchantIds: merchantIds });
  }

  async getById(id: string, actorUserId: string, _hasViewOverride?: boolean) {
    const lead = await this.repo.getWithContext(id);
    if (!lead) throw new NotFoundError("Lead not found.");
    await this.assertCanAccessLead(lead.assignedMerchantId, actorUserId);
    const [followups, files] = await Promise.all([this.repo.listFollowupsForLead(id), this.repo.listFilesForLead(id)]);
    return { ...lead, followups, files };
  }

  private async generateLeadCode(): Promise<string> {
    const seq = await this.repo.nextLeadCodeSequence();
    const code = `LEAD-${String(seq).padStart(6, "0")}`;
    // Guard against a rare race on the sequence count under concurrent
    // creation - fall back to a timestamp suffix rather than fail outright.
    const existing = await this.repo.findByLeadCode(code);
    return existing ? `LEAD-${String(seq).padStart(6, "0")}-${Date.now().toString().slice(-4)}` : code;
  }

  async create(input: Omit<CreateLeadData, "id" | "leadCode" | "createdBy">, actorUserId: string, hasCreateOverride?: boolean) {
    void hasCreateOverride;
    const leadCode = await this.generateLeadCode();
    const createdBy = await this.resolveActorEmployeeId(actorUserId);

    let assignedMerchantId = input.assignedMerchantId;
    const canTransfer = await this.canActorTransferLead(actorUserId);
    if (!canTransfer) {
      const merchantIds = await this.getMerchantIdsForActor(actorUserId);
      if (merchantIds.length > 0) {
        assignedMerchantId = merchantIds[0];
      } else {
        assignedMerchantId = undefined;
      }
    }

    const lead = await this.repo.create({ id: uuid(), leadCode, createdBy, ...input, assignedMerchantId });
    await AuditService.record({
      actorUserId, action: "CRM_LEAD_CREATED", entityType: "crm_lead", entityId: lead.id,
      afterState: { leadCode: lead.leadCode, contactName: lead.contactName, leadSource: lead.leadSource, leadCategory: lead.leadCategory },
    });
    return lead;
  }

  async update(id: string, changes: UpdateLeadData, actorUserId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Lead not found.");
    await this.assertCanAccessLead(existing.assignedMerchantId, actorUserId, hasUpdateOverride);

    const syncedStatus = changes.salesStage ? STAGE_STATUS_SYNC[changes.salesStage] : undefined;
    const updatedBy = await this.resolveActorEmployeeId(actorUserId);
    const finalChanges: UpdateLeadData = { ...changes, updatedBy: updatedBy ?? undefined };
    if (syncedStatus && changes.status === undefined) finalChanges.status = syncedStatus;

    const updated = await this.repo.update(id, finalChanges);
    await AuditService.record({
      actorUserId, action: "CRM_LEAD_UPDATED", entityType: "crm_lead", entityId: id,
      beforeState: { salesStage: existing.salesStage, status: existing.status },
      afterState: { salesStage: updated.salesStage, status: updated.status },
    });

    // (Notifications removed because Merchants are now just Master Data labels without user accounts)

    return updated;
  }

  async assign(id: string, merchantId: string | null, actorUserId: string) {
    const canTransfer = await this.canActorTransferLead(actorUserId);
    if (!canTransfer) {
      throw new ForbiddenError("Only Admin, Management, and Merchant HOD can transfer or reassign leads.");
    }
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Lead not found.");
    const updatedBy = await this.resolveActorEmployeeId(actorUserId);
    const updated = await this.repo.assign(id, merchantId, updatedBy);
    await AuditService.record({
      actorUserId, action: "CRM_LEAD_ASSIGNED", entityType: "crm_lead", entityId: id,
      beforeState: { assignedMerchantId: existing.assignedMerchantId }, afterState: { assignedMerchantId: merchantId },
    });

    // (Notifications removed because Merchants are now just Master Data labels without user accounts)

    return updated;
  }

  async remove(id: string, actorUserId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Lead not found.");
    await this.assertCanAccessLead(existing.assignedMerchantId, actorUserId);
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId, action: "CRM_LEAD_DELETED", entityType: "crm_lead", entityId: id });
  }

  async logFollowup(leadId: string, dueDate: string, remarks: string | null | undefined, nextAction: string | null | undefined, actorUserId: string, hasUpdateOverride: boolean) {
    const lead = await this.repo.findById(leadId);
    if (!lead) throw new NotFoundError("Lead not found.");
    await this.assertCanAccessLead(lead.assignedMerchantId, actorUserId, hasUpdateOverride);

    const loggedBy = await this.resolveActorEmployeeId(actorUserId);

    // Completing the currently-pending follow-up (if any) before opening the
    // next one - a lead should only ever have one open follow-up cycle.
    const pending = await this.repo.getPendingFollowup(leadId);
    if (pending) {
      await this.repo.completeFollowup(pending.id, remarks ?? null, loggedBy);
    }
    const created = await this.repo.logFollowup({ id: uuid(), leadId, dueDate, remarks, nextAction, loggedBy });
    await this.repo.update(leadId, { nextFollowUpDate: dueDate, followUpRemarks: remarks ?? undefined, nextAction: nextAction ?? undefined, updatedBy: loggedBy ?? undefined });

    await AuditService.record({ actorUserId, action: "CRM_FOLLOWUP_LOGGED", entityType: "crm_lead", entityId: leadId, afterState: { dueDate, remarks, nextAction } });
    return created;
  }

  async addFile(leadId: string, fileName: string, fileUrl: string, actorUserId: string, hasUpdateOverride: boolean) {
    const lead = await this.repo.findById(leadId);
    if (!lead) throw new NotFoundError("Lead not found.");
    await this.assertCanAccessLead(lead.assignedMerchantId, actorUserId, hasUpdateOverride);
    const uploadedBy = await this.resolveActorEmployeeId(actorUserId);
    const file = await this.repo.addFile(leadId, fileName, fileUrl, uploadedBy);
    await AuditService.record({ actorUserId, action: "CRM_LEAD_FILE_ADDED", entityType: "crm_lead", entityId: leadId, afterState: { fileName } });
    return file;
  }

  async bulkImport(rows: Omit<CreateLeadData, "id" | "leadCode" | "createdBy">[], actorUserId: string) {
    if (rows.length === 0) throw new ValidationError("No rows to import.");
    const createdBy = await this.resolveActorEmployeeId(actorUserId);
    // Each row is created immediately (not batched into one array first) so
    // that nextLeadCodeSequence()'s COUNT(*) reflects prior rows in this
    // same import - generating all codes up front before any inserts
    // happened previously meant every row in a batch got the identical
    // "next" code (the count doesn't move until a row actually commits),
    // and the second row's insert failed on a duplicate-key violation the
    // first time this was tested with a real multi-row file.
    let count = 0;
    for (const row of rows) {
      const leadCode = await this.generateLeadCode();
      await this.repo.create({ id: uuid(), leadCode, createdBy, ...row });
      count++;
    }
    await AuditService.record({ actorUserId, action: "CRM_LEADS_IMPORTED", entityType: "crm_lead", entityId: null, afterState: { count } });
    return count;
  }
}
