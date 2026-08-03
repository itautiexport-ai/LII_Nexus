import { FormEvent, useEffect, useState } from "react";
import { productionLinesApi, ProductionLineRecord } from "../api/productionLinesApi";
import PermissionGate from "../../../../../shared/guards/PermissionGate";

export default function ProductionLinesPage() {
  const [lines, setLines] = useState<ProductionLineRecord[]>([]);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLines(await productionLinesApi.list());
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await productionLinesApi.create(form);
      setForm({ name: "", code: "", description: "" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create production line.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this production line?")) return;
    await productionLinesApi.remove(id);
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Production Line Master</h1>

      <PermissionGate permission="factory.line.create">
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 6 }} />
          <input placeholder="Code (optional)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={{ padding: 6 }} />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: 6, flex: 1, minWidth: 160 }} />
          <button type="submit">Add Line</button>
        </form>
      </PermissionGate>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Code</th>
            <th style={{ padding: 8 }}>Description</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{l.name}</td>
              <td style={{ padding: 8 }}>{l.code ?? "—"}</td>
              <td style={{ padding: 8 }}>{l.description ?? "—"}</td>
              <td style={{ padding: 8 }}>
                <PermissionGate permission="factory.line.delete">
                  <button onClick={() => handleDelete(l.id)}>Delete</button>
                </PermissionGate>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
