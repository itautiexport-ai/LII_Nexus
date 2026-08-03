import React, { useState, useEffect, useRef } from "react";
import { masterDataApi } from "../api/masterDataApi";
import { axiosInstance } from "../../../../services/api/axiosInstance";

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await masterDataApi.getBuyers();
      setBuyers(data);
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
        await masterDataApi.updateBuyer(editingId, form.name);
      } else {
        await masterDataApi.createBuyer(form.name);
      }
      setForm({ name: "" });
      setEditingId(null);
      loadData();
    } catch (e) {
      alert("Error saving Buyer");
    }
  };

  const handleEdit = (buyer: any) => {
    setForm({ name: buyer.name });
    setEditingId(buyer.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await masterDataApi.deleteBuyer(id);
      loadData();
    } catch (e) {
      alert("Error deleting");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      await axiosInstance.post("/buyers/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Imported successfully");
      loadData();
    } catch (err) {
      alert("Error importing from Excel");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600 }}>Manage Buyers</h2>
        <div>
          <input type="file" accept=".xlsx, .xls" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: "8px 16px", background: "#10b981", color: "#fff", borderRadius: 4, cursor: "pointer", border: "none" }}>
            Import Excel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <input 
          placeholder="Buyer Name" 
          value={form.name} 
          onChange={e => setForm({ name: e.target.value })}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #ccc", borderRadius: 4 }}
        />
        <button type="submit" style={{ padding: "8px 16px", background: "#333", color: "#fff", borderRadius: 4, cursor: "pointer", border: "none" }}>
          {editingId ? "Update" : "Add Buyer"}
        </button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: "" }); }} style={{ padding: "8px 16px", background: "#f1f1f1", borderRadius: 4, cursor: "pointer", border: "none" }}>Cancel</button>}
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: 12, fontWeight: 600, color: "#555" }}>Buyer Name</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#555", width: 150 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {buyers.map(b => (
            <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 12 }}>{b.name}</td>
              <td style={{ padding: 12, display: "flex", gap: 8 }}>
                <button onClick={() => handleEdit(b)} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                <button onClick={() => handleDelete(b.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
              </td>
            </tr>
          ))}
          {buyers.length === 0 && (
            <tr><td colSpan={2} style={{ padding: 24, textAlign: "center", color: "#777" }}>No buyers found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
