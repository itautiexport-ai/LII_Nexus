import { useEffect, useState } from "react";
import { crmApi } from "../api/crmApi";

type TabKey = "ceo" | "merchants" | "leadSource" | "exportDomestic" | "followUpDelay" | "forecastPipeline" | "wonLost";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ceo", label: "CEO CRM" },
  { key: "merchants", label: "Merchant" },
  { key: "leadSource", label: "Lead Source" },
  { key: "exportDomestic", label: "Export vs Domestic" },
  { key: "followUpDelay", label: "Follow-up Delay" },
  { key: "forecastPipeline", label: "Forecast Pipeline" },
  { key: "wonLost", label: "Won / Lost" },
];

export default function CrmDashboardsPage() {
  const [tab, setTab] = useState<TabKey>("ceo");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loaders: Record<TabKey, () => Promise<any>> = {
      ceo: crmApi.ceoDashboard, merchants: crmApi.merchantDashboard, leadSource: crmApi.leadSourceDashboard,
      exportDomestic: crmApi.exportVsDomesticDashboard, followUpDelay: crmApi.followUpDelayDashboard,
      forecastPipeline: crmApi.forecastPipelineDashboard, wonLost: crmApi.wonLostDashboard,
    };
    setData(null);
    loaders[tab]().then(setData);
  }, [tab]);

  return (
    <div style={{ background: "#fff" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16, color: "#222" }}>CRM Dashboards</h1>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e0e0e0", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 14px", border: "none", background: "none", borderBottom: tab === t.key ? "2px solid #333" : "2px solid transparent", fontWeight: tab === t.key ? 600 : 400, fontSize: 13 }}>{t.label}</button>
        ))}
      </div>

      {!data && <p style={{ color: "#999" }}>Loading...</p>}

      {data && tab === "ceo" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16 }}>
            <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>By Status</h3>
            {data.byStatus.map((s: any) => <div key={s.status} style={{ fontSize: 13, padding: "4px 0" }}>{s.status}: <strong>{s.count}</strong> · forecast {s.forecast.toLocaleString()} · weighted {s.weighted.toLocaleString()}</div>)}
          </div>
          <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16 }}>
            <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Active by Category</h3>
            {data.byCategory.map((c: any) => <div key={c.category} style={{ fontSize: 13, padding: "4px 0" }}>{c.category.replace(/_/g, " ")}: <strong>{c.count}</strong></div>)}
          </div>
          <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16 }}>
            <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Overdue Follow-ups</h3>
            <div style={{ fontSize: 28, fontWeight: 700, color: data.overdueFollowUps > 0 ? "#c0392b" : "#1a7f37" }}>{data.overdueFollowUps}</div>
          </div>
        </div>
      )}

      {data && tab === "merchants" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #e0e0e0", fontSize: 12, color: "#666" }}>
            <th style={{ padding: 8 }}>Merchant</th><th style={{ padding: 8 }}>Assigned</th><th style={{ padding: 8 }}>Won</th><th style={{ padding: 8 }}>Lost</th>
            <th style={{ padding: 8 }}>Conversion%</th><th style={{ padding: 8 }}>Weighted Forecast</th><th style={{ padding: 8 }}>Delayed FU</th><th style={{ padding: 8 }}>Score</th>
          </tr></thead>
          <tbody>{data.map((m: any) => (
            <tr key={m.merchantId} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <td style={{ padding: 8 }}>{m.merchantName}</td><td style={{ padding: 8 }}>{m.leadsAssigned}</td><td style={{ padding: 8 }}>{m.wonLeads}</td><td style={{ padding: 8 }}>{m.lostLeads}</td>
              <td style={{ padding: 8 }}>{m.conversionPercent ?? "—"}</td><td style={{ padding: 8 }}>{m.weightedForecastValue.toLocaleString()}</td>
              <td style={{ padding: 8, color: m.delayedFollowUps > 0 ? "#c0392b" : undefined }}>{m.delayedFollowUps}</td>
              <td style={{ padding: 8, fontWeight: 700 }}>{m.merchantScore ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {data && tab === "leadSource" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #e0e0e0", fontSize: 12, color: "#666" }}>
            <th style={{ padding: 8 }}>Source</th><th style={{ padding: 8 }}>Total</th><th style={{ padding: 8 }}>Won</th><th style={{ padding: 8 }}>Lost</th><th style={{ padding: 8 }}>Conversion%</th><th style={{ padding: 8 }}>Weighted Forecast</th>
          </tr></thead>
          <tbody>{data.map((s: any) => (
            <tr key={s.leadSource} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <td style={{ padding: 8, textTransform: "capitalize" }}>{s.leadSource.replace(/_/g, " ")}</td><td style={{ padding: 8 }}>{s.total}</td><td style={{ padding: 8 }}>{s.won}</td><td style={{ padding: 8 }}>{s.lost}</td>
              <td style={{ padding: 8 }}>{s.conversionPercent ?? "—"}</td><td style={{ padding: 8 }}>{s.weightedForecast.toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {data && tab === "exportDomestic" && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {data.map((b: any) => (
            <div key={b.bucket} style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16, minWidth: 220 }}>
              <h3 style={{ fontSize: 14, textTransform: "capitalize", marginBottom: 8 }}>{b.bucket}</h3>
              <p style={{ fontSize: 13 }}>Total: <strong>{b.total}</strong></p>
              <p style={{ fontSize: 13 }}>Won: {b.won} · Lost: {b.lost}</p>
              <p style={{ fontSize: 13 }}>Forecast: {b.forecast.toLocaleString()}</p>
              <p style={{ fontSize: 13 }}>Weighted: {b.weighted.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {data && tab === "followUpDelay" && (
        <div>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Overdue Leads</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #e0e0e0", fontSize: 12, color: "#666" }}>
              <th style={{ padding: 8 }}>Lead</th><th style={{ padding: 8 }}>Merchant</th><th style={{ padding: 8 }}>Due</th><th style={{ padding: 8 }}>Days Overdue</th>
            </tr></thead>
            <tbody>{data.overdueLeads.map((l: any) => (
              <tr key={l.id} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                <td style={{ padding: 8 }}>{l.leadCode} — {l.contactName}</td><td style={{ padding: 8 }}>{l.merchantName ?? "Unassigned"}</td><td style={{ padding: 8 }}>{l.dueDate}</td>
                <td style={{ padding: 8, color: "#c0392b", fontWeight: 700 }}>{l.daysOverdue}</td>
              </tr>
            ))}</tbody>
          </table>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>By Merchant</h3>
          {data.byMerchant.map((m: any) => <div key={m.merchantName} style={{ fontSize: 13, padding: "4px 0" }}>{m.merchantName}: {m.overdue} overdue / {m.total} active</div>)}
        </div>
      )}

      {data && tab === "forecastPipeline" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #e0e0e0", fontSize: 12, color: "#666" }}>
            <th style={{ padding: 8 }}>Stage</th><th style={{ padding: 8 }}>Count</th><th style={{ padding: 8 }}>Forecast</th><th style={{ padding: 8 }}>Weighted</th>
          </tr></thead>
          <tbody>{data.map((s: any) => (
            <tr key={s.salesStage} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <td style={{ padding: 8, textTransform: "capitalize" }}>{s.salesStage.replace(/_/g, " ")}</td><td style={{ padding: 8 }}>{s.count}</td>
              <td style={{ padding: 8 }}>{s.forecast.toLocaleString()}</td><td style={{ padding: 8 }}>{s.weighted.toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {data && tab === "wonLost" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #e0e0e0", fontSize: 12, color: "#666" }}>
            <th style={{ padding: 8 }}>Category</th><th style={{ padding: 8 }}>Source</th><th style={{ padding: 8 }}>Won</th><th style={{ padding: 8 }}>Lost</th><th style={{ padding: 8 }}>Won Value</th>
          </tr></thead>
          <tbody>{data.map((r: any, i: number) => (
            <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <td style={{ padding: 8, textTransform: "capitalize" }}>{r.leadCategory.replace(/_/g, " ")}</td><td style={{ padding: 8, textTransform: "capitalize" }}>{r.leadSource.replace(/_/g, " ")}</td>
              <td style={{ padding: 8 }}>{r.won}</td><td style={{ padding: 8 }}>{r.lost}</td><td style={{ padding: 8 }}>{r.wonValue.toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
