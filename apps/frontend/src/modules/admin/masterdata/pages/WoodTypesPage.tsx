import React, { useState, useEffect } from "react";
import { masterDataApi, WoodType } from "../api/masterDataApi";

export default function WoodTypesPage() {
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await masterDataApi.getWoodTypes();
      setWoodTypes(data);
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
        await masterDataApi.updateWoodType(editingId, form.name, "active"); // simplified
      } else {
        await masterDataApi.createWoodType(form.name);
      }
      setForm({ name: "" });
      setEditingId(null);
      loadData();
    } catch (e) {
      alert("Error saving Wood Type");
    }
  };

  const handleEdit = (wt: WoodType) => {
    setForm({ name: wt.name });
    setEditingId(wt.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await masterDataApi.deleteWoodType(id);
      loadData();
    } catch (e) {
      alert("Error deleting");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Manage Wood Types</h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <input 
          placeholder="Wood Type Name" 
          value={form.name} 
          onChange={e => setForm({ name: e.target.value })}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #ccc", borderRadius: 4 }}
        />
        <button type="submit" style={{ padding: "8px 16px", background: "#333", color: "#fff", borderRadius: 4, cursor: "pointer" }}>
          {editingId ? "Update" : "Add Wood Type"}
        </button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: "" }); }} style={{ padding: "8px 16px", background: "#f1f1f1", borderRadius: 4, cursor: "pointer" }}>Cancel</button>}
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: 12, fontWeight: 600, color: "#555" }}>Name</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#555", width: 100 }}>Status</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#555", width: 150 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {woodTypes.map(wt => (
            <tr key={wt.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 12 }}>{wt.name}</td>
              <td style={{ padding: 12 }}>
                <span style={{ padding: "4px 8px", background: wt.status === "active" ? "#dcfce7" : "#fee2e2", color: wt.status === "active" ? "#166534" : "#991b1b", borderRadius: 12, fontSize: 12 }}>
                  {wt.status}
                </span>
              </td>
              <td style={{ padding: 12, display: "flex", gap: 8 }}>
                <button onClick={() => handleEdit(wt)} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                <button onClick={() => handleDelete(wt.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
              </td>
            </tr>
          ))}
          {woodTypes.length === 0 && (
            <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: "#777" }}>No wood types found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
