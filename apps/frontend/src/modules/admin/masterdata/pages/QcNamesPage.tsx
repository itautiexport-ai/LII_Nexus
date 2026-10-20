import React, { useEffect, useState } from "react";
import { masterDataApi, QcName } from "../api/masterDataApi";

export default function QcNamesPage() {
  const [qcNames, setQcNames] = useState<QcName[]>([]);
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
      const data = await masterDataApi.getQcNames();
      setQcNames(data);
    } catch (err: any) {
      console.error("Failed to load QC names", err);
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
        await masterDataApi.updateQcName(editingId, name.trim());
        setEditingId(null);
      } else {
        await masterDataApi.createQcName(name.trim());
      }
      setName("");
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || `Failed to ${editingId ? "update" : "create"} QC Name.`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item: QcName) {
    setEditingId(item.id);
    setName(item.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this Quality Controller (QC) Name?")) return;
    try {
      await masterDataApi.deleteQcName(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete QC Name.");
    }
  }

  return (
    <div style={styles.container}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={styles.title}>Manage QC Names (Inspectors)</h2>
        <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
          Maintain the official roster of Quality Controllers for Incoming (IQC), In-Process, and Final Quality inspections.
        </p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>{editingId ? "Edit QC Name" : "Add New QC Name"}</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Quality Controller / Inspector Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vipin Sharma"
              required
            />
          </div>
          <div style={styles.btnWrapper}>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update QC Name" : "Add QC Name"}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={styles.cardTitle}>QC Inspector Directory</h3>
          <span style={{ fontSize: 12, background: "#f1f5f9", padding: "4px 10px", borderRadius: 12, fontWeight: 600, color: "#475569" }}>
            {qcNames.length} Registered
          </span>
        </div>

        {loading ? (
          <p style={{ color: "#64748b", fontSize: 14 }}>Loading QC names...</p>
        ) : qcNames.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>No QC names defined yet. Add one above.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>QC Inspector Name</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {qcNames.map((item, idx) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: "#1e293b" }}>{item.name}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <button onClick={() => handleEdit(item)} style={styles.editBtn}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>
                      Delete
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
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 24px",
    fontFamily: "inherit",
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 16px 0",
  },
  form: {
    display: "flex",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  field: {
    flex: 1,
    minWidth: 260,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  btnWrapper: {
    display: "flex",
    gap: 8,
  },
  submitBtn: {
    background: "#4f46e5",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  cancelBtn: {
    background: "#f1f5f9",
    color: "#475569",
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontWeight: 600,
    background: "#f8fafc",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "12px 14px",
    color: "#334155",
  },
  editBtn: {
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #cbd5e1",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    marginRight: 6,
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
};
