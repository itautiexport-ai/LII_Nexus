import React, { useEffect, useState } from "react";
import { maintenanceApi, EquipmentRecord } from "../api/maintenanceApi";

export default function EquipmentAssetsPage() {
  const [equipmentList, setEquipmentList] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    equipment_code: "",
    name: "",
    category: "General",
    department_name: "",
    location: "",
    status: "Operational" as EquipmentRecord['status'],
    serial_number: "",
    purchase_date: "",
    last_maintenance_date: "",
    next_maintenance_date: ""
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceApi.getEquipment();
      setEquipmentList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load equipment list");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (eq?: EquipmentRecord) => {
    if (eq) {
      setEditingId(eq.id);
      setFormData({
        equipment_code: eq.equipment_code || "",
        name: eq.name || "",
        category: eq.category || "General",
        department_name: eq.department_name || "",
        location: eq.location || "",
        status: eq.status || "Operational",
        serial_number: eq.serial_number || "",
        purchase_date: eq.purchase_date ? eq.purchase_date.slice(0, 10) : "",
        last_maintenance_date: eq.last_maintenance_date ? eq.last_maintenance_date.slice(0, 10) : "",
        next_maintenance_date: eq.next_maintenance_date ? eq.next_maintenance_date.slice(0, 10) : ""
      });
    } else {
      setEditingId(null);
      setFormData({
        equipment_code: `EQ-${Date.now().toString().slice(-5)}`,
        name: "",
        category: "General",
        department_name: "MACHINE SHOP",
        location: "Factory Floor",
        status: "Operational",
        serial_number: "",
        purchase_date: "",
        last_maintenance_date: "",
        next_maintenance_date: ""
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await maintenanceApi.updateEquipment(editingId, formData);
      } else {
        await maintenanceApi.createEquipment(formData);
      }
      setShowModal(false);
      loadEquipment();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this equipment?")) return;
    try {
      await maintenanceApi.deleteEquipment(id);
      loadEquipment();
    } catch (err: any) {
      alert(err.message || "Failed to delete equipment");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Equipment & Assets Registry</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Master database of factory machinery, operational status, serial numbers & service history</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{
            padding: "10px 18px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          + Add Equipment
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Equipment Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "12px 16px" }}>Equipment Code</th>
              <th style={{ padding: "12px 16px" }}>Name</th>
              <th style={{ padding: "12px 16px" }}>Category</th>
              <th style={{ padding: "12px 16px" }}>Department</th>
              <th style={{ padding: "12px 16px" }}>Location</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading equipment...</td></tr>
            ) : equipmentList.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No equipment registered in system</td></tr>
            ) : (
              equipmentList.map((eq) => (
                <tr key={eq.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb" }}>{eq.equipment_code}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "600" }}>{eq.name}</td>
                  <td style={{ padding: "12px 16px" }}>{eq.category}</td>
                  <td style={{ padding: "12px 16px" }}>{eq.department_name || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>{eq.location || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                      backgroundColor: eq.status === 'Operational' ? '#dcfce7' : eq.status === 'Breakdown' ? '#fef2f2' : '#fef3c7',
                      color: eq.status === 'Operational' ? '#166534' : eq.status === 'Breakdown' ? '#991b1b' : '#92400e'
                    }}>
                      {eq.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleOpenModal(eq)}
                      style={{ padding: "6px 12px", marginRight: "8px", backgroundColor: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(eq.id)}
                      style={{ padding: "6px 12px", backgroundColor: "#fef2f2", color: "#991b1b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "700" }}>
              {editingId ? "Edit Equipment" : "Add New Equipment"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Code</label>
                    <input
                      type="text"
                      value={formData.equipment_code}
                      onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Operational">Operational</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Breakdown">Breakdown</option>
                      <option value="Decommissioned">Decommissioned</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Equipment Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. CNC Wood Router Machine #1"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Machine Shop, Boiler, Metal"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Department</label>
                    <input
                      type="text"
                      value={formData.department_name}
                      onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                      placeholder="e.g. MACHINE SHOP"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Bay 2, Floor 1"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Serial Number</label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Last Maintenance</label>
                    <input
                      type="date"
                      value={formData.last_maintenance_date}
                      onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Next Maintenance</label>
                    <input
                      type="date"
                      value={formData.next_maintenance_date}
                      onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: "600" }}
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
