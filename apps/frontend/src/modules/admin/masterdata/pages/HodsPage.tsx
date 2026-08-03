import React, { useEffect, useState } from "react";
import { masterDataApi, Hod } from "../api/masterDataApi";

export default function HodsPage() {
  const [hods, setHods] = useState<Hod[]>([]);
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
      const data = await masterDataApi.getHods();
      setHods(data);
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
        await masterDataApi.updateHod(editingId, name.trim());
        setEditingId(null);
      } else {
        await masterDataApi.createHod(name.trim());
      }
      setName("");
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || `Failed to ${editingId ? "update" : "create"} HOD.`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(hod: Hod) {
    setEditingId(hod.id);
    setName(hod.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this HOD Name?")) return;
    try {
      await masterDataApi.deleteHod(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete HOD. It might be in use.");
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manage HOD Names</h2>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>{editingId ? "Edit HOD Name" : "Add New HOD Name"}</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>HOD Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>
          <div style={styles.btnWrapper}>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update HOD Name" : "Add HOD Name"}
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
        <h3 style={styles.cardTitle}>Existing HOD Names</h3>
        {loading ? (
          <p>Loading...</p>
        ) : hods.length === 0 ? (
          <p>No HODs found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hods.map(h => (
                <tr key={h.id} style={styles.tr}>
                  <td style={styles.td}>{h.name}</td>
                  <td style={styles.td}>
                    <button type="button" onClick={() => handleEdit(h)} style={styles.editBtn} title="Edit HOD">
                      ✏️
                    </button>
                    <button type="button" onClick={() => handleDelete(h.id)} style={styles.deleteBtn} title="Delete">
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
  table: { width: "100%", borderCollapse: "collapse" },
  trHead: { background: "#f3f4f6" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#4b5563", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #e5e7eb" },
  td: { padding: "12px 16px", fontSize: 14, color: "#111827" },
  editBtn: { background: "none", border: "none", cursor: "pointer", marginRight: 12 },
  deleteBtn: { background: "none", border: "none", cursor: "pointer" },
};
