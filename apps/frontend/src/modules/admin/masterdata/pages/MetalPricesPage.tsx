import React, { useState, useEffect } from "react";

export interface MetalPrice {
  id: string;
  metalType: string;
  pipeSize: string;
  pipeSizeUom: string;
  pipeLength: string;
  pipeLengthUom: string;
  metalThickness: string;
  metalThicknessUom: string;
  rate: number;
  rateUnit: string;
  status: "active" | "inactive";
  createdAt: string;
}

const METAL_TYPE_PRESETS = [
  "Mild Steel (MS)",
  "Stainless Steel (SS 304)",
  "Stainless Steel (SS 202)",
  "Stainless Steel (SS 316)",
  "Brass",
  "Copper",
  "Aluminum",
  "GI (Galvanized Iron)",
  "Cast Iron (CI)",
  "Wrought Iron",
  "Other",
];

const PIPE_SIZE_UOM_OPTIONS = [
  { value: "mm", label: "MM (mm)" },
  { value: "inch", label: 'Inch (")' },
  { value: "cm", label: "CM (cm)" },
];

const PIPE_LENGTH_UOM_OPTIONS = [
  { value: "feet", label: "Feet (ft)" },
  { value: "meter", label: "Meter (m)" },
  { value: "inch", label: 'Inch (")' },
  { value: "mm", label: "MM (mm)" },
];

const METAL_THICKNESS_UOM_OPTIONS = [
  { value: "Gauge (SWG)", label: "Gauge (SWG)" },
  { value: "mm", label: "MM (mm)" },
  { value: "inch", label: 'Inch (")' },
];

const RATE_UNIT_OPTIONS = [
  { value: "Per Kg", label: "Per Kg (₹/Kg)" },
  { value: "Per Foot", label: "Per Foot (₹/ft)" },
  { value: "Per Meter", label: "Per Meter (₹/m)" },
  { value: "Per Piece", label: "Per Piece (₹/pc)" },
];

const DEFAULT_METAL_PRICES: MetalPrice[] = [
  {
    id: "mp-1",
    metalType: "Mild Steel (MS)",
    pipeSize: "25 x 25",
    pipeSizeUom: "mm",
    pipeLength: "20",
    pipeLengthUom: "feet",
    metalThickness: "16",
    metalThicknessUom: "Gauge (SWG)",
    rate: 78,
    rateUnit: "Per Kg",
    status: "active",
    createdAt: "2026-10-01",
  },
  {
    id: "mp-2",
    metalType: "Mild Steel (MS)",
    pipeSize: "32",
    pipeSizeUom: "mm",
    pipeLength: "20",
    pipeLengthUom: "feet",
    metalThickness: "18",
    metalThicknessUom: "Gauge (SWG)",
    rate: 82,
    rateUnit: "Per Kg",
    status: "active",
    createdAt: "2026-10-01",
  },
  {
    id: "mp-3",
    metalType: "Stainless Steel (SS 304)",
    pipeSize: "25 x 25",
    pipeSizeUom: "mm",
    pipeLength: "20",
    pipeLengthUom: "feet",
    metalThickness: "1.5",
    metalThicknessUom: "mm",
    rate: 290,
    rateUnit: "Per Kg",
    status: "active",
    createdAt: "2026-10-01",
  },
  {
    id: "mp-4",
    metalType: "Stainless Steel (SS 202)",
    pipeSize: "25 x 25",
    pipeSizeUom: "mm",
    pipeLength: "20",
    pipeLengthUom: "feet",
    metalThickness: "1.2",
    metalThicknessUom: "mm",
    rate: 185,
    rateUnit: "Per Kg",
    status: "active",
    createdAt: "2026-10-01",
  },
  {
    id: "mp-5",
    metalType: "Brass",
    pipeSize: "12",
    pipeSizeUom: "mm",
    pipeLength: "12",
    pipeLengthUom: "feet",
    metalThickness: "2.0",
    metalThicknessUom: "mm",
    rate: 650,
    rateUnit: "Per Kg",
    status: "active",
    createdAt: "2026-10-01",
  },
  {
    id: "mp-6",
    metalType: "Aluminum",
    pipeSize: "25 x 25",
    pipeSizeUom: "mm",
    pipeLength: "12",
    pipeLengthUom: "feet",
    metalThickness: "2.0",
    metalThicknessUom: "mm",
    rate: 240,
    rateUnit: "Per Kg",
    status: "active",
    createdAt: "2026-10-01",
  },
];

