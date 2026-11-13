import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { masterDataApi, WoodType, Uom } from "../api/masterDataApi";

export interface WoodThicknessPrice {
  id: string;
  woodType: string;
  thickness: string;
  thicknessUom: string;
  length: string;
  lengthUom: string;
  ratePerCft: number;
  status: "active" | "inactive";
  createdAt: string;
}

const DEFAULT_THICKNESS_UOMS = [
  { value: "inch", label: 'Inch (")' },
  { value: "mm", label: "MM (mm)" },
  { value: "cm", label: "CM (cm)" },
  { value: "feet", label: "Feet (ft)" },
];

const DEFAULT_LENGTH_UOMS = [
  { value: "feet", label: "Feet (ft)" },
  { value: "inch", label: 'Inch (")' },
  { value: "meter", label: "Meter (m)" },
  { value: "mm", label: "MM (mm)" },
  { value: "cm", label: "CM (cm)" },
];

const DEFAULT_WOOD_THICKNESS_PRICES: WoodThicknessPrice[] = [
  // Sheesham (Length-based pricing)
  { id: "wtp-s1", woodType: "Sheesham", thickness: "—", thicknessUom: "inch", length: "<= 4.0", lengthUom: "feet", ratePerCft: 1150, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-s2", woodType: "Sheesham", thickness: "—", thicknessUom: "inch", length: "4.0 - 5.0", lengthUom: "feet", ratePerCft: 1250, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-s3", woodType: "Sheesham", thickness: "—", thicknessUom: "inch", length: "5.0 - 6.0", lengthUom: "feet", ratePerCft: 1450, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-s4", woodType: "Sheesham", thickness: "—", thicknessUom: "inch", length: "6.0 - 7.0", lengthUom: "feet", ratePerCft: 1600, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-s5", woodType: "Sheesham", thickness: "—", thicknessUom: "inch", length: ">= 7.0", lengthUom: "feet", ratePerCft: 1800, status: "active", createdAt: "2026-10-01" },
  // Mango (Length-based pricing)
  { id: "wtp-m1", woodType: "Mango", thickness: "—", thicknessUom: "inch", length: "<= 4.0", lengthUom: "feet", ratePerCft: 650, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-m2", woodType: "Mango", thickness: "—", thicknessUom: "inch", length: "4.0 - 5.0", lengthUom: "feet", ratePerCft: 750, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-m3", woodType: "Mango", thickness: "—", thicknessUom: "inch", length: "5.0 - 6.0", lengthUom: "feet", ratePerCft: 850, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-m4", woodType: "Mango", thickness: "—", thicknessUom: "inch", length: ">= 6.0", lengthUom: "feet", ratePerCft: 950, status: "active", createdAt: "2026-10-01" },
  // Acacia (Length-based pricing)
  { id: "wtp-a1", woodType: "Acacia", thickness: "—", thicknessUom: "inch", length: "<= 5.0", lengthUom: "feet", ratePerCft: 950, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-a2", woodType: "Acacia", thickness: "—", thicknessUom: "inch", length: "5.0 - 6.0", lengthUom: "feet", ratePerCft: 1100, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-a3", woodType: "Acacia", thickness: "—", thicknessUom: "inch", length: ">= 6.0", lengthUom: "feet", ratePerCft: 1250, status: "active", createdAt: "2026-10-01" },
  // Teak (Length-based pricing)
  { id: "wtp-t1", woodType: "Teak", thickness: "—", thicknessUom: "inch", length: "<= 5.0", lengthUom: "feet", ratePerCft: 2600, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-t2", woodType: "Teak", thickness: "—", thicknessUom: "inch", length: "5.0 - 7.0", lengthUom: "feet", ratePerCft: 3200, status: "active", createdAt: "2026-10-01" },
  { id: "wtp-t3", woodType: "Teak", thickness: "—", thicknessUom: "inch", length: ">= 7.0", lengthUom: "feet", ratePerCft: 3800, status: "active", createdAt: "2026-10-01" },
];

const LOCAL_STORAGE_KEY = "nexus_wood_thickness_prices";

export function getLocalWoodThicknessPrices(): WoodThicknessPrice[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          ...item,
          thickness: String(item.thickness ?? "1.0").replace(/["\s]/g, "") || String(item.thickness ?? "1.0"),
          thicknessUom:
            item.thicknessUom ||
            (String(item.thickness ?? "").includes("mm")
              ? "mm"
              : String(item.thickness ?? "").includes("cm")
              ? "cm"
              : "inch"),
          length: String(item.length ?? "6.0"),
          lengthUom: item.lengthUom || "feet",
          ratePerCft: Number(item.ratePerCft) || 0,
          status: item.status === "inactive" ? "inactive" : "active",
        }));
      }
    }
  } catch (e) {
    console.error("Failed to read local wood thickness prices", e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_WOOD_THICKNESS_PRICES));
  return DEFAULT_WOOD_THICKNESS_PRICES;
}

