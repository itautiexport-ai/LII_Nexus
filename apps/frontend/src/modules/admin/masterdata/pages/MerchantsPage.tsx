import { useEffect, useState } from "react";
import { merchantsApi, MerchantRecord } from "../api/merchantsApi";

export default function MerchantsPage() {
  const [items, setItems] = useState<MerchantRecord[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");

  async function load() {
    const data = await merchantsApi.list();
    setItems(data);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    const name = prompt("Enter new merchant name:");
    if (!name) return;
    try {
      await merchantsApi.create(name);
      await load();
    } catch (err) {
      alert("Failed to create merchant");
    }
  }

  async function handleSave() {
    if (!editing || !editName) return;
    try {
      await merchantsApi.update(editing, editName, editStatus);
      setEditing(null);
      await load();
    } catch (err) {
      alert("Failed to update merchant");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this merchant?")) return;
    try {
      await merchantsApi.remove(id);
      await load();
    } catch (err) {
      alert("Failed to delete merchant");
    }
  }

  return (
    <div style={{ background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, color: "#222" }}>Master Data — Merchants</h1>
        <button onClick={handleAdd}>Add Merchant</button>
      </div>

      <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#f7f7f8", borderBottom: "1px solid #e0e0e0" }}>
              <th style={{ padding: 12, fontSize: 13, color: "#666" }}>Name</th>
              <th style={{ padding: 12, fontSize: 13, color: "#666" }}>Status</th>
              <th style={{ padding: 12, fontSize: 13, color: "#666" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: 12, fontSize: 14 }}>
                  {editing === it.id ? (
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: 6, border: "1px solid #ccc", borderRadius: 4, width: "100%", maxWidth: 300 }} />
                  ) : (
                    <div style={{ fontWeight: 500, color: it.status === "inactive" ? "#999" : "inherit" }}>{it.name}</div>
                  )}
                </td>
                <td style={{ padding: 12, fontSize: 14 }}>
                  {editing === it.id ? (
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} style={{ padding: 6, border: "1px solid #ccc", borderRadius: 4 }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : (
                    <span style={{ color: it.status === "active" ? "#1a7f37" : "#c0392b", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>{it.status}</span>
                  )}
                </td>
                <td style={{ padding: 12, width: 140 }}>
                  {editing === it.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleSave} style={{ padding: "4px 8px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Save</button>
                      <button onClick={() => setEditing(null)} style={{ padding: "4px 8px", background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditing(it.id); setEditName(it.name); setEditStatus(it.status); }} style={{ padding: "4px 8px", background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => handleDelete(it.id)} style={{ padding: "4px 8px", background: "#fee", color: "#c0392b", border: "none", borderRadius: 4, cursor: "pointer" }}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} style={{ padding: 20, textAlign: "center", color: "#999" }}>No merchants defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
