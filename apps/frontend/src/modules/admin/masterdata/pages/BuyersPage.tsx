import React, { useState, useEffect, useRef } from "react";
import { masterDataApi, Buyer } from "../api/masterDataApi";
import { axiosInstance } from "../../../../services/api/axiosInstance";

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", buyer_code: "", alias_name: "" });
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
    if (!form.name.trim()) return;
    try {
      const payload = {
        name: form.name.trim(),
        buyer_code: form.buyer_code.trim() || null,
        alias_name: form.alias_name.trim() || null,
      };
      if (editingId) {
        await masterDataApi.updateBuyer(editingId, payload);
      } else {
        await masterDataApi.createBuyer(payload);
      }
      setForm({ name: "", buyer_code: "", alias_name: "" });
      setEditingId(null);
      loadData();
    } catch (e) {
      alert("Error saving Buyer");
    }
  };

  const handleEdit = (buyer: Buyer) => {
    setForm({
      name: buyer.name || "",
      buyer_code: buyer.buyer_code || "",
      alias_name: buyer.alias_name || "",
    });
    setEditingId(buyer.id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: "", buyer_code: "", alias_name: "" });
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

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600 }}>Manage Buyers</h2>
        <div>
          <input type="file" accept=".xlsx, .xls" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: "8px 16px", background: "#10b981", color: "#fff", borderRadius: 6, cursor: "pointer", border: "none", fontWeight: 600 }}>
            Import Excel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
        <input 
          placeholder="Buyer Name *" 
          required
          value={form.name} 
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          style={{ flex: "2 1 200px", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
        />
        <input 
          placeholder="Buyer Code" 
          value={form.buyer_code} 
          onChange={e => setForm(prev => ({ ...prev, buyer_code: e.target.value }))}
          style={{ flex: "1 1 140px", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
        />
        <input 
          placeholder="Alias Name" 
          value={form.alias_name} 
          onChange={e => setForm(prev => ({ ...prev, alias_name: e.target.value }))}
          style={{ flex: "1.5 1 160px", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
        />
        <button type="submit" style={{ padding: "9px 18px", background: "#1e293b", color: "#fff", borderRadius: 6, cursor: "pointer", border: "none", fontWeight: 600 }}>
          {editingId ? "Update Buyer" : "Add Buyer"}
        </button>
        {editingId && (
          <button type="button" onClick={handleCancel} style={{ padding: "9px 16px", background: "#f1f5f9", color: "#475569", borderRadius: 6, cursor: "pointer", border: "1px solid #cbd5e1", fontWeight: 500 }}>
            Cancel
          </button>
        )}
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
            <th style={{ padding: 12, fontWeight: 600, color: "#475569" }}>Buyer Name</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#475569" }}>Buyer Code</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#475569" }}>Alias Name</th>
            <th style={{ padding: 12, fontWeight: 600, color: "#475569", width: 140 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {buyers.map(b => (
            <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: 12, fontWeight: 600, color: "#1e293b" }}>{b.name}</td>
              <td style={{ padding: 12, color: "#334155" }}>
                {b.buyer_code ? (
                  <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
                    {b.buyer_code}
                  </span>
                ) : (
                  <span style={{ color: "#94a3b8" }}>—</span>
                )}
              </td>
              <td style={{ padding: 12, color: "#475569" }}>{b.alias_name || <span style={{ color: "#94a3b8" }}>—</span>}</td>
              <td style={{ padding: 12, display: "flex", gap: 10 }}>
                <button onClick={() => handleEdit(b)} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(b.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {buyers.length === 0 && (
            <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>No buyers found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
