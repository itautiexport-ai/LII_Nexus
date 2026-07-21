import { useEffect, useState } from "react";
import { behaviourApi, GeneratedInsightRecord, InsightRuleRecord } from "../api/behaviourApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const severityColors: Record<string, string> = { info: "#4a90d9", warning: "#e08e0b", critical: "#c0392b" };

export default function InsightsPage() {
  const [insights, setInsights] = useState<GeneratedInsightRecord[]>([]);
  const [rules, setRules] = useState<InsightRuleRecord[]>([]);
  const [narrative, setNarrative] = useState("");

  async function load() {
    const [insightList, ruleList] = await Promise.all([behaviourApi.listInsights(), behaviourApi.listInsightRules()]);
    setInsights(insightList);
    setRules(ruleList);
  }
  useEffect(() => { load(); }, []);

  async function handleRun() {
    await behaviourApi.runInsights();
    await load();
  }

  async function handleNarrative() {
    setNarrative(await behaviourApi.narrativeSummary());
  }

  async function handleRuleChange(rule: InsightRuleRecord, changes: Partial<{ thresholdValue: number; enabled: boolean }>) {
    await behaviourApi.updateInsightRule(rule.ruleKey, changes);
    await load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontSize: 20 }}>Executive Insights</h1>
        <PermissionGate permission="behaviour.insight.run">
          <button onClick={handleRun}>Run Insights Engine</button>
        </PermissionGate>
      </div>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
        Rule-based findings only — no AI is called here. This is deliberately built as the seam a future OpenAI connection
        would plug into; today it just concatenates the findings below into plain text.
      </p>

      {insights.map((i) => (
        <div key={i.id} style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 12, marginBottom: 8, borderLeft: `4px solid ${severityColors[i.severity]}` }}>
          <span style={{ fontSize: 13 }}>{i.message}</span>
          <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{i.ruleKey} · {new Date(i.generatedAt).toLocaleString()}</div>
        </div>
      ))}
      {insights.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>No insights generated for this period yet — try "Run Insights Engine."</p>}

      <button onClick={handleNarrative} style={{ marginTop: 8 }}>Generate Narrative Summary</button>
      {narrative && <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, background: "#f7f7f8", padding: 12, borderRadius: 6, marginTop: 8 }}>{narrative}</pre>}

      <h2 style={{ fontSize: 16, marginTop: 32, marginBottom: 12 }}>Insight Rule Configuration</h2>
      {rules.map((r) => (
        <div key={r.ruleKey} style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 12, marginBottom: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <strong style={{ minWidth: 200 }}>{r.label}</strong>
          <PermissionGate permission="behaviour.insight.manage">
            <label style={{ fontSize: 12 }}>Threshold
              <input type="number" value={r.thresholdValue} onChange={(e) => handleRuleChange(r, { thresholdValue: Number(e.target.value) })} style={{ display: "block", padding: 4, width: 80, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <input type="checkbox" checked={r.enabled} onChange={(e) => handleRuleChange(r, { enabled: e.target.checked })} /> Enabled
            </label>
          </PermissionGate>
          <span style={{ fontSize: 11, color: "#999" }}>{r.description}</span>
        </div>
      ))}
    </div>
  );
}
