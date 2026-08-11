import { FormEvent, useEffect, useState } from "react";
import { checklistApi, ChecklistTemplateRecord, ChecklistFrequency } from "../api/checklistApi";
import { employeesApi, EmployeeRecord } from "../../../admin/organization/employees/api/employeesApi";
import { rolesApi, RoleRecord } from "../../../admin/roles/api/rolesApi";
import PermissionGate from "../../../../shared/guards/PermissionGate";

const emptyForm = { title: "", description: "", frequency: "daily" as ChecklistFrequency, items: [""], assignEmployeeIds: [] as string[], assignRoleIds: [] as string[] };

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<ChecklistTemplateRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [t, e, r] = await Promise.all([checklistApi.listTemplates(), employeesApi.listForDropdown(), rolesApi.list()]);
    setTemplates(t);
    setEmployees(e);
    setRoles(r);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await checklistApi.createTemplate({
        title: form.title,
        description: form.description || undefined,
        frequency: form.frequency,
        items: form.items.filter((i) => i.trim()).map((label) => ({ label })),
        assignments: [
          ...form.assignEmployeeIds.map((employeeId) => ({ employeeId })),
          ...form.assignRoleIds.map((roleId) => ({ roleId })),
        ],
      });
      setForm(emptyForm);
      setShowCreate(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create checklist template.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this checklist template?")) return;
    await checklistApi.deleteTemplate(id);
    await load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Checklist Templates</h1>
        <PermissionGate permission="checklist.template.create">
          <button onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Cancel" : "+ New Template"}</button>
        </PermissionGate>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 6, marginBottom: 16, maxWidth: 520 }}>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }} />
          <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }} />
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as ChecklistFrequency })} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <fieldset style={{ border: "1px solid #eee", borderRadius: 4, padding: 10, marginBottom: 8 }}>
            <legend style={{ fontSize: 12, color: "#666" }}>Checklist Items</legend>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <input value={item} onChange={(e) => { const next = [...form.items]; next[i] = e.target.value; setForm({ ...form, items: next }); }} style={{ flex: 1, padding: 4 }} />
                <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, items: [...form.items, ""] })}>+ Add item</button>
          </fieldset>

          <fieldset style={{ border: "1px solid #eee", borderRadius: 4, padding: 10, marginBottom: 8 }}>
            <legend style={{ fontSize: 12, color: "#666" }}>Assign to Employees</legend>
            <select multiple value={form.assignEmployeeIds} onChange={(e) => setForm({ ...form, assignEmployeeIds: Array.from(e.target.selectedOptions, (o) => o.value) })} style={{ width: "100%", height: 90 }}>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </select>
          </fieldset>

          <fieldset style={{ border: "1px solid #eee", borderRadius: 4, padding: 10, marginBottom: 8 }}>
            <legend style={{ fontSize: 12, color: "#666" }}>Assign to Roles (everyone holding this role)</legend>
            <select multiple value={form.assignRoleIds} onChange={(e) => setForm({ ...form, assignRoleIds: Array.from(e.target.selectedOptions, (o) => o.value) })} style={{ width: "100%", height: 70 }}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </fieldset>

          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button type="submit">Create Template</button>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Title</th>
            <th style={{ padding: 8 }}>Frequency</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8, fontWeight: 600 }}>{t.title}</td>
              <td style={{ padding: 8, textTransform: "capitalize" }}>{t.frequency}</td>
              <td style={{ padding: 8 }}>{t.status}</td>
              <td style={{ padding: 8 }}>
                <PermissionGate permission="checklist.template.delete">
                  <button onClick={() => handleDelete(t.id)}>Delete</button>
                </PermissionGate>
              </td>
            </tr>
          ))}
          {templates.length === 0 && <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#777" }}>No checklist templates yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
