import React, { useState, useEffect } from "react";
import { masterDataApi, WoodType } from "../api/masterDataApi";

export interface WoodThicknessPrice {
  id: string;
  woodType: string;
  thickness: string;
  ratePerCft: number;
  status: "active" | "inactive";
  createdAt: string;
}

const DEFAULT_WOOD_THICKNESS_PRICES: WoodThicknessPrice[] = [
  { id: "wtp-1", woodType: "Sheesham", thickness: '0.75"', ratePerCft: 1350, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-2", woodType: "Sheesham", thickness: '1.0"', ratePerCft: 1450, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-3", woodType: "Sheesham", thickness: '1.5"', ratePerCft: 1600, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-4", woodType: "Mango", thickness: '0.75"', ratePerCft: 750, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-5", woodType: "Mango", thickness: '1.0"', ratePerCft: 850, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-6", woodType: "Acacia", thickness: '1.0"', ratePerCft: 1100, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-7", woodType: "Teak", thickness: '1.0"', ratePerCft: 3200, status: "active", createdAt: "2026-10-01" },
];

const LOCAL_STORAGE_KEY = "nexus_wood_thickness_prices";

export default function WoodThicknessPricesPage() {
  const [prices, setPrices] = useState<WoodThicknessPrice[]>([]);
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedWoodType, setSelectedWoodType] = useState("Sheesham");
  const [customWoodType, setCustomWoodType] = useState("");
  const [thickness, setThickness] = useState('1.0"');
  const [ratePerCft, setRatePerCft] = useState<number | "">(1200);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter State
  const [filterWoodType, setFilterWoodType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Wood Types from Master Data API
      const wtList = await masterDataApi.getWoodTypes().catch(() => []);
      setWoodTypes(wtList || []);
      if (wtList.length > 0) {
        setSelectedWoodType(wtList[0].name);
      }

      // Load Wood Thickness Prices from LocalStorage
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setPrices(JSON.parse(saved));
      } else {
        setPrices(DEFAULT_WOOD_THICKNESS_PRICES);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_WOOD_THICKNESS_PRICES));
      }
    } catch (e) {
      console.error("Error loading wood thickness prices", e);
      setPrices(DEFAULT_WOOD_THICKNESS_PRICES);
    } finally {
      setLoading(false);
    }
  };

  const savePricesToStorage = (updated: WoodThicknessPrice[]) => {
    setPrices(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWoodType = selectedWoodType === "Other" ? customWoodType.trim() : selectedWoodType;
    if (!finalWoodType) {
      alert("Please specify a Wood Type");
      return;
    }
    if (!thickness.trim()) {
      alert("Please enter thickness");
      return;
    }
    const rate = Number(ratePerCft) || 0;

    if (editingId) {
      const updated = prices.map((item) =>
        item.id === editingId
          ? { ...item, woodType: finalWoodType, thickness, ratePerCft: rate, status }
          : item
      );
      savePricesToStorage(updated);
      alert("Wood thickness price updated successfully!");
    } else {
      const newItem: WoodThicknessPrice = {
        id: `wtp-${Date.now()}`,
        woodType: finalWoodType,
        thickness,
        ratePerCft: rate,
        status,
        createdAt: new Date().toISOString().split("T")[0],
      };
      savePricesToStorage([newItem, ...prices]);
      alert("Wood thickness price added successfully!");
    }

    // Reset Form
    setEditingId(null);
    setThickness('1.0"');
    setRatePerCft(1200);
    setCustomWoodType("");
    setStatus("active");
  };

  const handleEdit = (item: WoodThicknessPrice) => {
    setEditingId(item.id);
    const hasType = woodTypes.some((w) => w.name === item.woodType);
    if (hasType) {
      setSelectedWoodType(item.woodType);
      setCustomWoodType("");
    } else {
      setSelectedWoodType("Other");
      setCustomWoodType(item.woodType);
    }
    setThickness(item.thickness);
    setRatePerCft(item.ratePerCft);
    setStatus(item.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this wood thickness price rate?")) return;
    const updated = prices.filter((item) => item.id !== id);
    savePricesToStorage(updated);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setThickness('1.0"');
    setRatePerCft(1200);
    setCustomWoodType("");
    setStatus("active");
  };

  // Filter Logic
  const filteredPrices = prices.filter((item) => {
    const matchesWood = filterWoodType === "All" || item.woodType === filterWoodType;
    const matchesSearch =
      item.woodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.thickness.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ratePerCft.toString().includes(searchTerm);
    return matchesWood && matchesSearch;
  });

  const uniqueWoodTypesList = Array.from(new Set(prices.map((p) => p.woodType)));

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center", fontSize: 16 }}>Loading Wood Thickness Prices...</div>;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
          Wood Thickness Prices
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Manage standard pricing rates per CFT for various wood types and thickness specifications.
        </p>
      </div>

      {/* Form Card */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0" }}>
          {editingId ? "Edit Wood Thickness Price Rate" : "Add New Wood Thickness Price Rate"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", width: "100%" }}>
            {/* Wood Type Selection */}
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Wood Type *
              </label>
              <select
                value={selectedWoodType}
                onChange={(e) => setSelectedWoodType(e.target.value)}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#1e293b",
                  backgroundColor: "#ffffff",
                }}
              >
                {woodTypes.map((wt) => (
                  <option key={wt.id} value={wt.name}>
                    {wt.name}
                  </option>
                ))}
                <option value="Sheesham">Sheesham</option>
                <option value="Mango">Mango</option>
                <option value="Acacia">Acacia</option>
                <option value="Teak">Teak</option>
                <option value="Other">Other (Custom)</option>
              </select>
            </div>

            {/* Custom Wood Type if selected */}
            {selectedWoodType === "Other" && (
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Custom Wood Type Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Wood Type"
                  value={customWoodType}
                  onChange={(e) => setCustomWoodType(e.target.value)}
                  style={{ width: "100%", height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                />
              </div>
            )}

            {/* Thickness */}
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Thickness *
              </label>
              <input
                type="text"
                required
                placeholder='e.g. 0.75", 1.0", 1.5", 2.0"'
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                style={{ width: "100%", height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
              />
            </div>

            {/* Rate per CFT */}
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Rate per CFT (₹) *
              </label>
              <input
                type="number"
                step="1"
                required
                placeholder="Rate in ₹"
                value={ratePerCft}
                onChange={(e) => setRatePerCft(e.target.value ? Number(e.target.value) : "")}
                style={{ width: "100%", height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, fontWeight: 600 }}
              />
            </div>

            {/* Status */}
            <div style={{ flex: "1 1 150px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: "14px",
                  color: "#1e293b",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  padding: "9px 18px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              style={{
                padding: "9px 22px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {editingId ? "Update Price Rate" : "+ Add Price Rate"}
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Table Container */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {/* Filter Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            Configured Thickness Rates List ({filteredPrices.length})
          </h3>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select
              value={filterWoodType}
              onChange={(e) => setFilterWoodType(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, backgroundColor: "#ffffff" }}
            >
              <option value="All">All Wood Types</option>
              {uniqueWoodTypesList.map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search thickness or rate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, width: "200px" }}
            />
          </div>
        </div>

        {/* Data Table */}
        <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Wood Type</th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Thickness</th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Rate per CFT (₹)</th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Status</th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569", width: "140px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrices.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{item.woodType}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#2563eb" }}>{item.thickness}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#059669" }}>
                  ₹{item.ratePerCft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: item.status === "active" ? "#dcfce7" : "#fee2e2",
                      color: item.status === "active" ? "#166534" : "#991b1b",
                    }}
                  >
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPrices.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  No wood thickness prices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
