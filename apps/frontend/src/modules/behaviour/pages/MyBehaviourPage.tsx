import { useEffect, useState } from "react";
import { behaviourApi, BehaviourIndexResult } from "../api/behaviourApi";

export default function MyBehaviourPage() {
  const [result, setResult] = useState<BehaviourIndexResult | null>(null);

  useEffect(() => { behaviourApi.myIndex().then(setResult); }, []);

  if (!result) return <p>Loading...</p>;

  const color = result.overallIndex === null ? "#999" : result.overallIndex >= 80 ? "#1a7f37" : result.overallIndex >= 50 ? "#e08e0b" : "#c0392b";

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>My Behaviour Index</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 20 }}>Measures how you work — consistency, discipline, and delay patterns — separately from your performance score.</p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 20, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Overall Index</div>
          <div style={{ fontSize: 40, fontWeight: 700, color }}>{result.overallIndex !== null ? `${result.overallIndex}%` : "—"}</div>
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Component Breakdown</h3>
          {result.components.map((c) => (
            <div key={c.componentKey} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <span>{c.label} <span style={{ color: "#999" }}>({c.weightUsed}%)</span></span>
              <strong>{c.rawScore !== null ? `${c.rawScore}%` : "n/a"}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
