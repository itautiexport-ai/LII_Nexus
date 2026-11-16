import React, { useState, useEffect } from "react";
import { masterDataApi, Factory } from "../api/masterDataApi";

export default function FactoriesPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", code: "", status: "active" as "active" | "inactive" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await masterDataApi.getFactories();
      setFactories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Please enter a factory name");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await masterDataApi.updateFactory(editingId, form.name.trim(), form.code.trim(), form.status);
      } else {
        await masterDataApi.createFactory(form.name.trim(), form.code.trim() || undefined);
      }
      setForm({ name: "", code: "", status: "active" });
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error saving factory");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (f: Factory) => {
    setForm({ name: f.name, code: f.code || "", status: f.status || "active" });
    setEditingId(f.id);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete factory "${name}"?`)) return;
    try {
      await masterDataApi.deleteFactory(id);
      loadData();
    } catch (e) {
      alert("Error deleting factory");
    }
  };

  const filteredFactories = factories.filter((f) => {
    const q = search.toLowerCase();
    return f.name.toLowerCase().includes(q) || (f.code && f.code.toLowerCase().includes(q));
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
            🏭 Factory Master
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Manage organizational factory locations and units (connected to Factory Documents and other modules).
          </p>
        </div>
      </div>

      {/* Add / Edit Form Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          marginBottom: 32,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 16px 0" }}>
          {editingId ? "✏️ Edit Factory" : "➕ Add New Factory"}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 14, alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Factory Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. LII, LIE, Laxmi Joy LLP"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Short Code
            </label>
            <input
              type="text"
              placeholder="e.g. LII, LJLLP"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {editingId && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 20px",
                background: editingId ? "#2563eb" : "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
            >
              {saving ? "Saving..." : editingId ? "Update Factory" : "Save Factory"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", code: "", status: "active" });
                }}
                style={{
                  padding: "10px 14px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
            Factories List ({filteredFactories.length})
          </div>
          <input
            type="text"
            placeholder="Search factories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 13,
              width: 220,
              outline: "none",
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>Loading factories...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                  Factory Name
                </th>
                <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                  Short Code
                </th>
                <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFactories.map((f) => (
                <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}>
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                    🏢 {f.name}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b" }}>
                    {f.code ? <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>{f.code}</span> : "—"}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: f.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: f.status === "active" ? "#166534" : "#991b1b",
                      }}
                    >
                      {f.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(f)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        marginRight: 14,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id, f.name)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFactories.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                    No factories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

