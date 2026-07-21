import { v4 as uuid } from "uuid";
import { CreateLeadData, ICrmRepository, ListLeadsParams, UpdateLeadData } from "../../domain/repositories/ICrmRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { SalesStage } from "../../domain/entities/Lead";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";
import { MySqlEmployeeRepository } from "../../../organization/infrastructure/repositories/MySqlEmployeeRepository";

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

  /** Self-only-or-override: a merchant's own leads are always visible/
   *  editable; anyone else's require crm.lead.view / crm.lead.update. This
   *  is deliberately simpler than EmployeeScopeService's self-or-manager
   *  pattern - a CRM lead isn't an org-chart relationship, it's a direct
   *  ownership assignment. */
  private async assertCanAccessLead(assignedMerchantId: string | null, actorUserId: string, hasOverride: boolean) {
    if (hasOverride) return;
    if (!assignedMerchantId) {
      throw new ForbiddenError("This lead is unassigned. Only someone with lead view/edit override permission can access it.");
    }
    const actor = await this.scope.getEmployeeForUser(actorUserId);
    if (!actor || actor.id !== assignedMerchantId) {
      throw new ForbiddenError("You can only access your own assigned leads unless granted broader access.");
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

  async list(params: ListLeadsParams, actorUserId: string, hasViewOverride: boolean) {
    if (hasViewOverride) return this.repo.list(params);
    const actor = await this.scope.requireEmployeeForUser(actorUserId);
    return this.repo.list({ ...params, assignedMerchantId: actor.id });
  }

  async getById(id: string, actorUserId: string, hasViewOverride: boolean) {
    const lead = await this.repo.getWithContext(id);
    if (!lead) throw new NotFoundError("Lead not found.");
    await this.assertCanAccessLead(lead.assignedMerchantId, actorUserId, hasViewOverride);
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

  async create(input: Omit<CreateLeadData, "id" | "leadCode" | "createdBy">, actorUserId: string, hasCreateOverride: boolean) {
    // Creating a lead for someone else's book requires the create
    // permission generally (route-gated); assigning it to yourself vs.
    // someone else is separate and always allowed at creation time (the
    // assignment-change restriction applies to *reassigning* an existing
    // lead via crm.lead.assign, not to who a brand-new lead is filed under).
    void hasCreateOverride;
    const leadCode = await this.generateLeadCode();
    const createdBy = await this.resolveActorEmployeeId(actorUserId);
    const lead = await this.repo.create({ id: uuid(), leadCode, createdBy, ...input });
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
