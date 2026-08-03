import { FormEvent, useEffect, useState } from "react";
import { contractorsApi, ContractorRecord } from "../api/contractorsApi";
import PermissionGate from "../../../../../shared/guards/PermissionGate";

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<ContractorRecord[]>([]);
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() { setContractors(await contractorsApi.list()); }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await contractorsApi.create(form);
      setForm({ name: "", contactPerson: "", phone: "", email: "" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create contractor.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contractor/team?")) return;
    await contractorsApi.remove(id);
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Contractors / Teams</h1>

      <PermissionGate permission="contractor.create">
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 6 }} />
          <input placeholder="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} style={{ padding: 6 }} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 6 }} />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 6 }} />
          <button type="submit">Add Contractor</button>
        </form>
      </PermissionGate>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Contact</th>
            <th style={{ padding: 8 }}>Phone</th>
            <th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {contractors.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8, fontWeight: 600 }}>{c.name}</td>
              <td style={{ padding: 8 }}>{c.contactPerson ?? "—"}</td>
              <td style={{ padding: 8 }}>{c.phone ?? "—"}</td>
              <td style={{ padding: 8 }}>{c.email ?? "—"}</td>
              <td style={{ padding: 8 }}>
                <PermissionGate permission="contractor.delete">
                  <button onClick={() => handleDelete(c.id)}>Delete</button>
                </PermissionGate>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
