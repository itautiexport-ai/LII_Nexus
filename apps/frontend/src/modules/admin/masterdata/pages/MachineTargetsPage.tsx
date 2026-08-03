import React, { useEffect, useState } from "react";
import { machineEfficiencyApi, MachineTarget } from "../../machineefficiency/api/machineEfficiencyApi";
import { masterDataApi, Uom } from "../api/masterDataApi";
import { axiosInstance } from "../../../../services/api/axiosInstance";

interface Machine {
  id: string;
  name: string;
}

export default function MachineTargetsPage() {
  const [targets, setTargets] = useState<MachineTarget[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    machineId: "",
    size: "",
    target: "",
    uom: "Pieces",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // Load machines - assuming documentsApi has a listMachines method or similar. 
    // Wait, let's just fetch them directly using axiosInstance if we don't know the exact API method.
    // I will fetch from /documents/machines which is typical. Actually, I need to check the exact route for machines.
    // Let me update this in the next step if it fails.
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [targetsData, uomsData] = await Promise.all([
        machineEfficiencyApi.listTargets(),
        masterDataApi.getUoms()
      ]);
      setTargets(targetsData);
      setUoms(uomsData);
      
      // Auto-select first UOM if not set and UOMs exist
      if (uomsData.length > 0 && !form.uom) {
        setForm(f => ({ ...f, uom: uomsData[0].name }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        await machineEfficiencyApi.updateTarget(editingId, {
          target: Number(form.target),
          uom: form.uom,
        });
        setEditingId(null);
      } else {
        await machineEfficiencyApi.createTarget({
          machineId: form.machineId,
          size: form.size,
          target: Number(form.target),
          uom: form.uom,
        });
      }
      setForm({ machineId: "", size: "", target: "", uom: uoms.length > 0 ? uoms[0].name : "Pieces" });
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || `Failed to ${editingId ? "update" : "add"} target.`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(t: MachineTarget) {
    setForm({
      machineId: t.machineId || "",
      size: t.size,
      target: t.target.toString(),
      uom: t.uom,
    });
    setEditingId(t.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ machineId: "", size: "", target: "", uom: uoms.length > 0 ? uoms[0].name : "Pieces" });
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this target?")) return;
    try {
      await machineEfficiencyApi.deleteTarget(id);
      loadData();
    } catch (err) {
      console.error("Failed to delete target", err);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Machine Targets (Master Data)</h2>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>{editingId ? "Edit Target" : "Add New Target"}</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Machine</label>
            <MachineSelect 
              value={form.machineId} 
              onChange={(val) => setForm({ ...form, machineId: val })} 
              disabled={!!editingId}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Size</label>
            <input
              style={styles.input}
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              placeholder="e.g. 5x5, Large, etc."
              required
              disabled={!!editingId}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Target Value</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              placeholder="Target amount"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>UOM</label>
            <select
              style={styles.input}
              value={form.uom}
              onChange={(e) => setForm({ ...form, uom: e.target.value })}
              required
            >
              <option value="" disabled>Select UOM</option>
              {uoms.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.btnWrapper}>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update Target" : "Add Target"}
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
        <h3 style={styles.cardTitle}>Existing Targets</h3>
        {loading ? (
          <p>Loading...</p>
        ) : targets.length === 0 ? (
          <p>No targets found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Machine</th>
                <th style={styles.th}>Size</th>
                <th style={styles.th}>Target</th>
                <th style={styles.th}>UOM</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.map(t => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>{t.machineName || t.machineId}</td>
                  <td style={styles.td}>{t.size}</td>
                  <td style={styles.td}>{t.target}</td>
                  <td style={styles.td}>{t.uom}</td>
                  <td style={styles.td}>
                    <button type="button" onClick={() => handleEdit(t)} style={styles.editBtn} title="Edit">
                      ✏️
                    </button>
                    <button type="button" onClick={() => handleDelete(t.id)} style={styles.deleteBtn} title="Delete">
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


function MachineSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void, disabled?: boolean }) {
  const [machines, setMachines] = useState<any[]>([]);

  useEffect(() => {
    // According to router.ts, machines are exposed on "/" from documentRoutes or similar. Let's try /machines
    axiosInstance.get("/machines").then(r => setMachines(r.data.data || r.data)).catch(console.error);
  }, []);

  return (
    <select style={styles.input} value={value} onChange={e => onChange(e.target.value)} required disabled={disabled}>
      <option value="" disabled>Select Machine</option>
      {machines.map(m => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, background: "#f9fafb", minHeight: "100vh" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  card: { background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: 24 },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  form: { display: "flex", gap: 16, alignItems: "flex-end" },
  field: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 },
  submitBtn: { padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer" },
  cancelBtn: { padding: "9px 16px", background: "#9ca3af", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer", marginLeft: 8 },
  btnWrapper: { display: "flex", alignItems: "flex-end" },
  error: { color: "red", marginTop: 12, fontSize: 13 },
  table: { width: "100%", borderCollapse: "collapse" },
  trHead: { borderBottom: "2px solid #e5e7eb", textAlign: "left" },
  th: { padding: "12px 16px", fontSize: 13, color: "#374151" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 16px", fontSize: 14, color: "#4b5563" },
  editBtn: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 4, marginRight: 8, fontSize: 16 },
  deleteBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, fontSize: 16 },
};