const LOCAL_STORAGE_KEY = "nexus_metal_prices";

function formatDimension(val?: string, uom?: string): string {
  if (!val || val === "—") return "—";
  const cleanedVal = val.trim();
  if (
    cleanedVal.includes('"') ||
    cleanedVal.includes("'") ||
    cleanedVal.toLowerCase().includes("ft") ||
    cleanedVal.toLowerCase().includes("mm") ||
    cleanedVal.toLowerCase().includes("swg") ||
    cleanedVal.toLowerCase().includes("gauge")
  ) {
    return cleanedVal;
  }
  const u = (uom || "").toLowerCase();
  if (u === "gauge (swg)" || u === "gauge" || u === "swg") return `${cleanedVal} SWG`;
  if (u === "inch" || u === '"' || u === "in") return `${cleanedVal}"`;
  if (u === "feet" || u === "ft" || u === "'") return `${cleanedVal} ft`;
  if (u === "meter" || u === "m") return `${cleanedVal} m`;
  if (u === "mm") return `${cleanedVal} mm`;
  if (u === "cm") return `${cleanedVal} cm`;
  return uom ? `${cleanedVal} ${uom}` : cleanedVal;
}

export default function MetalPricesPage() {
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State - strictly requested fields
  const [metalType, setMetalType] = useState("Mild Steel (MS)");
  const [customMetalType, setCustomMetalType] = useState("");
  const [pipeSize, setPipeSize] = useState("25 x 25");
  const [pipeSizeUom, setPipeSizeUom] = useState("mm");
  const [pipeLength, setPipeLength] = useState("20");
  const [pipeLengthUom, setPipeLengthUom] = useState("feet");
  const [metalThickness, setMetalThickness] = useState("16");
  const [metalThicknessUom, setMetalThicknessUom] = useState("Gauge (SWG)");
  const [rate, setRate] = useState<number | "">(78);
  const [rateUnit, setRateUnit] = useState("Per Kg");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter State
  const [filterMetalType, setFilterMetalType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize any old records to fit exact format
        const normalized: MetalPrice[] = parsed.map((item: any) => ({
          id: item.id || `mp-${Date.now()}`,
          metalType: item.metalType || "Mild Steel (MS)",
          pipeSize: item.pipeSize || item.size || "25 x 25",
          pipeSizeUom: item.pipeSizeUom || item.sizeUom || "mm",
          pipeLength: item.pipeLength || item.length || "20",
          pipeLengthUom: item.pipeLengthUom || item.lengthUom || "feet",
          metalThickness: item.metalThickness || item.thickness || "16",
          metalThicknessUom: item.metalThicknessUom || item.thicknessUom || "Gauge (SWG)",
          rate: Number(item.rate) || 0,
          rateUnit: item.rateUnit || "Per Kg",
          status: item.status || "active",
          createdAt: item.createdAt || new Date().toISOString().split("T")[0],
        }));
        setPrices(normalized);
      } else {
        setPrices(DEFAULT_METAL_PRICES);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_METAL_PRICES));
      }
    } catch (e) {
      console.error("Error loading metal prices", e);
      setPrices(DEFAULT_METAL_PRICES);
    } finally {
      setLoading(false);
    }
  };

  const savePricesToStorage = (updated: MetalPrice[]) => {
    setPrices(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMetalType = metalType === "Other" ? customMetalType.trim() : metalType;
    if (!finalMetalType) {
      alert("Please specify Type of Metal");
      return;
    }
    if (!pipeSize.trim()) {
      alert("Please enter Pipe Size");
      return;
    }
    if (!pipeLength.trim()) {
      alert("Please enter Pipe Length");
      return;
    }
    if (!metalThickness.trim()) {
      alert("Please enter Thickness of Metal");
      return;
    }

    const rateNum = Number(rate) || 0;

    if (editingId) {
      const updated = prices.map((item) =>
        item.id === editingId
          ? {
              ...item,
              metalType: finalMetalType,
              pipeSize: pipeSize.trim(),
              pipeSizeUom,
              pipeLength: pipeLength.trim(),
              pipeLengthUom,
              metalThickness: metalThickness.trim(),
              metalThicknessUom,
              rate: rateNum,
              rateUnit,
              status,
            }
          : item
      );
      savePricesToStorage(updated);
      alert("Metal price rate updated successfully!");
    } else {
      const newItem: MetalPrice = {
        id: `mp-${Date.now()}`,
        metalType: finalMetalType,
        pipeSize: pipeSize.trim(),
        pipeSizeUom,
        pipeLength: pipeLength.trim(),
        pipeLengthUom,
        metalThickness: metalThickness.trim(),
        metalThicknessUom,
        rate: rateNum,
        rateUnit,
        status,
        createdAt: new Date().toISOString().split("T")[0],
      };
      savePricesToStorage([newItem, ...prices]);
      alert("Metal price rate added successfully!");
    }

    handleCancelEdit();
  };

  const handleEdit = (item: MetalPrice) => {
    setEditingId(item.id);
    if (METAL_TYPE_PRESETS.includes(item.metalType)) {
      setMetalType(item.metalType);
      setCustomMetalType("");
    } else {
      setMetalType("Other");
      setCustomMetalType(item.metalType);
    }

    setPipeSize(item.pipeSize || "");
    setPipeSizeUom(item.pipeSizeUom || "mm");
    setPipeLength(item.pipeLength || "");
    setPipeLengthUom(item.pipeLengthUom || "feet");
    setMetalThickness(item.metalThickness || "");
    setMetalThicknessUom(item.metalThicknessUom || "Gauge (SWG)");
    setRate(item.rate);
    setRateUnit(item.rateUnit || "Per Kg");
    setStatus(item.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this metal price rate?")) return;
    const updated = prices.filter((item) => item.id !== id);
    savePricesToStorage(updated);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMetalType("Mild Steel (MS)");
    setCustomMetalType("");
    setPipeSize("25 x 25");
    setPipeSizeUom("mm");
    setPipeLength("20");
    setPipeLengthUom("feet");
    setMetalThickness("16");
    setMetalThicknessUom("Gauge (SWG)");
    setRate(78);
    setRateUnit("Per Kg");
    setStatus("active");
  };

  // Filter Logic
  const filteredPrices = prices.filter((item) => {
    const matchesMetal = filterMetalType === "All" || item.metalType === filterMetalType;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.metalType.toLowerCase().includes(term) ||
      (item.pipeSize && item.pipeSize.toLowerCase().includes(term)) ||
      (item.pipeLength && item.pipeLength.toLowerCase().includes(term)) ||
      (item.metalThickness && item.metalThickness.toLowerCase().includes(term)) ||
      item.rate.toString().includes(term);
    return matchesMetal && matchesSearch;
  });

  const uniqueMetalTypes = Array.from(new Set(prices.map((p) => p.metalType)));

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center", fontSize: 16 }}>Loading Metal Prices...</div>;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* CSS to remove high-low spinner stepper buttons from number inputs */}
      <style>{`
        .no-spin-arrows::-webkit-inner-spin-button,
        .no-spin-arrows::-webkit-outer-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
        .no-spin-arrows {
          -moz-appearance: textfield !important;
        }
      `}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
          Metal Prices
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Manage standard pricing rates for metal types, pipe sizes, pipe length, and thickness of metal specifications.
        </p>
      </div>

      {/* Form Card */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0" }}>
          {editingId ? "Edit Metal Price Rate" : "Add New Metal Price Rate"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", width: "100%", alignItems: "flex-start" }}>
            {/* 1. Type of Metal */}
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Type of Metal *
              </label>
              <select
                value={metalType}
                onChange={(e) => setMetalType(e.target.value)}
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
                {METAL_TYPE_PRESETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Metal Type if Other */}
            {metalType === "Other" && (
              <div style={{ flex: "1 1 180px" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Custom Metal Type *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Metal Type"
                  value={customMetalType}
                  onChange={(e) => setCustomMetalType(e.target.value)}
                  style={{ width: "100%", height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                />
              </div>
            )}

            {/* 2. Pipe Size with UOM */}
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Pipe Size *
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. 25 x 25, 1 x 1"
                  value={pipeSize}
                  onChange={(e) => setPipeSize(e.target.value)}
                  style={{ flex: 1, minWidth: 0, height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                />
                <select
                  value={pipeSizeUom}
                  onChange={(e) => setPipeSizeUom(e.target.value)}
                  style={{
                    width: "95px",
                    height: "42px",
                    padding: "8px 6px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 13,
                    backgroundColor: "#f8fafc",
                    color: "#1e293b",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {PIPE_SIZE_UOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Pipe Length with UOM */}
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Pipe Length *
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20, 12, 6.0"
                  value={pipeLength}
                  onChange={(e) => setPipeLength(e.target.value)}
                  style={{ flex: 1, minWidth: 0, height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                />
                <select
                  value={pipeLengthUom}
                  onChange={(e) => setPipeLengthUom(e.target.value)}
                  style={{
                    width: "105px",
                    height: "42px",
                    padding: "8px 6px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    backgroundColor: "#f8fafc",
                    color: "#1e293b",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {PIPE_LENGTH_UOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Thickness of Metal with UOM */}
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Thickness of Metal *
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14, 16, 2.0"
                  value={metalThickness}
                  onChange={(e) => setMetalThickness(e.target.value)}
                  style={{ flex: 1, minWidth: 0, height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                />
                <select
                  value={metalThicknessUom}
                  onChange={(e) => setMetalThicknessUom(e.target.value)}
                  style={{
                    width: "115px",
                    height: "42px",
                    padding: "8px 6px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    backgroundColor: "#f8fafc",
                    color: "#1e293b",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {METAL_THICKNESS_UOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Rate with Basis (Without high-low spin bar) */}
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Rate (₹) *
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Rate in ₹"
                  value={rate}
                  className="no-spin-arrows"
                  onChange={(e) => setRate(e.target.value ? Number(e.target.value) : "")}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: "42px",
                    boxSizing: "border-box",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#059669",
                  }}
                />
                <select
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value)}
                  style={{
                    width: "120px",
                    height: "42px",
                    padding: "8px 6px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    backgroundColor: "#f8fafc",
                    color: "#1e293b",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {RATE_UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6. Status */}
            <div style={{ flex: "1 1 120px" }}>
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
                padding: "9px 24px",
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
            Configured Metal Rates List ({filteredPrices.length})
          </h3>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select
              value={filterMetalType}
              onChange={(e) => setFilterMetalType(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, backgroundColor: "#ffffff" }}
            >
              <option value="All">All Metal Types</option>
              {uniqueMetalTypes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search size, length, thickness, rate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, width: "230px" }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Type of Metal</th>
                <th style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Pipe Size</th>
                <th style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Pipe Length</th>
                <th style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Thickness of Metal</th>
                <th style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Rate</th>
                <th style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Status</th>
                <th style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#475569", width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrices.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                    {item.metalType}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#2563eb" }}>
                    {formatDimension(item.pipeSize, item.pipeSizeUom)}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0284c7" }}>
                    {formatDimension(item.pipeLength, item.pipeLengthUom)}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#7c3aed" }}>
                    {formatDimension(item.metalThickness, item.metalThicknessUom)}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#059669", whiteSpace: "nowrap" }}>
                    ₹{Number(item.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    <span style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>/ {item.rateUnit || "Per Kg"}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
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
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 10 }}>
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
                  <td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#64748b" }}>
                    No metal price rates found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
