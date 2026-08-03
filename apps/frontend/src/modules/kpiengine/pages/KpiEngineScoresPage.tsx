import { useEffect, useState } from "react";
import { kpiEngineApi, ScoreResult } from "../api/kpiEngineApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { departmentsApi, DepartmentRecord } from "../../admin/organization/departments/api/departmentsApi";

type TabKey = "employee" | "department" | "company";
const trafficColors: Record<string, string> = { red: "#c0392b", amber: "#e08e0b", green: "#1a7f37" };

export default function KpiEngineScoresPage() {
  const [tab, setTab] = useState<TabKey>("company");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);

  useEffect(() => { employeesApi.list().then(setEmployees); departmentsApi.list().then(setDepartments); }, []);

  useEffect(() => {
    if (tab === "company") kpiEngineApi.companyScore().then(setResult);
    else setResult(null);
  }, [tab]);

  async function handleSelect(id: string) {
    setSelectedId(id);
    if (!id) return;
    if (tab === "employee") setResult(await kpiEngineApi.employeeScore(id));
    else if (tab === "department") setResult(await kpiEngineApi.departmentScore(id));
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>KPI Engine — Scores</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["company", "department", "employee"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSelectedId(""); setResult(t === "company" ? result : null); }} style={{ padding: "8px 14px", border: "none", background: "none", borderBottom: tab === t ? "2px solid #333" : "2px solid transparent", fontWeight: tab === t ? 600 : 400, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      {tab === "employee" && (
        <select value={selectedId} onChange={(e) => handleSelect(e.target.value)} style={{ padding: 6, marginBottom: 16 }}>
          <option value="">— Select employee —</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
        </select>
      )}
      {tab === "department" && (
        <select value={selectedId} onChange={(e) => handleSelect(e.target.value)} style={{ padding: 6, marginBottom: 16 }}>
          <option value="">— Select department —</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      )}

      {result && (
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{result.overallScore ?? "—"}</div>
          <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>{result.scoredCount} of {result.kpiCount} KPIs have an entry for their current period</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>KPI</th><th style={{ padding: 8 }}>Period</th><th style={{ padding: 8 }}>Score</th><th style={{ padding: 8 }}>Weight</th></tr></thead>
            <tbody>
              {result.breakdown.map((b) => (
                <tr key={b.kpiId} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                  <td style={{ padding: 8 }}>{b.kpiName}</td><td style={{ padding: 8 }}>{b.periodKey}</td>
                  <td style={{ padding: 8, fontWeight: 700, color: b.trafficLight ? trafficColors[b.trafficLight] : undefined }}>{b.score ?? "n/a"}</td>
                  <td style={{ padding: 8 }}>{b.weightageUsed}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
