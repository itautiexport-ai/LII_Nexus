import { useState } from "react";
import { StageInput, StageRecord, NotificationTrigger, EscalationAction, NotificationChannel, NotificationRecipientType } from "../api/workflowApi";
import { RoleRecord } from "../../admin/roles/api/rolesApi";

interface Props {
  stage: StageRecord;
  roles: RoleRecord[];
  onSave: (stageId: string, input: StageInput) => Promise<void>;
  onDelete: (stageId: string) => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragTarget: boolean;
}

const NOTIFICATION_TRIGGERS: NotificationTrigger[] = ["on_stage_start", "on_due_date", "on_overdue", "on_completion", "on_escalation"];
const NOTIFICATION_CHANNELS: NotificationChannel[] = ["email", "sms", "in_app"];
const RECIPIENT_TYPES: NotificationRecipientType[] = ["responsible_role", "initiator", "custom_role"];
const ESCALATION_ACTIONS: EscalationAction[] = ["notify_only", "reassign"];

export default function StageCard({ stage, roles, onSave, onDelete, draggable, onDragStart, onDragOver, onDrop, isDragTarget }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<StageInput>({
    name: stage.name,
    responsibleRoleId: stage.responsibleRoleId,
    dueDays: stage.dueDays,
    approvalRequired: stage.approvalRequired,
    checklistRequired: stage.checklistRequired,
    canSkip: stage.canSkip,
    completionMode: stage.completionMode,
    minMandatoryDocuments: stage.minMandatoryDocuments,
    checklistItems: stage.checklistItems.map((c) => ({ label: c.label })),
    mandatoryDocuments: stage.mandatoryDocuments.map((d) => ({ documentName: d.documentName, isMandatory: d.isMandatory })),
    notificationRules: stage.notificationRules.map((n) => ({ ...n })),
    escalationRules: stage.escalationRules.map((e) => ({ ...e })),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await onSave(stage.id, form);
      setExpanded(false);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save stage.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        border: isDragTarget ? "2px dashed #4a90d9" : "1px solid #ddd",
        borderRadius: 6,
        marginBottom: 10,
        background: "#fff",
        opacity: draggable ? 1 : 0.6,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", padding: 12, cursor: "grab", gap: 10 }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span style={{ cursor: "grab", color: "#999", fontSize: 18 }} title="Drag to reorder">⠿</span>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 24, height: 24, borderRadius: "50%", background: "#eef3fb", fontSize: 12, fontWeight: 600,
        }}>{stage.sequence}</span>
        <strong style={{ flex: 1 }}>{stage.name}</strong>
        <span style={{ fontSize: 12, color: "#777" }}>
          {roles.find((r) => r.id === stage.responsibleRoleId)?.name ?? "Unassigned role"}
        </span>
        {stage.approvalRequired && <span style={{ fontSize: 11, background: "#fdeecb", padding: "2px 6px", borderRadius: 4 }}>Approval</span>}
        {stage.checklistRequired && <span style={{ fontSize: 11, background: "#e3f2e1", padding: "2px 6px", borderRadius: 4 }}>Checklist</span>}
        {stage.canSkip && <span style={{ fontSize: 11, background: "#eee", padding: "2px 6px", borderRadius: 4 }}>Skippable</span>}
        <span style={{ fontSize: 18, color: "#999" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding: 16, borderTop: "1px solid #eee" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <label style={{ fontSize: 13 }}>
              Stage Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Responsible Role
              <select value={form.responsibleRoleId} onChange={(e) => setForm({ ...form, responsibleRoleId: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              Due Days
              <input type="number" min={0} value={form.dueDays ?? ""} onChange={(e) => setForm({ ...form, dueDays: e.target.value ? Number(e.target.value) : null })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Completion Rule
              <select value={form.completionMode} onChange={(e) => setForm({ ...form, completionMode: e.target.value as StageInput["completionMode"] })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}>
                <option value="manual">Manual</option>
                <option value="approval_only">Approval only</option>
                <option value="all_checklist_items">All checklist items</option>
                <option value="all_of_the_above">Approval + checklist + documents</option>
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 13 }}>
            <label><input type="checkbox" checked={!!form.approvalRequired} onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })} /> Approval Required</label>
            <label><input type="checkbox" checked={!!form.checklistRequired} onChange={(e) => setForm({ ...form, checklistRequired: e.target.checked })} /> Checklist Required</label>
            <label><input type="checkbox" checked={!!form.canSkip} onChange={(e) => setForm({ ...form, canSkip: e.target.checked })} /> Can Skip</label>
          </div>

          {/* Checklist items */}
          <fieldset style={{ marginBottom: 12, border: "1px solid #eee", borderRadius: 4, padding: 10 }}>
            <legend style={{ fontSize: 12, color: "#666" }}>Checklist Items (Tasks)</legend>
            {(form.checklistItems ?? []).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <input value={item.label} onChange={(e) => {
                  const next = [...(form.checklistItems ?? [])];
                  next[i] = { label: e.target.value };
                  setForm({ ...form, checklistItems: next });
                }} style={{ flex: 1, padding: 4 }} />
                <button onClick={() => setForm({ ...form, checklistItems: (form.checklistItems ?? []).filter((_, idx) => idx !== i) })}>Remove</button>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, checklistItems: [...(form.checklistItems ?? []), { label: "" }] })}>+ Add checklist item</button>
          </fieldset>

          {/* Mandatory documents */}
          <fieldset style={{ marginBottom: 12, border: "1px solid #eee", borderRadius: 4, padding: 10 }}>
            <legend style={{ fontSize: 12, color: "#666" }}>Mandatory Documents</legend>
            {(form.mandatoryDocuments ?? []).map((doc, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                <input value={doc.documentName} onChange={(e) => {
                  const next = [...(form.mandatoryDocuments ?? [])];
                  next[i] = { ...next[i], documentName: e.target.value };
                  setForm({ ...form, mandatoryDocuments: next });
                }} style={{ flex: 1, padding: 4 }} placeholder="Document name" />
                <label style={{ fontSize: 12 }}>
                  <input type="checkbox" checked={doc.isMandatory ?? true} onChange={(e) => {
                    const next = [...(form.mandatoryDocuments ?? [])];
                    next[i] = { ...next[i], isMandatory: e.target.checked };
                    setForm({ ...form, mandatoryDocuments: next });
                  }} /> Mandatory
                </label>
                <button onClick={() => setForm({ ...form, mandatoryDocuments: (form.mandatoryDocuments ?? []).filter((_, idx) => idx !== i) })}>Remove</button>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, mandatoryDocuments: [...(form.mandatoryDocuments ?? []), { documentName: "", isMandatory: true }] })}>+ Add document</button>
            <label style={{ display: "block", fontSize: 12, marginTop: 8 }}>
              Minimum documents required to complete: {" "}
              <input type="number" min={0} value={form.minMandatoryDocuments ?? 0} onChange={(e) => setForm({ ...form, minMandatoryDocuments: Number(e.target.value) })} style={{ width: 60, padding: 2 }} />
            </label>
          </fieldset>

          {/* Notification rules */}
          <fieldset style={{ marginBottom: 12, border: "1px solid #eee", borderRadius: 4, padding: 10 }}>
            <legend style={{ fontSize: 12, color: "#666" }}>Notification Rules</legend>
            {(form.notificationRules ?? []).map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
                <select value={rule.triggerEvent} onChange={(e) => {
                  const next = [...(form.notificationRules ?? [])];
                  next[i] = { ...next[i], triggerEvent: e.target.value as NotificationTrigger };
                  setForm({ ...form, notificationRules: next });
                }} style={{ padding: 4 }}>
                  {NOTIFICATION_TRIGGERS.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
                <select value={rule.channel ?? "in_app"} onChange={(e) => {
                  const next = [...(form.notificationRules ?? [])];
                  next[i] = { ...next[i], channel: e.target.value as NotificationChannel };
                  setForm({ ...form, notificationRules: next });
                }} style={{ padding: 4 }}>
                  {NOTIFICATION_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={rule.recipientType ?? "responsible_role"} onChange={(e) => {
                  const next = [...(form.notificationRules ?? [])];
                  next[i] = { ...next[i], recipientType: e.target.value as NotificationRecipientType };
                  setForm({ ...form, notificationRules: next });
                }} style={{ padding: 4 }}>
                  {RECIPIENT_TYPES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
                <button onClick={() => setForm({ ...form, notificationRules: (form.notificationRules ?? []).filter((_, idx) => idx !== i) })}>Remove</button>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, notificationRules: [...(form.notificationRules ?? []), { triggerEvent: "on_stage_start", channel: "in_app", recipientType: "responsible_role" }] })}>+ Add notification rule</button>
          </fieldset>

          {/* Escalation rules */}
          <fieldset style={{ marginBottom: 12, border: "1px solid #eee", borderRadius: 4, padding: 10 }}>
            <legend style={{ fontSize: 12, color: "#666" }}>Escalation Rules</legend>
            {(form.escalationRules ?? []).map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12 }}>After</span>
                <input type="number" min={1} value={rule.escalateAfterDays} onChange={(e) => {
                  const next = [...(form.escalationRules ?? [])];
                  next[i] = { ...next[i], escalateAfterDays: Number(e.target.value) };
                  setForm({ ...form, escalationRules: next });
                }} style={{ width: 50, padding: 4 }} />
                <span style={{ fontSize: 12 }}>days, escalate to</span>
                <select value={rule.escalateToRoleId} onChange={(e) => {
                  const next = [...(form.escalationRules ?? [])];
                  next[i] = { ...next[i], escalateToRoleId: e.target.value };
                  setForm({ ...form, escalationRules: next });
                }} style={{ padding: 4 }}>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={rule.escalationAction ?? "notify_only"} onChange={(e) => {
                  const next = [...(form.escalationRules ?? [])];
                  next[i] = { ...next[i], escalationAction: e.target.value as EscalationAction };
                  setForm({ ...form, escalationRules: next });
                }} style={{ padding: 4 }}>
                  {ESCALATION_ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
                </select>
                <button onClick={() => setForm({ ...form, escalationRules: (form.escalationRules ?? []).filter((_, idx) => idx !== i) })}>Remove</button>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, escalationRules: [...(form.escalationRules ?? []), { escalateAfterDays: 1, escalateToRoleId: roles[0]?.id ?? "", escalationAction: "notify_only" }] })}>+ Add escalation rule</button>
          </fieldset>

          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Stage"}</button>
            <button onClick={() => onDelete(stage.id)} style={{ color: "crimson" }}>Delete Stage</button>
          </div>
        </div>
      )}
    </div>
  );
}
