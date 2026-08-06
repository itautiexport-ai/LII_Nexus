import React, { useEffect, useState } from "react";
import { maintenanceApi, SparePartRecord } from "../api/maintenanceApi";

export default function SparePartsPage() {
  const [spareParts, setSpareParts] = useState<SparePartRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    part_code: "",
    name: "",
    category: "General",
    quantity: 0,
    min_threshold: 5,
    unit_cost: 0,
    location: ""
  });

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceApi.getSpareParts();
      setSpareParts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load spare parts");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (part?: SparePartRecord) => {
    if (part) {
      setEditingId(part.id);
      setFormData({
        part_code: part.part_code || "",
        name: part.name || "",
        category: part.category || "General",
        quantity: part.quantity || 0,
        min_threshold: part.min_threshold || 5,
        unit_cost: part.unit_cost || 0,
        location: part.location || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        part_code: `PART-${Date.now().toString().slice(-5)}`,
        name: "",
        category: "Mechanical",
        quantity: 10,
        min_threshold: 5,
        unit_cost: 0,
        location: "Rack A-1"
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await maintenanceApi.updateSparePart(editingId, formData);
      } else {
        await maintenanceApi.createSparePart(formData);
      }
      setShowModal(false);
      loadParts();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this spare part item?")) return;
    try {
      await maintenanceApi.deleteSparePart(id);
      loadParts();
    } catch (err: any) {
      alert(err.message || "Failed to delete spare part");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Spare Parts Inventory</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Track critical replacement components, current stock, reorder thresholds & costs</p>
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
          + Add Spare Part
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "12px 16px" }}>Part Code</th>
              <th style={{ padding: "12px 16px" }}>Name</th>
              <th style={{ padding: "12px 16px" }}>Category</th>
              <th style={{ padding: "12px 16px" }}>Stock Quantity</th>
              <th style={{ padding: "12px 16px" }}>Min Threshold</th>
              <th style={{ padding: "12px 16px" }}>Unit Cost</th>
              <th style={{ padding: "12px 16px" }}>Location</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading inventory...</td></tr>
            ) : spareParts.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No spare parts registered</td></tr>
            ) : (
              spareParts.map((part) => {
                const isLowStock = part.quantity <= part.min_threshold;
                return (
                  <tr key={part.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb" }}>{part.part_code}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>{part.name}</td>
                    <td style={{ padding: "12px 16px" }}>{part.category}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700",
                        backgroundColor: isLowStock ? '#fef2f2' : '#dcfce7',
                        color: isLowStock ? '#dc2626' : '#166534'
                      }}>
                        {part.quantity} units {isLowStock ? '(Low Stock!)' : ''}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{part.min_threshold} units</td>
                    <td style={{ padding: "12px 16px" }}>₹{Number(part.unit_cost || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px 16px" }}>{part.location || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => handleOpenModal(part)}
                        style={{ padding: "6px 12px", marginRight: "8px", backgroundColor: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
                      >
                        Edit Stock
                      </button>
                      <button
                        onClick={() => handleDelete(part.id)}
                        style={{ padding: "6px 12px", backgroundColor: "#fef2f2", color: "#991b1b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", width: "500px", maxWidth: "90%" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "700" }}>
              {editingId ? "Edit Spare Part" : "Add Spare Part"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Part Code</label>
                    <input
                      type="text"
                      value={formData.part_code}
                      onChange={(e) => setFormData({ ...formData, part_code: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Electrical, Mechanical, Hydraulic"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Part Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. SKF 6205 Deep Groove Ball Bearing"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Quantity in Stock</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Min Threshold</label>
                    <input
                      type="number"
                      value={formData.min_threshold}
                      onChange={(e) => setFormData({ ...formData, min_threshold: Number(e.target.value) })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Unit Cost (₹)</label>
                    <input
                      type="number"
                      value={formData.unit_cost}
                      onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Storage Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Shelf B4"
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
                  Save Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
