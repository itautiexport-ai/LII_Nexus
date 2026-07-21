import { useEffect, useState } from "react";
import { behaviourApi } from "../api/behaviourApi";

type TabKey = "department" | "workflow" | "factory" | "crm" | "merchant" | "executive";
const TABS: { key: TabKey; label: string }[] = [
  { key: "department", label: "Department Health" }, { key: "workflow", label: "Workflow Health" },
  { key: "factory", label: "Factory Health" }, { key: "crm", label: "CRM Health" },
  { key: "merchant", label: "Merchant Health" }, { key: "executive", label: "Executive Health" },
];

export default function BehaviourHealthPage() {
  const [tab, setTab] = useState<TabKey>("department");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loaders: Record<TabKey, () => Promise<any>> = {
      department: behaviourApi.departmentHealth, workflow: behaviourApi.workflowHealth, factory: behaviourApi.factoryHealth,
      crm: behaviourApi.crmHealth, merchant: behaviourApi.merchantHealth, executive: behaviourApi.executiveHealth,
    };
    setData(null);
    loaders[tab]().then(setData);
  }, [tab]);

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Health Dashboards</h1>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e0e0e0", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 14px", border: "none", background: "none", borderBottom: tab === t.key ? "2px solid #333" : "2px solid transparent", fontWeight: tab === t.key ? 600 : 400, fontSize: 13 }}>{t.label}</button>
        ))}
      </div>

      {!data && <p style={{ color: "#999" }}>Loading...</p>}

      {data && tab === "department" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {data.map((d: any) => (
            <div key={d.departmentName} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.departmentName}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: d.averageIndex >= 80 ? "#1a7f37" : d.averageIndex >= 50 ? "#e08e0b" : "#c0392b" }}>{d.averageIndex}%</div>
              <div style={{ fontSize: 11, color: "#999" }}>{d.employeeCount} employee(s)</div>
            </div>
          ))}
        </div>
      )}

      {data && tab === "workflow" && (
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, maxWidth: 300 }}>
          <div style={{ fontSize: 12, color: "#888" }}>On-Time Completion Rate</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{data.onTimeRate !== null ? `${data.onTimeRate}%` : "—"}</div>
          <div style={{ fontSize: 12, color: "#999" }}>{data.totalTasks} total flowchart tasks this period</div>
        </div>
      )}

      {data && tab === "factory" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Department</th><th style={{ padding: 8 }}>On-Time Submission Rate</th><th style={{ padding: 8 }}>Avg Delay (min)</th></tr></thead>
          <tbody>{data.map((d: any) => <tr key={d.departmentName} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{d.departmentName}</td><td style={{ padding: 8 }}>{d.onTimeRate ?? "—"}%</td><td style={{ padding: 8 }}>{d.averageDelayMinutes ?? "—"}</td></tr>)}</tbody>
        </table>
      )}

      {data && tab === "crm" && (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: "#888" }}>Follow-up Discipline</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{data.followupDiscipline ?? "—"}%</div>
          </div>
          <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: "#888" }}>Data Update Discipline</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{data.dataDiscipline ?? "—"}%</div>
          </div>
        </div>
      )}

      {data && tab === "merchant" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Merchant</th><th style={{ padding: 8 }}>Follow-up Discipline</th><th style={{ padding: 8 }}>Overall Index</th></tr></thead>
          <tbody>{data.map((m: any) => <tr key={m.merchantId} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{m.merchantName}</td><td style={{ padding: 8 }}>{m.followupDiscipline ?? "—"}%</td><td style={{ padding: 8, fontWeight: 700 }}>{m.overallIndex ?? "—"}%</td></tr>)}</tbody>
        </table>
      )}

      {data && tab === "executive" && (
        <div>
          <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 20, marginBottom: 16, maxWidth: 260 }}>
            <div style={{ fontSize: 12, color: "#888" }}>Company Average Behaviour Index</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{data.companyAverageIndex ?? "—"}%</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Department</th><th style={{ padding: 8 }}>Average Index</th></tr></thead>
            <tbody>{data.departments.map((d: any) => <tr key={d.departmentName} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{d.departmentName}</td><td style={{ padding: 8, fontWeight: 700 }}>{d.averageIndex}%</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
