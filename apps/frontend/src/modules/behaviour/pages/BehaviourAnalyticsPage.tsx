import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { behaviourApi } from "../api/behaviourApi";

type TabKey = "top" | "bottom" | "improved" | "delayed" | "consistent" | "defaulters" | "delayReasons" | "deptCompare" | "trend";

const TABS: { key: TabKey; label: string }[] = [
  { key: "top", label: "Top Performers" }, { key: "bottom", label: "Bottom Performers" },
  { key: "improved", label: "Most Improved" }, { key: "delayed", label: "Most Delayed" },
  { key: "consistent", label: "Most Consistent" }, { key: "defaulters", label: "Repeat Defaulters" },
  { key: "delayReasons", label: "Repeated Delay Reasons" }, { key: "deptCompare", label: "Department Comparison" },
  { key: "trend", label: "Behaviour Trend" },
];

export default function BehaviourAnalyticsPage() {
  const [tab, setTab] = useState<TabKey>("top");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loaders: Record<TabKey, () => Promise<any>> = {
      top: behaviourApi.topPerformers, bottom: behaviourApi.bottomPerformers, improved: behaviourApi.mostImproved,
      delayed: behaviourApi.mostDelayed, consistent: behaviourApi.mostConsistent, defaulters: behaviourApi.repeatDefaulters,
      delayReasons: behaviourApi.repeatedDelayReasons, deptCompare: behaviourApi.departmentComparison,
      trend: () => behaviourApi.historicalTrend(),
    };
    setData(null);
    loaders[tab]().then(setData);
  }, [tab]);

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Behaviour Analytics</h1>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e0e0e0", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 12px", border: "none", background: "none", borderBottom: tab === t.key ? "2px solid #333" : "2px solid transparent", fontWeight: tab === t.key ? 600 : 400, fontSize: 12 }}>{t.label}</button>
        ))}
      </div>

      {!data && <p style={{ color: "#999" }}>Loading...</p>}

      {data && (tab === "top" || tab === "bottom") && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Employee</th><th style={{ padding: 8 }}>Department</th><th style={{ padding: 8 }}>Index</th></tr></thead>
          <tbody>{data.map((r: any) => (
            <tr key={r.employeeId} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <td style={{ padding: 8 }}>{r.employeeName}</td><td style={{ padding: 8 }}>{r.departmentName ?? "—"}</td><td style={{ padding: 8, fontWeight: 700 }}>{r.overallIndex}%</td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {data && tab === "improved" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Employee</th><th style={{ padding: 8 }}>Improvement Score</th></tr></thead>
          <tbody>{data.map((r: any) => <tr key={r.employeeId} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{r.employeeName}</td><td style={{ padding: 8, fontWeight: 700 }}>{r.improvementScore}</td></tr>)}</tbody>
        </table>
      )}

      {data && tab === "delayed" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Employee</th><th style={{ padding: 8 }}>Delay Frequency Score (lower = more delayed)</th></tr></thead>
          <tbody>{data.map((r: any) => <tr key={r.employeeId} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{r.employeeName}</td><td style={{ padding: 8, fontWeight: 700, color: "#c0392b" }}>{r.delayFrequencyScore}</td></tr>)}</tbody>
        </table>
      )}

      {data && tab === "consistent" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Employee</th><th style={{ padding: 8 }}>Consistency Score</th></tr></thead>
          <tbody>{data.map((r: any) => <tr key={r.employeeId} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{r.employeeName}</td><td style={{ padding: 8, fontWeight: 700 }}>{r.consistencyScore}</td></tr>)}</tbody>
        </table>
      )}

      {data && tab === "defaulters" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Employee</th><th style={{ padding: 8 }}>Occurrences</th><th style={{ padding: 8 }}>Periods Checked</th></tr></thead>
          <tbody>{data.map((r: any) => <tr key={r.employeeId} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{r.employeeName}</td><td style={{ padding: 8, color: "#c0392b", fontWeight: 700 }}>{r.occurrences}</td><td style={{ padding: 8 }}>{r.periodsChecked}</td></tr>)}
          {data.length === 0 && <tr><td colSpan={3} style={{ padding: 16, textAlign: "center", color: "#999" }}>No repeat defaulters found.</td></tr>}</tbody>
        </table>
      )}

      {data && tab === "delayReasons" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Delay Reason</th><th style={{ padding: 8 }}>Occurrences</th></tr></thead>
          <tbody>{data.map((r: any, i: number) => <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{r.reason}</td><td style={{ padding: 8, fontWeight: 700 }}>{r.count}</td></tr>)}
          {data.length === 0 && <tr><td colSpan={2} style={{ padding: 16, textAlign: "center", color: "#999" }}>No factory delay reasons recorded this period.</td></tr>}</tbody>
        </table>
      )}

      {data && tab === "deptCompare" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Department</th><th style={{ padding: 8 }}>Average</th><th style={{ padding: 8 }}>Min</th><th style={{ padding: 8 }}>Max</th><th style={{ padding: 8 }}>Employees</th></tr></thead>
          <tbody>{data.map((r: any) => <tr key={r.departmentName} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}><td style={{ padding: 8 }}>{r.departmentName}</td><td style={{ padding: 8, fontWeight: 700 }}>{r.averageIndex}%</td><td style={{ padding: 8 }}>{r.min}%</td><td style={{ padding: 8 }}>{r.max}%</td><td style={{ padding: 8 }}>{r.employeeCount}</td></tr>)}</tbody>
        </table>
      )}

      {data && tab === "trend" && (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={data.map((d: any) => ({ period: d.periodKey, index: d.averageIndex }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="index" stroke="#4a90d9" strokeWidth={2} connectNulls dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
