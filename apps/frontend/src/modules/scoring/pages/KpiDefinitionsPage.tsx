import { FormEvent, useEffect, useState } from "react";
import { scoringApi, KpiDefinitionRecord, KpiCategory, CalculationType } from "../api/scoringApi";
import { departmentsApi, DepartmentRecord, DepartmentDropdownRecord } from "../../admin/organization/departments/api/departmentsApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const emptyForm = { name: "", category: "office" as KpiCategory, calculationType: "manual" as CalculationType, defaultWeightage: "10", description: "" };

export default function KpiDefinitionsPage() {
  const [kpis, setKpis] = useState<KpiDefinitionRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentDropdownRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [weightDrafts, setWeightDrafts] = useState<Record<string, { departmentId: string; weightage: string }>>({});

  async function load() {
    const [k, d] = await Promise.all([scoringApi.listKpis(), departmentsApi.listForDropdown()]);
    setKpis(k);
    setDepartments(d);
  }
  useEffect(() => { load(); }, []);

  const totalWeight = kpis.filter((k) => k.status === "active").reduce((sum, k) => sum + k.defaultWeightage, 0);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await scoringApi.createKpi({ ...form, defaultWeightage: Number(form.defaultWeightage) });
      setForm(emptyForm);
      setShowCreate(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create KPI.");
    }
  }

  async function handleWeightChange(kpi: KpiDefinitionRecord, weight: string) {
    await scoringApi.updateKpi(kpi.id, { defaultWeightage: Number(weight) });
    await load();
  }

  async function handleToggleStatus(kpi: KpiDefinitionRecord) {
    await scoringApi.updateKpi(kpi.id, { status: kpi.status === "active" ? "inactive" : "active" });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this KPI definition?")) return;
    await scoringApi.deleteKpi(id);
    await load();
  }

  async function handleSetDeptWeight(kpi: KpiDefinitionRecord) {
    const draft = weightDrafts[kpi.id];
    if (!draft?.departmentId || !draft?.weightage) return;
    await scoringApi.setDepartmentWeightage(kpi.id, draft.departmentId, Number(draft.weightage));
    setWeightDrafts({ ...weightDrafts, [kpi.id]: { departmentId: "", weightage: "" } });
    alert("Department weight override saved.");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 20 }}>KPI Definitions</h1>
        <PermissionGate permission="kpi.definition.create">
          <button onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Cancel" : "+ New KPI"}</button>
        </PermissionGate>
      </div>
      <p style={{ fontSize: 13, color: totalWeight === 100 ? "#777" : "#a66", marginBottom: 16 }}>
        Active KPI weights total {totalWeight}%{totalWeight !== 100 && " (not 100% — composite scores still compute correctly via renormalization, but consider adjusting)"}
      </p>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 6, marginBottom: 16, maxWidth: 480 }}>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as KpiCategory })} style={{ padding: 6, flex: 1 }}>
              <option value="office">Office</option>
              <option value="factory">Factory</option>
            </select>
            <select value={form.calculationType} onChange={(e) => setForm({ ...form, calculationType: e.target.value as CalculationType })} style={{ padding: 6, flex: 1 }}>
              <option value="flowchart">Auto: Flowchart</option>
              <option value="checklist">Auto: Checklist</option>
              <option value="delegation">Auto: Delegation</option>
              <option value="target_achievement">Auto: Target Achievement</option>
              <option value="quality">Auto: Quality</option>
              <option value="timeliness">Auto: Reporting Timeliness</option>
              <option value="manual">Manual entry (no automatic data source)</option>
            </select>
          </div>
          <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
            Default weight (%)
            <input type="number" min={0} max={100} value={form.defaultWeightage} onChange={(e) => setForm({ ...form, defaultWeightage: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
          </label>
          <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }} />
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button type="submit">Create KPI</button>
        </form>
      )}

      {kpis.map((kpi) => (
        <div key={kpi.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12, marginBottom: 10, maxWidth: 640 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{kpi.name}</strong>{" "}
              <span style={{ fontSize: 11, background: "#eee", padding: "2px 6px", borderRadius: 4, marginLeft: 6 }}>{kpi.category}</span>{" "}
              <span style={{ fontSize: 11, color: kpi.calculationType === "manual" ? "#e08e0b" : "#4a90d9" }}>
                {kpi.calculationType === "manual" ? "Manual entry" : `Auto: ${kpi.calculationType.replace(/_/g, " ")}`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <PermissionGate permission="kpi.definition.update">
                <input type="number" min={0} max={100} value={kpi.defaultWeightage} onChange={(e) => handleWeightChange(kpi, e.target.value)} style={{ width: 60, padding: 4 }} />%
                <button onClick={() => handleToggleStatus(kpi)}>{kpi.status === "active" ? "Deactivate" : "Activate"}</button>
              </PermissionGate>
              <PermissionGate permission="kpi.definition.delete">
                <button onClick={() => handleDelete(kpi.id)}>Delete</button>
              </PermissionGate>
            </div>
          </div>
          {kpi.description && <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>{kpi.description}</p>}

          <PermissionGate permission="kpi.weightage.manage">
            <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#666" }}>Department override:</span>
              <select value={weightDrafts[kpi.id]?.departmentId ?? ""} onChange={(e) => setWeightDrafts({ ...weightDrafts, [kpi.id]: { departmentId: e.target.value, weightage: weightDrafts[kpi.id]?.weightage ?? "" } })} style={{ padding: 4 }}>
                <option value="">— department —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="number" min={0} max={100} placeholder="weight %" style={{ width: 70, padding: 4 }} value={weightDrafts[kpi.id]?.weightage ?? ""} onChange={(e) => setWeightDrafts({ ...weightDrafts, [kpi.id]: { departmentId: weightDrafts[kpi.id]?.departmentId ?? "", weightage: e.target.value } })} />
              <button onClick={() => handleSetDeptWeight(kpi)}>Set</button>
            </div>
          </PermissionGate>
        </div>
      ))}
    </div>
  );
}