export async function loadSyncedWoodThicknessPrices(): Promise<WoodThicknessPrice[]> {
  const localItems = getLocalWoodThicknessPrices();
  try {
    const remoteItems = await masterDataApi.getWoodThicknessPrices();
    if (Array.isArray(remoteItems) && remoteItems.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteItems));
      return remoteItems;
    }
    // Seed empty remote table once from existing local/default items
    if (Array.isArray(remoteItems) && remoteItems.length === 0 && localItems.length > 0) {
      await Promise.all(
        localItems.map((item) =>
          masterDataApi
            .createWoodThicknessPrice({
              id: item.id,
              woodType: item.woodType,
              thickness: item.thickness,
              thicknessUom: item.thicknessUom,
              length: item.length,
              lengthUom: item.lengthUom,
              ratePerCft: item.ratePerCft,
              status: item.status,
            })
            .catch(() => null)
        )
      );
    }
  } catch {
    // Fallback to localStorage seamlessly if offline
  }
  return localItems;
}

function convertDimension(val: number, uom: string, targetUnit: "inch" | "feet"): number {
  const u = (uom || "").trim().toLowerCase();
  if (targetUnit === "inch") {
    if (u === "mm") return val / 25.4;
    if (u === "cm") return val / 2.54;
    if (u === "feet" || u === "ft" || u === "'") return val * 12;
    if (u === "meter" || u === "m") return val * 39.3700787;
    return val;
  } else {
    if (u === "inch" || u === "in" || u === '"') return val / 12;
    if (u === "mm") return val / 304.8;
    if (u === "cm") return val / 30.48;
    if (u === "meter" || u === "m") return val * 3.2808399;
    return val;
  }
}

function matchSingleDimension(
  rawSpec: string,
  uom: string,
  inputVal: number,
  targetUnit: "inch" | "feet"
): { matched: boolean; exact: boolean } {
  if (!rawSpec) return { matched: false, exact: false };
  const cleaned = String(rawSpec)
    .replace(/inch|in|feet|ft|meter|mm|cm|"|'/gi, "")
    .trim();

  // Check range syntax e.g. "5-7", "5 - 7", "5 to 7"
  const rangeMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)$/i);
  if (rangeMatch) {
    const low = convertDimension(parseFloat(rangeMatch[1]), uom, targetUnit);
    const high = convertDimension(parseFloat(rangeMatch[2]), uom, targetUnit);
    const min = Math.min(low, high);
    const max = Math.max(low, high);
    return { matched: inputVal >= min - 0.01 && inputVal <= max + 0.01, exact: false };
  }

  // Check comparison syntax e.g. "<=6", ">=6"
  const cmpMatch = cleaned.match(/^(<=|>=|<|>)\s*(\d+(?:\.\d+)?)$/);
  if (cmpMatch) {
    const op = cmpMatch[1];
    const bound = convertDimension(parseFloat(cmpMatch[2]), uom, targetUnit);
    if (op === "<=") return { matched: inputVal <= bound + 0.01, exact: false };
    if (op === ">=") return { matched: inputVal >= bound - 0.01, exact: false };
    if (op === "<") return { matched: inputVal < bound, exact: false };
    if (op === ">") return { matched: inputVal > bound, exact: false };
  }

  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return { matched: false, exact: false };
  const converted = convertDimension(num, uom, targetUnit);
  const isEqual = Math.abs(converted - inputVal) < 0.02;
  return { matched: isEqual, exact: isEqual };
}

