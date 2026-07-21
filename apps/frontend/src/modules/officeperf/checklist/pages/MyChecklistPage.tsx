import { useEffect, useState } from "react";
import { checklistApi, ChecklistInstanceRecord } from "../api/checklistApi";

export default function MyChecklistPage() {
  const [instances, setInstances] = useState<ChecklistInstanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setInstances(await checklistApi.getMyChecklists());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleToggle(instance: ChecklistInstanceRecord, itemId: string, checked: boolean) {
    const updated = await checklistApi.setItemChecked(instance.id, itemId, checked);
    setInstances((prev) => prev.map((i) => (i.id === instance.id ? updated : i)));
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>My Checklists</h1>
      {instances.length === 0 && <p style={{ color: "#777" }}>No checklists assigned to you yet.</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {instances.map((instance) => {
          const doneCount = instance.items.filter((i) => i.isChecked).length;
          return (
            <div key={instance.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, width: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>{instance.templateTitle}</strong>
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "#999" }}>{instance.frequency}</span>
              </div>
              <p style={{ fontSize: 12, color: "#777", marginBottom: 8 }}>{instance.periodStart} – {instance.periodEnd} · {doneCount}/{instance.items.length} done</p>
              {instance.items.map((item) => (
                <label key={item.id} style={{ display: "block", fontSize: 14, marginBottom: 6 }}>
                  <input type="checkbox" checked={item.isChecked} onChange={(e) => handleToggle(instance, item.id, e.target.checked)} /> {item.label}
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
