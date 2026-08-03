import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { machineEfficiencyApi, MachineTarget } from "../api/machineEfficiencyApi";
import { axiosInstance } from "../../../../services/api/axiosInstance";

export default function AddMachineEfficiencyPage() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [machineTargets, setMachineTargets] = useState<MachineTarget[]>([]);

  const [form, setForm] = useState({
    departmentId: "",
    machineId: "",
    size: "",
    target: "",
    uom: "",
    achieved: "",
    manpowerCount: "",
  });

  const [efficiency, setEfficiency] = useState("0.00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load departments and machines
    axiosInstance.get("/departments").then(r => setDepartments(r.data.data || r.data)).catch(console.error);
    axiosInstance.get("/machines").then(r => setMachines(r.data.data || r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.machineId) {
      machineEfficiencyApi.listTargets(form.machineId)
        .then(setMachineTargets)
        .catch(console.error);
      setForm(f => ({ ...f, size: "", target: "" }));
    } else {
      setMachineTargets([]);
    }
  }, [form.machineId]);

  useEffect(() => {
    if (form.size) {
      const targetObj = machineTargets.find(t => t.size === form.size);
      setForm(f => ({ ...f, target: targetObj ? targetObj.target.toString() : "", uom: targetObj ? targetObj.uom : "" }));
    }
  }, [form.size, machineTargets]);

  useEffect(() => {
    const t = parseFloat(form.target);
    const a = parseFloat(form.achieved);
    if (!isNaN(t) && t > 0 && !isNaN(a)) {
      setEfficiency(((a / t) * 100).toFixed(2));
    } else {
      setEfficiency("0.00");
    }
  }, [form.target, form.achieved]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await machineEfficiencyApi.createEntry({
        departmentId: form.departmentId,
        machineId: form.machineId,
        size: form.size,
        target: Number(form.target),
        achieved: Number(form.achieved),
        manpowerCount: Number(form.manpowerCount),
      });
      navigate("/admin/machine-efficiency");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to add efficiency entry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>ADD MACHINE EFFICIENCY</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid}>
            
            <div style={styles.field}>
              <label style={styles.label}>Department Name <span style={styles.star}>*</span></label>
              <select 
                style={styles.input} 
                value={form.departmentId} 
                onChange={e => setForm({ ...form, departmentId: e.target.value })} 
                required
              >
                <option value="" disabled>Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Machine Name <span style={styles.star}>*</span></label>
              <select 
                style={styles.input} 
                value={form.machineId} 
                onChange={e => setForm({ ...form, machineId: e.target.value })} 
                required
              >
                <option value="" disabled>Select Machine</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Size <span style={styles.star}>*</span></label>
              <select 
                style={styles.input} 
                value={form.size} 
                onChange={e => setForm({ ...form, size: e.target.value })} 
                required
                disabled={!form.machineId || machineTargets.length === 0}
              >
                <option value="" disabled>Select Size</option>
                {machineTargets.map(t => <option key={t.id} value={t.size}>{t.size}</option>)}
              </select>
              {form.machineId && machineTargets.length === 0 && (
                <span style={{ fontSize: 11, color: "red", marginTop: 4 }}>
                  No targets configured for this machine. Please add them in Master Data.
                </span>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Target {form.uom ? `(${form.uom})` : ""}</label>
              <input 
                style={{ ...styles.input, background: "#f3f4f6" }} 
                value={form.target} 
                readOnly 
                placeholder="Auto-populated"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Achieved <span style={styles.star}>*</span></label>
              <input 
                style={styles.input} 
                type="number" 
                min="0"
                step="any"
                value={form.achieved} 
                onChange={e => setForm({ ...form, achieved: e.target.value })} 
                required 
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>People Working (Manpower) <span style={styles.star}>*</span></label>
              <input 
                style={styles.input} 
                type="number" 
                min="1"
                value={form.manpowerCount} 
                onChange={e => setForm({ ...form, manpowerCount: e.target.value })} 
                required 
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Efficiency (%)</label>
              <div style={{ ...styles.input, background: "#f3f4f6", display: "flex", alignItems: "center" }}>
                {efficiency}%
              </div>
            </div>

          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.btnRow}>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "SUBMITTING..." : "SUBMIT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, background: "#f0f2f5", minHeight: "100vh" },
  card: { background: "#fff", padding: 32, borderRadius: 8, maxWidth: 800, margin: "0 auto", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 24, textTransform: "uppercase", color: "#374151" },
  form: { display: "flex", flexDirection: "column" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  star: { color: "#ef4444" },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 14, fontFamily: "inherit", outline: "none" },
  btnRow: { marginTop: 32 },
  submitBtn: { background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, padding: "10px 40px", fontWeight: 700, cursor: "pointer" },
  error: { color: "#ef4444", fontSize: 14, marginTop: 16 },
};
