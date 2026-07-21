import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { kpiEngineApi, KpiDefinitionRecord, KpiEntryRecord, CATEGORY_LABELS } from "../api/kpiEngineApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const trafficColors: Record<string, string> = { red: "#c0392b", amber: "#e08e0b", green: "#1a7f37" };

export default function KpiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [definition, setDefinition] = useState<KpiDefinitionRecord | null>(null);
  const [history, setHistory] = useState<KpiEntryRecord[]>([]);
  const [entryForm, setEntryForm] = useState({ target: "", actual: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const [def, hist] = await Promise.all([kpiEngineApi.getDefinition(id), kpiEngineApi.getHistory(id, 12)]);
    setDefinition(def);
    setHistory(hist);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on route param change
  useEffect(() => { load(); }, [id]);

  async function handleRecordEntry(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    try {
      await kpiEngineApi.recordEntry(id, Number(entryForm.target), Number(entryForm.actual));
      setEntryForm({ target: "", actual: "" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to record entry.");
    }
  }

  if (!definition) return <p>Loading...</p>;

  const latest = history[history.length - 1];
  const chartData = history.map((h) => ({ period: h.periodKey, score: h.computedScore }));

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>{definition.name}</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
        {CATEGORY_LABELS[definition.category]} · {definition.frequency} · weight {definition.weightage}% ·
        formula <code style={{ background: "#f0f0f0", padding: "2px 4px", borderRadius: 3 }}>{definition.formula}</code>
      </p>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: "#888" }}>Latest Score</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: latest ? trafficColors[latest.trafficLight ?? ""] : "#999" }}>
            {latest?.computedScore ?? "—"}
          </div>
          {latest?.trafficLight && (
            <div style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: trafficColors[latest.trafficLight], marginTop: 4 }} />
          )}
        </div>

        <PermissionGate permission="kpiengine.entry.manage">
          <form onSubmit={handleRecordEntry} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Record This Period's Target &amp; Actual</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input required type="number" step="any" placeholder="Target" value={entryForm.target} onChange={(e) => setEntryForm({ ...entryForm, target: e.target.value })} style={{ padding: 6, width: 100 }} />
              <input required type="number" step="any" placeholder="Actual" value={entryForm.actual} onChange={(e) => setEntryForm({ ...entryForm, actual: e.target.value })} style={{ padding: 6, width: 100 }} />
              <button type="submit">Save</button>
            </div>
          </form>
        </PermissionGate>
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Trend</h3>
      <div style={{ width: "100%", height: 240, marginBottom: 24 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" fontSize={11} />
            <YAxis domain={[0, 100]} fontSize={11} />
            <Tooltip />
            <ReferenceLine y={definition.greenThreshold} stroke="#1a7f37" strokeDasharray="4 4" />
            <ReferenceLine y={definition.amberThreshold} stroke="#e08e0b" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="score" stroke="#4a90d9" strokeWidth={2} connectNulls dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>History</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Period</th><th style={{ padding: 8 }}>Target</th><th style={{ padding: 8 }}>Actual</th><th style={{ padding: 8 }}>Score</th><th style={{ padding: 8 }}>Status</th></tr></thead>
        <tbody>
          {[...history].reverse().map((h) => (
            <tr key={h.id} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <td style={{ padding: 8 }}>{h.periodKey}</td><td style={{ padding: 8 }}>{h.target}</td><td style={{ padding: 8 }}>{h.actual}</td>
              <td style={{ padding: 8, fontWeight: 700 }}>{h.computedScore ?? "—"}</td>
              <td style={{ padding: 8 }}>{h.trafficLight && <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: trafficColors[h.trafficLight] }} />}</td>
            </tr>
          ))}
          {history.length === 0 && <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#999" }}>No entries recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
