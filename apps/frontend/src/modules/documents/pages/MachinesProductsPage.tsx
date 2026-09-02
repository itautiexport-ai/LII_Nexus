import { FormEvent, useEffect, useState } from "react";
import { documentApi, MachineRecord } from "../api/documentApi";

export default function MachinesProductsPage() {
  const [machines, setMachines] = useState<MachineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [machineForm, setMachineForm] = useState({
    name: "",
    code: "",
    building: "",
    floor: "",
    location: "",
  });
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await documentApi.listMachines();
      setMachines(data);
    } catch (err) {
      console.error("Failed to load machines:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddMachine(e: FormEvent) {
    e.preventDefault();
    if (!machineForm.name.trim()) return;

    const payloadCode = machineForm.code.trim() || undefined;
    const payloadBuilding = machineForm.building.trim() || undefined;
    const payloadFloor = machineForm.floor.trim() || undefined;
    const payloadLocation = machineForm.location.trim() || undefined;

    try {
      if (editingMachineId) {
        await documentApi.updateMachine(
          editingMachineId,
          machineForm.name.trim(),
          payloadCode,
          payloadBuilding,
          payloadFloor,
          payloadLocation
        );
        setEditingMachineId(null);
      } else {
        await documentApi.createMachine(
          machineForm.name.trim(),
          payloadCode,
          payloadBuilding,
          payloadFloor,
          payloadLocation
        );
      }
      setMachineForm({ name: "", code: "", building: "", floor: "", location: "" });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to save machine");
    }
  }

  function editMachine(m: MachineRecord) {
    setMachineForm({
      name: m.name || "",
      code: m.code || "",
      building: m.building || "",
      floor: m.floor || "",
      location: m.location || "",
    });
    setEditingMachineId(m.id);
  }

  function cancelEdit() {
    setEditingMachineId(null);
    setMachineForm({ name: "", code: "", building: "", floor: "", location: "" });
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Machines</h1>
        <p style={{ fontSize: 14, color: "#64748b" }}>
          Minimal reference list so documents (manuals, drawings) have real machines to attach to.
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 14 }}>
          {editingMachineId ? "Edit Machine" : "Add New Machine"}
        </h3>
        <form onSubmit={handleAddMachine} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <input
            required
            placeholder="Name"
            value={machineForm.name}
            onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, flex: "1 1 200px" }}
          />
          <input
            placeholder="Code"
            value={machineForm.code}
            onChange={(e) => setMachineForm({ ...machineForm, code: e.target.value })}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, width: 120 }}
          />
          <select
            value={machineForm.building}
            onChange={(e) => setMachineForm({ ...machineForm, building: e.target.value })}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, minWidth: 120, background: "#fff" }}
          >
            <option value="">Building</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
          <select
            value={machineForm.floor}
            onChange={(e) => setMachineForm({ ...machineForm, floor: e.target.value })}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, minWidth: 150, background: "#fff" }}
          >
            <option value="">Floor</option>
            <option value="Ground Floor">Ground Floor</option>
            <option value="First Floor">First Floor</option>
            <option value="Second Floor">Second Floor</option>
            <option value="Basement">Basement</option>
          </select>
          <input
            placeholder="Location"
            value={machineForm.location}
            onChange={(e) => setMachineForm({ ...machineForm, location: e.target.value })}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, flex: "1 1 160px" }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 18px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {editingMachineId ? "Update" : "+ Add"}
          </button>
          {editingMachineId && (
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                padding: "8px 14px",
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>
              <th style={{ padding: "12px 16px" }}>Machine Name</th>
              <th style={{ padding: "12px 16px" }}>Code</th>
              <th style={{ padding: "12px 16px" }}>Building</th>
              <th style={{ padding: "12px 16px" }}>Floor</th>
              <th style={{ padding: "12px 16px" }}>Location</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Loading machines...</td>
              </tr>
            ) : machines.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>No machines added yet.</td>
              </tr>
            ) : (
              machines.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#1e293b" }}>{m.name}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{m.code || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{m.building ? `Building ${m.building}` : "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{m.floor || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{m.location || "—"}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => editMachine(m)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


