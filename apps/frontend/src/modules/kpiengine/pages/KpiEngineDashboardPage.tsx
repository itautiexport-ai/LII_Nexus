import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { kpiEngineApi, DashboardData } from "../api/kpiEngineApi";

export default function KpiEngineDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => { kpiEngineApi.dashboard().then(setData); }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>KPI Engine Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#888" }}>Company Score</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{data.companyScore ?? "—"}</div>
        </div>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, background: "#eafaf0" }}>
          <div style={{ fontSize: 12, color: "#1a7f37" }}>🟢 Green</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#1a7f37" }}>{data.trafficLightCounts.green}</div>
        </div>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, background: "#fff8ea" }}>
          <div style={{ fontSize: 12, color: "#e08e0b" }}>🟡 Amber</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#e08e0b" }}>{data.trafficLightCounts.amber}</div>
        </div>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, background: "#fdeeec" }}>
          <div style={{ fontSize: 12, color: "#c0392b" }}>🔴 Red</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#c0392b" }}>{data.trafficLightCounts.red}</div>
        </div>
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Pending Entry This Period ({data.pendingEntry.length})</h3>
      {data.pendingEntry.map((p) => (
        <div key={p.id} style={{ fontSize: 13, padding: "8px 0", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => navigate(`/admin/kpi-engine/${p.id}`)}>
          {p.name} <span style={{ color: "#999", fontSize: 11 }}>· {p.category} · {p.periodKey}</span>
        </div>
      ))}
      {data.pendingEntry.length === 0 && <p style={{ fontSize: 12, color: "#1a7f37" }}>All active KPIs have an entry for their current period.</p>}
    </div>
  );
}
