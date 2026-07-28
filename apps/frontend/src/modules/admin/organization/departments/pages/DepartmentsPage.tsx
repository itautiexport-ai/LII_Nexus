import { FormEvent, useEffect, useState } from "react";
import { departmentsApi, DepartmentRecord } from "../api/departmentsApi";
import PermissionGate from "../../../../../shared/guards/PermissionGate";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setDepartments(await departmentsApi.list());
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payloadCode = form.code.trim() || null;
      const payloadDesc = form.description.trim() || null;

      if (editingId) {
        await departmentsApi.update(editingId, { name: form.name, code: payloadCode, description: payloadDesc });
        setEditingId(null);
      } else {
        await departmentsApi.create({ name: form.name, code: payloadCode || undefined, description: payloadDesc || undefined });
      }
      setForm({ name: "", code: "", description: "" });
      await load();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to save department.";
      setError(msg);
    }
  }

  function handleEdit(d: DepartmentRecord) {
    setForm({ name: d.name, code: d.code || "", description: d.description || "" });
    setEditingId(d.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", code: "", description: "" });
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this department?")) return;
    await departmentsApi.remove(id);
    await load();
  }

  const [sortConfig, setSortConfig] = useState<{ key: keyof DepartmentRecord, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof DepartmentRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDepartments = [...departments].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";
    
    // Perform case-insensitive string comparison if both are strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Department Master</h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 6 }} />
          <input placeholder="Code (optional)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={{ padding: 6 }} />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: 6, flex: 1, minWidth: 160 }} />
          <button type="submit">{editingId ? "Update" : "Add Department"}</button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </form>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort('name')}>
              Name {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th style={{ padding: 8, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort('code')}>
              Code {sortConfig?.key === 'code' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th style={{ padding: 8, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort('description')}>
              Description {sortConfig?.key === 'description' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedDepartments.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{d.name}</td>
              <td style={{ padding: 8 }}>{d.code ?? "—"}</td>
              <td style={{ padding: 8 }}>{d.description ?? "—"}</td>
              <td style={{ padding: 8 }}>
                <button onClick={() => handleEdit(d)} style={{ marginRight: 8 }}>Edit</button>
                <button onClick={() => handleDelete(d.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
