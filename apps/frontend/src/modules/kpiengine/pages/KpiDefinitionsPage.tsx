import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { kpiEngineApi, KpiDefinitionRecord, CATEGORY_LABELS, KpiCategory, KpiFrequency } from "../api/kpiEngineApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { departmentsApi, DepartmentRecord } from "../../admin/organization/departments/api/departmentsApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const emptyForm = {
  name: "", category: "office" as KpiCategory, formula: "actual/target*100", weightage: 10,
  frequency: "monthly" as KpiFrequency, responsibleEmployeeId: "", departmentId: "", greenThreshold: 90, amberThreshold: 70,
};

export default function KpiDefinitionsPage() {
  const navigate = useNavigate();
  const [definitions, setDefinitions] = useState<KpiDefinitionRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formulaTest, setFormulaTest] = useState<{ valid: boolean; sample: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [defs, emps, depts] = await Promise.all([kpiEngineApi.listDefinitions(), employeesApi.listForDropdown(), departmentsApi.list()]);
    setDefinitions(defs);
    setEmployees(emps);
    setDepartments(depts);
  }
  useEffect(() => { load(); }, []);

  async function handleTestFormula() {
    setError(null);
    try {
      const result = await kpiEngineApi.validateFormula(form.formula);
      setFormulaTest({ valid: result.valid, sample: result.sampleScoreWithTarget100Actual90 });
    } catch (err: any) {
      setFormulaTest(null);
      setError(err?.response?.data?.error?.message ?? "Invalid formula.");
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await kpiEngineApi.createDefinition({
        ...form,
        responsibleEmployeeId: form.responsibleEmployeeId || null,
        departmentId: form.departmentId || null,
      });
      setForm(emptyForm);
      setFormulaTest(null);
      setShowCreate(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create KPI.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this KPI?")) return;
    await kpiEngineApi.deleteDefinition(id);
    await load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontSize: 20 }}>KPI Engine — Definitions</h1>
        <PermissionGate permission="kpiengine.definition.manage">
          <button onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Cancel" : "+ New KPI (no code)"}</button>
        </PermissionGate>
      </div>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
        Create a KPI by typing a formula using only <code>target</code> and <code>actual</code> — e.g. <code>actual/target*100</code>.
        No code is ever executed; the formula is parsed by a small, whitelisted arithmetic evaluator.
      </p>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 6, marginBottom: 16, maxWidth: 560 }}>
          <input required placeholder="KPI Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as KpiCategory })} style={{ padding: 6, flex: 1 }}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as KpiFrequency })} style={{ padding: 6, flex: 1 }}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <input required placeholder="Formula (e.g. actual/target*100)" value={form.formula} onChange={(e) => { setForm({ ...form, formula: e.target.value }); setFormulaTest(null); }} style={{ padding: 6, flex: 1, fontFamily: "monospace" }} />
            <button type="button" onClick={handleTestFormula}>Test</button>
          </div>
          {formulaTest && <p style={{ fontSize: 12, color: "#1a7f37", marginBottom: 8 }}>✓ Valid — with target=100, actual=90, this scores {formulaTest.sample}</p>}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <label style={{ fontSize: 12, flex: 1 }}>Weightage
              <input type="number" min={0} max={100} value={form.weightage} onChange={(e) => setForm({ ...form, weightage: Number(e.target.value) })} style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }} />
            </label>
            <label style={{ fontSize: 12, flex: 1 }}>Green ≥
              <input type="number" value={form.greenThreshold} onChange={(e) => setForm({ ...form, greenThreshold: Number(e.target.value) })} style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }} />
            </label>
            <label style={{ fontSize: 12, flex: 1 }}>Amber ≥
              <input type="number" value={form.amberThreshold} onChange={(e) => setForm({ ...form, amberThreshold: Number(e.target.value) })} style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select value={form.responsibleEmployeeId} onChange={(e) => setForm({ ...form, responsibleEmployeeId: e.target.value })} style={{ padding: 6, flex: 1 }}>
              <option value="">— No responsible person —</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} style={{ padding: 6, flex: 1 }}>
              <option value="">— No department —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button type="submit">Create KPI</button>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}><th style={{ padding: 8 }}>Name</th><th style={{ padding: 8 }}>Category</th><th style={{ padding: 8 }}>Formula</th><th style={{ padding: 8 }}>Weight</th><th style={{ padding: 8 }}>Frequency</th><th style={{ padding: 8 }}></th></tr></thead>
        <tbody>
          {definitions.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid #eee", cursor: "pointer" }} onClick={() => navigate(`/admin/kpi-engine/${d.id}`)}>
              <td style={{ padding: 8, fontWeight: 600 }}>{d.name}</td>
              <td style={{ padding: 8 }}>{CATEGORY_LABELS[d.category]}</td>
              <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{d.formula}</td>
              <td style={{ padding: 8 }}>{d.weightage}%</td>
              <td style={{ padding: 8, textTransform: "capitalize" }}>{d.frequency}</td>
              <td style={{ padding: 8 }} onClick={(e) => e.stopPropagation()}>
                <PermissionGate permission="kpiengine.definition.manage">
                  <button onClick={() => handleDelete(d.id)}>Delete</button>
                </PermissionGate>
              </td>
            </tr>
          ))}
          {definitions.length === 0 && <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#999" }}>No KPIs defined yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