export function findMatchingWoodPriceByLength(
  woodType: string,
  lengthFt: number | string,
  prices: WoodThicknessPrice[],
  thickIn?: number | string
): number | null {
  const cleanWood = (woodType || "").trim().toLowerCase();
  const lVal = typeof lengthFt === "number" ? lengthFt : parseFloat(String(lengthFt));

  if (!cleanWood || Number.isNaN(lVal) || lVal <= 0) {
    return null;
  }

  const tVal =
    thickIn !== undefined && thickIn !== ""
      ? typeof thickIn === "number"
        ? thickIn
        : parseFloat(String(thickIn))
      : NaN;

  // Filter active prices for this wood type
  const matchingPrices = prices.filter(
    (p) => p.status !== "inactive" && (p.woodType || "").trim().toLowerCase() === cleanWood
  );

  if (matchingPrices.length === 0) return null;

  // 1. Try exact or range length match (primary matching criterion)
  let bestMatch: { price: WoodThicknessPrice; score: number } | null = null;

  for (const p of matchingPrices) {
    const lMatch = matchSingleDimension(p.length, p.lengthUom || "feet", lVal, "feet");
    if (!lMatch.matched) continue;

    let score = lMatch.exact ? 10 : 5;

    // Optional tie-breaker on thickness if thickness is also matched
    if (!Number.isNaN(tVal) && tVal > 0 && p.thickness && p.thickness !== "—" && p.thickness.toLowerCase() !== "any") {
      const tMatch = matchSingleDimension(p.thickness, p.thicknessUom || "inch", tVal, "inch");
      if (tMatch.matched) {
        score += tMatch.exact ? 2 : 1;
      }
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { price: p, score };
      if (score === 12) break; // Exact match on length and thickness
    }
  }

  if (bestMatch) {
    return Number(bestMatch.price.ratePerCft) || 0;
  }

  // 2. Nearest length match if no exact range match
  let closest: { price: WoodThicknessPrice; diff: number } | null = null;
  for (const p of matchingPrices) {
    const pLenVal = parseFloat(String(p.length).replace(/[^0-9.]/g, ""));
    if (Number.isNaN(pLenVal) || pLenVal <= 0) continue;
    const pLenInFeet = convertDimension(pLenVal, p.lengthUom || "feet", "feet");
    const diff = Math.abs(pLenInFeet - lVal);
    if (!closest || diff < closest.diff) {
      closest = { price: p, diff };
    }
  }

  if (closest) {
    return Number(closest.price.ratePerCft) || 0;
  }

  return Number(matchingPrices[0].ratePerCft) || 0;
}

export function findMatchingWoodThicknessRate(
  woodType: string,
  thickIn: number | string | undefined,
  lengthFt: number | string,
  prices: WoodThicknessPrice[]
): number | null {
  // Length is now the primary price driver per user requirement:
  // "in wood costing take the prices as per the length instead of thickness from the master"
  return findMatchingWoodPriceByLength(woodType, lengthFt, prices, thickIn);
}

function formatDimension(val?: string, uom?: string): string {
  if (!val || val === "—") return "—";
  const cleanedVal = val.trim();
  if (cleanedVal.includes('"') || cleanedVal.includes("'") || cleanedVal.toLowerCase().includes("ft") || cleanedVal.toLowerCase().includes("mm")) {
    return cleanedVal;
  }
  const u = (uom || "").toLowerCase();
  if (u === "inch" || u === '"' || u === "in") return `${cleanedVal}"`;
  if (u === "feet" || u === "'" || u === "ft") return `${cleanedVal} ft`;
  if (u === "mm") return `${cleanedVal} mm`;
  if (u === "cm") return `${cleanedVal} cm`;
  if (u === "meter" || u === "m") return `${cleanedVal} m`;
  return uom ? `${cleanedVal} ${uom}` : cleanedVal;
}

