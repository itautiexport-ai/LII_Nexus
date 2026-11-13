import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { metalPricesApi, metalPriceError } from "../api/metalPricesApi";

export interface MetalPrice {
  id: string;
  metalType: string;
  pipeSize: string;
  pipeSizeUom: string;
  pipeLength: string;
  pipeLengthUom: string;
  metalThickness: string;
  metalThicknessUom: string;
  weight: string;
  weightUom: string;
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

const WEIGHT_UOM_OPTIONS = [
  { value: "kg", label: "Kg (kg)" },
  { value: "gm", label: "Gm (g)" },
];

const RATE_UNIT_OPTIONS = [
  { value: "Per Kg", label: "Per Kg (₹/Kg)" },
  { value: "Per Foot", label: "Per Foot (₹/ft)" },
  { value: "Per Meter", label: "Per Meter (₹/m)" },
  { value: "Per Piece", label: "Per Piece (₹/pc)" },
];

const LOCAL_STORAGE_KEY = "nexus_metal_prices";
const SERVER_CACHE_KEY = "nexus_metal_prices_server_cache";

function cacheServerPrices(rows: MetalPrice[]) {
  try { localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(rows)); } catch { /* Server remains authoritative if storage is full. */ }
}
export async function loadSyncedMetalPrices(): Promise<MetalPrice[]> {
  const rows = await metalPricesApi.list();
  cacheServerPrices(rows);
  return rows;
}


export function getLocalMetalPrices(): MetalPrice[] {
  try {
    const saved = localStorage.getItem(SERVER_CACHE_KEY) ?? localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      id: item.id || `mp-${Date.now()}`,
      metalType: item.metalType || "",
      pipeSize: item.pipeSize || item.size || "",
      pipeSizeUom: item.pipeSizeUom || item.sizeUom || "mm",
      pipeLength: item.pipeLength || item.length || "",
      pipeLengthUom: item.pipeLengthUom || item.lengthUom || "feet",
      metalThickness: item.metalThickness || item.thickness || "",
      metalThicknessUom: item.metalThicknessUom || item.thicknessUom || "Gauge (SWG)",
      weight: item.weight != null ? String(item.weight) : "",
      weightUom: item.weightUom || "kg",
      rate: Number(item.rate) || 0,
      rateUnit: item.rateUnit || "Per Kg",
      status: item.status || "active",
      createdAt: item.createdAt || "",
    }));
  } catch {
    return [];
  }
}

