import { FormEvent, useEffect, useState } from "react";
import { shiftsApi, ShiftRecord } from "../api/shiftsApi";
import PermissionGate from "../../../../../shared/guards/PermissionGate";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [form, setForm] = useState({ name: "", startTime: "", endTime: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setShifts(await shiftsApi.list());
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await shiftsApi.update(editingId, form);
        setEditingId(null);
      } else {
        await shiftsApi.create(form);
      }
      setForm({ name: "", startTime: "", endTime: "" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save shift.");
    }
  }

  function handleEdit(s: ShiftRecord) {
    setForm({ name: s.name, startTime: s.startTime || "", endTime: s.endTime || "" });
    setEditingId(s.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", startTime: "", endTime: "" });
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shift?")) return;
    await shiftsApi.remove(id);
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Shift Master</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 6 }} />
        <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} style={{ padding: 6 }} />
        <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} style={{ padding: 6 }} />
        <button type="submit">{editingId ? "Update" : "Add Shift"}</button>
        {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
      </form>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Start</th>
            <th style={{ padding: 8 }}>End</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{s.name}</td>
              <td style={{ padding: 8 }}>{s.startTime}</td>
              <td style={{ padding: 8 }}>{s.endTime}</td>
              <td style={{ padding: 8 }}>
                <button onClick={() => handleEdit(s)} style={{ marginRight: 8, color: "#2563eb" }}>Edit</button>
                <button onClick={() => handleDelete(s.id)} style={{ color: "red" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
