import React, { useEffect, useState } from "react";
import { masterDataApi, Uom } from "../api/masterDataApi";

export default function UomsPage() {
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await masterDataApi.getUoms();
      setUoms(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        await masterDataApi.updateUom(editingId, name.trim());
        setEditingId(null);
      } else {
        await masterDataApi.createUom(name.trim());
      }
      setName("");
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || `Failed to ${editingId ? "update" : "create"} UOM.`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(uom: Uom) {
    setEditingId(uom.id);
    setName(uom.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this UOM?")) return;
    try {
      await masterDataApi.deleteUom(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete UOM. It might be in use.");
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manage UOMs</h2>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>{editingId ? "Edit UOM" : "Add New UOM"}</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>UOM Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Liters, Bags, Dozens..."
              required
            />
          </div>
          <div style={styles.btnWrapper}>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update UOM" : "Add UOM"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={styles.cancelBtn} disabled={submitting}>
                Cancel
              </button>
            )}
          </div>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Existing UOMs</h3>
        {loading ? (
          <p>Loading...</p>
        ) : uoms.length === 0 ? (
          <p>No UOMs found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uoms.map(u => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>{u.name}</td>
                  <td style={styles.td}>
                    <button type="button" onClick={() => handleEdit(u)} style={styles.editBtn} title="Edit UOM">
                      ✏️
                    </button>
                    <button type="button" onClick={() => handleDelete(u.id)} style={styles.deleteBtn} title="Delete">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, background: "#f9fafb", minHeight: "100vh" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  card: { background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: 24 },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  form: { display: "flex", gap: 16, alignItems: "flex-end", maxWidth: 500 },
  field: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 },
  submitBtn: { padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer" },
  cancelBtn: { padding: "9px 16px", background: "#9ca3af", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer", marginLeft: 8 },
  btnWrapper: { display: "flex", alignItems: "flex-end" },
  error: { color: "red", marginTop: 12, fontSize: 13 },
  table: { width: "100%", borderCollapse: "collapse", maxWidth: 600 },
  trHead: { borderBottom: "2px solid #e5e7eb", textAlign: "left" },
  th: { padding: "12px 16px", fontSize: 13, color: "#374151" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 16px", fontSize: 14, color: "#4b5563" },
  editBtn: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 4, marginRight: 8, fontSize: 16 },
  deleteBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, fontSize: 16 },
};