/** Unique "size" labels (e.g. "25 x 25 mm") for the costing sheet dropdown. */
export function getMetalSizeOptions(prices: MetalPrice[], costingType?: "Metal" | "SS"): string[] {
  const active = prices.filter((p) => p.status !== "inactive" && (p.pipeSize || "").trim());
  const isSs = (p: MetalPrice) => /stainless|\bss\b/i.test(p.metalType);
  let scoped = active;
  if (costingType === "SS") scoped = active.filter(isSs);
  else if (costingType === "Metal") scoped = active.filter((p) => !isSs(p));
  if (scoped.length === 0) scoped = active;

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of scoped) {
    const label = formatDimension(p.pipeSize, p.pipeSizeUom);
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

export function formatDimension(val?: string, uom?: string): string {
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

export function findMatchingMetalPrice(
  prices: MetalPrice[],
  costingType: "Metal" | "SS",
  size: string,
  thickness?: string
): MetalPrice | null {
  if (!size) return null;
  const active = prices.filter((p) => p.status !== "inactive");
  const isSs = (p: MetalPrice) => /stainless|\bss\b/i.test(p.metalType);
  const scoped = costingType === "SS" ? active.filter(isSs) : active.filter((p) => !isSs(p));
  const pool = scoped.length > 0 ? scoped : active;

  const cleanSize = (s: string) =>
    (s || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[xX*×]/g, "*")
      .replace(/mm|inch|in|"|cm/g, "")
      .trim();

  const targetSizeFormatted = size.trim().toLowerCase();
  const targetSizeClean = cleanSize(size);

  const cleanThickness = (t: string) => {
    const num = parseFloat(String(t || "").replace(/[^0-9.]/g, ""));
    return isNaN(num) ? String(t || "").trim().toLowerCase() : num.toString();
  };

  const targetThick = thickness ? cleanThickness(thickness) : "";

  // 1. If thickness provided, search for exact match on size + thickness
  if (targetThick) {
    const exactMatch = pool.find((p) => {
      const pSizeFormatted = formatDimension(p.pipeSize, p.pipeSizeUom).toLowerCase();
      const pSizeClean = cleanSize(p.pipeSize);
      const sizeMatches = pSizeFormatted === targetSizeFormatted || pSizeClean === targetSizeClean;
      if (!sizeMatches) return false;

      const pThick = cleanThickness(p.metalThickness || "");
      return pThick === targetThick;
    });
    if (exactMatch) return exactMatch;
  }

  // 2. Fallback to size match
  return (
    pool.find((p) => {
      const pSizeFormatted = formatDimension(p.pipeSize, p.pipeSizeUom).toLowerCase();
      const pSizeClean = cleanSize(p.pipeSize);
      return pSizeFormatted === targetSizeFormatted || pSizeClean === targetSizeClean;
    }) || null
  );
}

export default function MetalPricesPage() {
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State - strictly requested fields
  const [metalType, setMetalType] = useState("Mild Steel (MS)");
  const [customMetalType, setCustomMetalType] = useState("");
  const [pipeSize, setPipeSize] = useState("25 x 25");
  const [pipeSizeUom, setPipeSizeUom] = useState("mm");
  const [pipeLength, setPipeLength] = useState("6000");
  const [pipeLengthUom, setPipeLengthUom] = useState("mm");
  const [metalThickness, setMetalThickness] = useState("1.6");
  const [metalThicknessUom, setMetalThicknessUom] = useState("mm");
  const [weight, setWeight] = useState("");
  const [weightUom, setWeightUom] = useState("kg");
  const [rate, setRate] = useState<number | "">(140);
  const [rateUnit, setRateUnit] = useState("Per Kg");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter State
  const [filterMetalType, setFilterMetalType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [legacyRaw] = useState(() => localStorage.getItem(LOCAL_STORAGE_KEY));

  const loadData = async () => {
    setLoading(true);
    setError("");
    try { setPrices(await loadSyncedMetalPrices()); }
    catch (e) { setError(metalPriceError(e)); }
    finally { setLoading(false); }
  };
  const downloadLegacyBackup = () => {
    if (!legacyRaw) return;
    const url = URL.createObjectURL(new Blob([legacyRaw], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "metal-prices-browser-backup.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importLegacy = async () => {
    if (!legacyRaw || saving || !confirm("Import browser records into shared storage? Existing combinations will be skipped. Download a browser backup first.")) return;
    setSaving(true); setError("");
    try {
      const result = await metalPricesApi.importBrowser(JSON.parse(legacyRaw));
      await loadData();
      alert(`Imported ${result.inserted}, skipped ${result.skipped} existing combinations. Browser originals are unchanged.`);
    } catch (e) { setError(metalPriceError(e)); }
    finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (saving) { e.preventDefault(); return; }
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

    setSaving(true); setError("");
    try {
      await metalPricesApi.save({
        metalType: finalMetalType, pipeSize: pipeSize.trim(), pipeSizeUom,
        pipeLength: pipeLength.trim(), pipeLengthUom, metalThickness: metalThickness.trim(),
        metalThicknessUom, weight: weight.trim(), weightUom, rate: Number(rate), rateUnit, status,
      }, editingId || undefined);
      await loadData();
      handleCancelEdit();
    } catch (e) { setError(metalPriceError(e)); }
    finally { setSaving(false); }
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
    setWeight(item.weight || "");
    setWeightUom(item.weightUom || "kg");
    setRate(item.rate);
    setRateUnit(item.rateUnit || "Per Kg");
    setStatus(item.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (saving || !confirm("Are you sure you want to delete this metal price rate?")) return;
    setSaving(true); setError("");
    try { await metalPricesApi.remove(id); await loadData(); }
    catch (e) { setError(metalPriceError(e)); }
    finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMetalType("Mild Steel (MS)");
    setCustomMetalType("");
    setPipeSize("25 x 25");
    setPipeSizeUom("mm");
    setPipeLength("6000");
    setPipeLengthUom("mm");
    setMetalThickness("1.6");
    setMetalThicknessUom("mm");
    setWeight("");
    setWeightUom("kg");
    setRate(140);
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
      (item.weight && item.weight.toLowerCase().includes(term)) ||
      item.rate.toString().includes(term);
    return matchesMetal && matchesSearch;
  });

  const uniqueMetalTypes = Array.from(new Set(prices.map((p) => p.metalType)));

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center", fontSize: 16 }}>Loading Metal Prices...</div>;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {error && <div role="alert" style={{ color: "#991b1b", padding: 12 }}>{error} <button type="button" onClick={loadData}>Retry loading</button></div>}
      {saving && <p role="status">Saving to server…</p>}
      {legacyRaw && <aside style={{ padding: 12, background: "#fffbeb", marginBottom: 16 }}>
        Existing browser records are preserved separately. Import skips combinations already on the server.
        <button type="button" onClick={downloadLegacyBackup}>Download browser backup</button>
        <button type="button" disabled={saving} onClick={importLegacy}>Import browser records</button>
      </aside>}

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
        <div style={{ marginBottom: 10 }}>
          <Link
            to="/admin/master-data/costing"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            &larr; Back to Costing Master
          </Link>
        </div>
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
                onChange={(e) => {
                  const value = e.target.value;
                  setMetalType(value);
                  if (!editingId && value === "Mild Steel (MS)") setRate(140);
                  if (!editingId && value === "Stainless Steel (SS 202)") setRate(340);
                }}
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

            {/* 5. Weight with UOM */}
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Weight
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5.2"
                  value={weight}
                  className="no-spin-arrows"
                  onChange={(e) => setWeight(e.target.value)}
                  style={{ flex: 1, minWidth: 0, height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                />
                <select
                  value={weightUom}
                  onChange={(e) => setWeightUom(e.target.value)}
                  style={{
                    width: "95px",
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
                  {WEIGHT_UOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6. Rate with Basis (Without high-low spin bar) */}
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

            {/* 7. Status */}
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
              disabled={saving}
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
                <th style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Weight</th>
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
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#b45309", whiteSpace: "nowrap" }}>
                    {item.weight ? `${item.weight} ${item.weightUom === "gm" ? "g" : "kg"}` : "—"}
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
                  <td colSpan={8} style={{ padding: 28, textAlign: "center", color: "#64748b" }}>
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
