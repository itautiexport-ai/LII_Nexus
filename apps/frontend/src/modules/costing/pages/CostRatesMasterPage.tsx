import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi, CostRateMaster } from "../api/costingApi";

export default function CostRatesMasterPage() {
  const navigate = useNavigate();
  const [rates, setRates] = useState<CostRateMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState<CostRateMaster | null>(null);

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Raw Material");
  const [unitOfMeasure, setUnitOfMeasure] = useState("Pcs");
  const [rate, setRate] = useState(0);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await costingApi.getAllRates();
      setRates(data);
    } catch (err) {
      console.error("Failed to load rates", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRate(null);
    setItemName("");
    setCategory("Raw Material");
    setUnitOfMeasure("Pcs");
    setRate(0);
    setShowModal(true);
  };

  const handleOpenEdit = (item: CostRateMaster) => {
    setEditingRate(item);
    setItemName(item.item_name);
    setCategory(item.category);
    setUnitOfMeasure(item.unit_of_measure || "Pcs");
    setRate(item.rate || 0);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert("Please enter item name");
      return;
    }

    try {
      await costingApi.saveRate({
        id: editingRate?.id,
        item_name: itemName,
        category,
        unit_of_measure: unitOfMeasure,
        rate: Number(rate),
      });
      setShowModal(false);
      loadRates();
    } catch (err) {
      alert("Failed to save rate item");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete rate for "${name}"?`)) return;
    try {
      await costingApi.deleteRate(id);
      loadRates();
    } catch (err) {
      alert("Failed to delete rate item");
    }
  };

  const filteredRates = rates.filter((r) => {
    const matchesSearch = r.item_name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Standard Cost Rate Master
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: 14 }}>
            Pre-defined standard rates for raw materials, hardware, labor, finishing, and overheads
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/admin/costing/hub")}
            style={{ padding: "10px 16px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer" }}
          >
            Costing Hub
          </button>
          <button
            onClick={handleOpenAdd}
            style={{ padding: "10px 18px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
          >
            + Add Standard Rate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, background: "#ffffff", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <input
          type="text"
          placeholder="Search rates by material or labor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, background: "#ffffff" }}
        >
          <option value="ALL">All Categories</option>
          <option value="Raw Material">Raw Material</option>
          <option value="Hardware">Hardware</option>
          <option value="Labor">Labor</option>
          <option value="Finishing">Finishing</option>
          <option value="Packaging">Packaging</option>
          <option value="Overhead">Overhead</option>
        </select>
      </div>

      {/* Datatable */}
      <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>Loading standard rates...</div>
        ) : filteredRates.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
            No standard rates found matching filters.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Category</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Item / Description</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>UOM</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Standard Rate</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>
                    <span style={{ padding: "4px 8px", borderRadius: 4, background: "#f3f4f6", fontSize: 12 }}>
                      {r.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>
                    {r.item_name}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>
                    {r.unit_of_measure}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#059669" }}>
                    ₹{Number(r.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleOpenEdit(r)}
                        style={{ padding: "4px 8px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id!, r.item_name)}
                        style={{ padding: "4px 8px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: 8, padding: 24, width: 450, maxWidth: "90%" }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>
              {editingRate ? "Edit Standard Rate" : "Add Standard Rate"}
            </h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, background: "#fff" }}
                >
                  <option value="Raw Material">Raw Material</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Labor">Labor</option>
                  <option value="Finishing">Finishing</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Overhead">Overhead</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Unit of Measure (UOM)</label>
                <input
                  type="text"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Standard Rate (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
                >
                  Save Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
