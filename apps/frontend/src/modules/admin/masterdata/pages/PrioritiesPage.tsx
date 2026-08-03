import React, { useState, useEffect } from "react";
import { masterDataApi, Priority } from "../api/masterDataApi";

export default function PrioritiesPage() {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", colorCode: "#cccccc" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await masterDataApi.getPriorities();
      setPriorities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      if (editingId) {
        await masterDataApi.updatePriority(editingId, form.name, form.colorCode, "active");
      } else {
        await masterDataApi.createPriority(form.name, form.colorCode);
      }
      setForm({ name: "", colorCode: "#cccccc" });
      setEditingId(null);
      loadData();
    } catch (e) {
      alert("Error saving Priority");
    }
  };

  const handleEdit = (p: Priority) => {
    setForm({ name: p.name, colorCode: p.colorCode });
    setEditingId(p.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await masterDataApi.deletePriority(id);
      loadData();
    } catch (e) {
      alert("Error deleting");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Manage Priorities</h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <input 
          placeholder="Priority Name (e.g. low, high)" 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #ccc", borderRadius: 4 }}
        />
        <input 
          type="color" 
          value={form.colorCode} 
          onChange={e => setForm({ ...form, colorCode: e.target.value })}
          style={{ width: 50, height: 40, padding: 2, cursor: "pointer" }}
        />
        <button type="submit" style={{ padding: "8px 16px", background: "#333", color: "#fff", borderRadius: 4, cursor: "pointer" }}>
          {editingId ? "Update" : "Add Priority"}
        </button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: "", colorCode: "#cccccc" }); }} style={{ padding: "8px 16px", background: "#f1f1f1", borderRadius: 4, cursor: "pointer" }}>Cancel</button>}
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: 12, fontWeight: 600, color: "#555" }}>Name</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#555" }}>Color</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#555", width: 100 }}>Status</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#555", width: 150 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {priorities.map(p => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 12, textTransform: "capitalize", fontWeight: 600, color: p.colorCode }}>{p.name}</td>
              <td style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: p.colorCode }}></div>
                  {p.colorCode}
                </div>
              </td>
              <td style={{ padding: 12 }}>
                <span style={{ padding: "4px 8px", background: p.status === "active" ? "#dcfce7" : "#fee2e2", color: p.status === "active" ? "#166534" : "#991b1b", borderRadius: 12, fontSize: 12 }}>
                  {p.status}
                </span>
              </td>
              <td style={{ padding: 12, display: "flex", gap: 8 }}>
                <button onClick={() => handleEdit(p)} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                <button onClick={() => handleDelete(p.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
              </td>
            </tr>
          ))}
          {priorities.length === 0 && (
            <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#777" }}>No priorities found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