export default function WoodThicknessPricesPage() {
  const [prices, setPrices] = useState<WoodThicknessPrice[]>([]);
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([]);
  const [thicknessUomOptions, setThicknessUomOptions] = useState(DEFAULT_THICKNESS_UOMS);
  const [lengthUomOptions, setLengthUomOptions] = useState(DEFAULT_LENGTH_UOMS);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedWoodType, setSelectedWoodType] = useState("Sheesham");
  const [customWoodType, setCustomWoodType] = useState("");
  const [thickness, setThickness] = useState("1.0");
  const [thicknessUom, setThicknessUom] = useState("inch");
  const [length, setLength] = useState("6.0");
  const [lengthUom, setLengthUom] = useState("feet");
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
      // Load Wood Types & UOMs from Master Data API
      const [wtList, uomList] = await Promise.all([
        masterDataApi.getWoodTypes().catch(() => []),
        masterDataApi.getUoms().catch(() => []),
      ]);

      setWoodTypes(wtList || []);
      if (wtList.length > 0) {
        setSelectedWoodType(wtList[0].name);
      }

      // Merge master data UOMs if any exist
      if (uomList && uomList.length > 0) {
        const extraThick = uomList
          .filter((u: Uom) => !DEFAULT_THICKNESS_UOMS.some((d) => d.value.toLowerCase() === u.name.toLowerCase()))
          .map((u: Uom) => ({ value: u.name.toLowerCase(), label: u.name }));
        setThicknessUomOptions([...DEFAULT_THICKNESS_UOMS, ...extraThick]);

        const extraLen = uomList
          .filter((u: Uom) => !DEFAULT_LENGTH_UOMS.some((d) => d.value.toLowerCase() === u.name.toLowerCase()))
          .map((u: Uom) => ({ value: u.name.toLowerCase(), label: u.name }));
        setLengthUomOptions([...DEFAULT_LENGTH_UOMS, ...extraLen]);
      }

      // Load Wood Thickness Prices (synced with backend + localStorage)
      const syncedPrices = await loadSyncedWoodThicknessPrices();
      setPrices(syncedPrices);
    } catch (e) {
      console.error("Error loading wood thickness prices", e);
      setPrices(getLocalWoodThicknessPrices());
    } finally {
      setLoading(false);
    }
  };

  const savePricesToStorage = (updated: WoodThicknessPrice[]) => {
    setPrices(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalWoodType = selectedWoodType === "Other" ? customWoodType.trim() : selectedWoodType;
    if (!finalWoodType) {
      alert("Please specify a Wood Type");
      return;
    }
    if (!length.trim()) {
      alert("Please enter length (Length is the primary price basis for CFT)");
      return;
    }
    const finalThickness = thickness.trim() || "—";
    const rate = Number(ratePerCft) || 0;

    if (editingId) {
      const payload = {
        woodType: finalWoodType,
        thickness: finalThickness,
        thicknessUom,
        length: length.trim(),
        lengthUom,
        ratePerCft: rate,
        status,
      };
      try {
        await masterDataApi.updateWoodThicknessPrice(editingId, payload);
      } catch (err) {
        console.error("Failed to sync updated wood thickness price to server", err);
      }
      const updated = prices.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...payload,
            }
          : item
      );
      savePricesToStorage(updated);
      alert("Wood length price rate updated successfully!");
    } else {
      const tempId = `wtp-${Date.now()}`;
      let savedRecord: WoodThicknessPrice = {
        id: tempId,
        woodType: finalWoodType,
        thickness: finalThickness,
        thicknessUom,
        length: length.trim(),
        lengthUom,
        ratePerCft: rate,
        status,
        createdAt: new Date().toISOString().split("T")[0],
      };
      try {
        savedRecord = await masterDataApi.createWoodThicknessPrice({
          id: tempId,
          woodType: savedRecord.woodType,
          thickness: savedRecord.thickness,
          thicknessUom: savedRecord.thicknessUom,
          length: savedRecord.length,
          lengthUom: savedRecord.lengthUom,
          ratePerCft: savedRecord.ratePerCft,
          status: savedRecord.status,
        });
      } catch (err) {
        console.error("Failed to sync new wood thickness price to server", err);
      }
      savePricesToStorage([savedRecord, ...prices]);
      alert("Wood thickness price rate added successfully!");
    }

    // Reset Form
    handleCancelEdit();
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
    setThickness(item.thickness.replace(/["\s]/g, "") || item.thickness);
    setThicknessUom(item.thicknessUom || "inch");
    setLength(item.length || "6.0");
    setLengthUom(item.lengthUom || "feet");
    setRatePerCft(item.ratePerCft);
    setStatus(item.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wood thickness price rate?")) return;
    try {
      await masterDataApi.deleteWoodThicknessPrice(id);
    } catch (err) {
      console.error("Failed to delete wood thickness price on server", err);
    }
    const updated = prices.filter((item) => item.id !== id);
    savePricesToStorage(updated);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setThickness("1.0");
    setThicknessUom("inch");
    setLength("6.0");
    setLengthUom("feet");
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
      (item.length && item.length.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.ratePerCft.toString().includes(searchTerm);
    return matchesWood && matchesSearch;
  });

  const uniqueWoodTypesList = Array.from(new Set(prices.map((p) => p.woodType)));

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center", fontSize: 16 }}>Loading Wood Thickness Prices...</div>;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1150, margin: "0 auto" }}>
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
          Wood Thickness & Size Prices
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Manage standard pricing rates per CFT for various wood types, length, and thickness specifications with custom UOM selection.
        </p>
      </div>

      {/* Form Card */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0" }}>
          {editingId ? "Edit Wood Thickness & Size Price Rate" : "Add New Wood Thickness & Size Price Rate"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", width: "100%", alignItems: "flex-start" }}>
            {/* Wood Type Selection */}
            <div style={{ flex: "1 1 200px" }}>
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
              <div style={{ flex: "1 1 180px" }}>
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

            {/* Length with UOM selector (Primary price basis) */}
            <div style={{ flex: "1 1 210px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Length * (Primary Price Basis)
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  required
                  placeholder='e.g. 6.0, 5-7, <=6'
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  style={{ flex: 1, minWidth: 0, height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                />
                <select
                  value={lengthUom}
                  onChange={(e) => setLengthUom(e.target.value)}
                  title="Select Length UOM"
                  style={{
                    width: "100px",
                    height: "42px",
                    padding: "8px 8px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 13,
                    backgroundColor: "#f8fafc",
                    color: "#1e293b",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {lengthUomOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thickness with UOM selector (Optional) */}
            <div style={{ flex: "1 1 210px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Thickness (Optional)
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder='e.g. 1.0, 0.75, Any'
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  style={{ flex: 1, minWidth: 0, height: "42px", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                />
                <select
                  value={thicknessUom}
                  onChange={(e) => setThicknessUom(e.target.value)}
                  title="Select Thickness UOM"
                  style={{
                    width: "100px",
                    height: "42px",
                    padding: "8px 8px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 13,
                    backgroundColor: "#f8fafc",
                    color: "#1e293b",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {thicknessUomOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rate per CFT (without high-low spin bar) */}
            <div style={{ flex: "1 1 170px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Rate per CFT (₹) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Rate in ₹"
                value={ratePerCft}
                className="no-spin-arrows"
                onChange={(e) => setRatePerCft(e.target.value ? Number(e.target.value) : "")}
                style={{
                  width: "100%",
                  height: "42px",
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Status */}
            <div style={{ flex: "1 1 130px" }}>
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
            Configured Rates List ({filteredPrices.length})
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
              placeholder="Search wood, size, rate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, width: "220px" }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Wood Type</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Length (Primary Basis)</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Thickness (Optional)</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Rate per CFT (₹)</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Status</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569", width: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrices.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{item.woodType}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#7c3aed" }}>
                    {formatDimension(item.length, item.lengthUom)}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#2563eb" }}>
                    {formatDimension(item.thickness, item.thicknessUom)}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#059669", whiteSpace: "nowrap" }}>
                    ₹{Number(item.ratePerCft).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                    No wood thickness & size prices found.
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
