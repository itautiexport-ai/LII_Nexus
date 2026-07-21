import { FormEvent, useEffect, useState } from "react";
import { designationsApi, DesignationRecord } from "../api/designationsApi";
import PermissionGate from "../../../../../shared/guards/PermissionGate";

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<DesignationRecord[]>([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setDesignations(await designationsApi.list());
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payloadDesc = form.description.trim() || null;
      if (editingId) {
        await designationsApi.update(editingId, { title: form.title, description: payloadDesc });
        setEditingId(null);
      } else {
        await designationsApi.create({ title: form.title, description: payloadDesc || undefined });
      }
      setForm({ title: "", description: "" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save designation.");
    }
  }

  function handleEdit(d: DesignationRecord) {
    setForm({ title: d.title, description: d.description || "" });
    setEditingId(d.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ title: "", description: "" });
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this designation?")) return;
    await designationsApi.remove(id);
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Designation Master</h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ padding: 6 }} />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: 6, flex: 1, minWidth: 160 }} />
          <button type="submit">{editingId ? "Update" : "Add Designation"}</button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </form>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Title</th>
            <th style={{ padding: 8 }}>Description</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {designations.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{d.title}</td>
              <td style={{ padding: 8 }}>{d.description ?? "—"}</td>
              <td style={{ padding: 8 }}>
                <button onClick={() => handleEdit(d)} style={{ marginRight: 8, color: "#2563eb" }}>Edit</button>
                <button onClick={() => handleDelete(d.id)} style={{ color: "red" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
