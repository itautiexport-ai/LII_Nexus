import { useEffect, useState } from "react";
import { behaviourApi, BehaviourComponentRecord } from "../api/behaviourApi";

export default function BehaviourComponentsPage() {
  const [components, setComponents] = useState<BehaviourComponentRecord[]>([]);

  async function load() { setComponents(await behaviourApi.listComponents()); }
  useEffect(() => { load(); }, []);

  const totalWeight = components.filter((c) => c.status === "active").reduce((s, c) => s + c.weight, 0);

  async function handleWeightChange(c: BehaviourComponentRecord, weight: number) {
    await behaviourApi.updateComponent(c.id, { weight });
    await load();
  }

  async function handleToggle(c: BehaviourComponentRecord) {
    await behaviourApi.updateComponent(c.id, { status: c.status === "active" ? "inactive" : "active" });
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Behaviour Index Components</h1>
      <p style={{ fontSize: 13, color: totalWeight === 100 ? "#777" : "#a66", marginBottom: 16 }}>
        Active component weights total {totalWeight}%. The Behaviour Index renormalizes over whichever components have data each period, so this doesn't have to be exactly 100%.
      </p>

      {components.map((c) => (
        <div key={c.id} style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 12, marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 13 }}>{c.label}</strong>
            <p style={{ fontSize: 11, color: "#999", margin: "4px 0 0" }}>{c.description}</p>
          </div>
          <input type="number" min={0} max={100} value={c.weight} onChange={(e) => handleWeightChange(c, Number(e.target.value))} style={{ width: 70, padding: 6 }} />%
          <button onClick={() => handleToggle(c)}>{c.status === "active" ? "Deactivate" : "Activate"}</button>
        </div>
      ))}
    </div>
  );
}
