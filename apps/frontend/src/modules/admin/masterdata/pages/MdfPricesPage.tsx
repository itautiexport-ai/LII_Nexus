import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { masterDataApi, MdfPriceRecord } from "../api/masterDataApi";
import { getCachedUomOptions, loadMergedUomOptions } from "./AdditionalCostsPage";

const LOCAL_STORAGE_KEY = "nexus_mdf_prices";

const MDF_TYPE_SUGGESTIONS = [
  "Plain MDF",
  "HDHMR",
  "Pre-Laminated MDF",
  "Veneer MDF",
  "Exterior Grade MDF",
  "Waterproof MDF",
  "Commercial Plywood",
  "Marine Plywood",
];

export function getLocalMdfPrices(): MdfPriceRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          id: String(item.id || `mdf-${Date.now()}`),
          mdfType: String(item.mdfType ?? ""),
          sheetSize: String(item.sheetSize ?? ""),
          thickness: String(item.thickness ?? ""),
          price: Number(item.price) || 0,
          uom: String(item.uom ?? ""),
          status: item.status === "inactive" ? "inactive" : "active",
        }));
      }
    }
  } catch (e) {
    console.error("Failed to read local MDF prices", e);
  }
  return [];
}

export async function loadSyncedMdfPrices(): Promise<MdfPriceRecord[]> {
  const localItems = getLocalMdfPrices();
  try {
    const remoteItems = await masterDataApi.getMdfPrices();
    if (Array.isArray(remoteItems)) {
      const remoteIds = new Set(remoteItems.map((r) => r.id));
      const unsyncedLocal = localItems.filter((l) => !remoteIds.has(l.id));
      if (unsyncedLocal.length > 0) {
        await Promise.all(
          unsyncedLocal.map((item) =>
            masterDataApi
              .createMdfPrice({
                id: item.id,
                mdfType: item.mdfType,
                sheetSize: item.sheetSize,
                thickness: item.thickness,
                price: item.price,
                uom: item.uom || "",
                status: item.status || "active",
              })
              .catch(() => null)
          )
        );
        const refreshed = await masterDataApi.getMdfPrices().catch(() => [
          ...unsyncedLocal,
          ...remoteItems,
        ]);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(refreshed));
        return refreshed;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteItems));
      return remoteItems;
    }
  } catch {
    // Fallback seamlessly to localStorage when backend is offline
  }
  return localItems;
}

export function getMdfRecordsForType(
  woodType: string,
  mdfPrices: MdfPriceRecord[]
): MdfPriceRecord[] {
  const cleanWood = (woodType || "").trim().toLowerCase();
  if (!cleanWood) return [];
  const active = mdfPrices.filter((m) => m.status !== "inactive");
  const exact = active.filter((m) => (m.mdfType || "").trim().toLowerCase() === cleanWood);
  if (exact.length > 0) return exact;
  if (cleanWood === "mdf" || cleanWood === "hdhmr") {
    return active.filter((m) => (m.mdfType || "").trim().toLowerCase().includes(cleanWood));
  }
  return [];
}

export function isMdfType(woodType: string, mdfPrices: MdfPriceRecord[]): boolean {
  const cleanWood = (woodType || "").trim().toLowerCase();
  if (!cleanWood) return false;
  if (cleanWood.includes("mdf") || cleanWood.includes("hdhmr")) return true;
  return getMdfRecordsForType(woodType, mdfPrices).length > 0;
}

export function findMatchingMdfPrice(
  woodType: string,
  thicknessInput: number | string,
  lengthFtInput: number | string,
  widthInInput: number | string,
  mdfPrices: MdfPriceRecord[]
): MdfPriceRecord | null {
  const candidates = getMdfRecordsForType(woodType, mdfPrices);
  if (candidates.length === 0) return null;

  const rawThickStr = String(thicknessInput ?? "")
    .replace(/mm|inch|in|"/gi, "")
    .trim();
  const tVal = typeof thicknessInput === "number" ? thicknessInput : parseFloat(rawThickStr);
  if (Number.isNaN(tVal) || tVal <= 0) {
    return null;
  }

  const thickMatched = candidates.filter((m) => {
    const mThick = parseFloat(
      String(m.thickness || "")
        .replace(/mm|inch|in|"/gi, "")
        .trim()
    );
    if (Number.isNaN(mThick) || mThick <= 0) return false;
    return Math.abs(mThick - tVal) < 0.05;
  });

  if (thickMatched.length === 0) return null;
  if (thickMatched.length === 1) return thickMatched[0];

  const lVal = typeof lengthFtInput === "number" ? lengthFtInput : parseFloat(String(lengthFtInput));
  const wInVal = typeof widthInInput === "number" ? widthInInput : parseFloat(String(widthInInput));

  if (!Number.isNaN(lVal) && lVal > 0) {
    for (const m of thickMatched) {
      const dimMatch = String(m.sheetSize || "").match(/(\d+(?:\.\d+)?)\s*[xX×*]\s*(\d+(?:\.\d+)?)/);
      if (dimMatch) {
        const sLen = parseFloat(dimMatch[1]);
        const sWidFt = parseFloat(dimMatch[2]);
        const exactLen = Math.abs(sLen - lVal) < 0.05;
        const exactWid = !Number.isNaN(wInVal) && wInVal > 0 && Math.abs(sWidFt * 12 - wInVal) < 0.5;
        if (exactLen && exactWid) return m;
        if (exactLen) return m;
      }
    }
  }

  return thickMatched[0];
}

export default function MdfPricesPage() {
  const [items, setItems] = useState<MdfPriceRecord[]>([]);
  const [uomOptions, setUomOptions] = useState<string[]>(() => getCachedUomOptions());
  const [mdfType, setMdfType] = useState("");
  const [sheetSize, setSheetSize] = useState("");
  const [thickness, setThickness] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [uom, setUom] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const saveToStorage = (updated: MdfPriceRecord[]) => {
    setItems(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  async function loadData() {
    setLoading(true);
    try {
      const [list, mergedUoms] = await Promise.all([
        loadSyncedMdfPrices(),
        loadMergedUomOptions(),
      ]);
      setItems(Array.isArray(list) ? list : []);
      setUomOptions(mergedUoms);
    } catch (err) {
      console.error("Failed to load MDF prices:", err);
      setItems(getLocalMdfPrices());
      setUomOptions(getCachedUomOptions());
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mdfType.trim() || !thickness.trim()) return;
    setSubmitting(true);
    setError(null);

    const cleanType = mdfType.trim();
    const cleanSize = sheetSize.trim();
    const cleanThickness = thickness.trim();
    const cleanPrice = Number(price) || 0;
    const cleanUom = uom.trim();

    try {
      if (editingId) {
        const payload = {
          mdfType: cleanType,
          sheetSize: cleanSize,
          thickness: cleanThickness,
          price: cleanPrice,
          uom: cleanUom,
        };
        try {
          await masterDataApi.updateMdfPrice(editingId, payload);
        } catch (err) {
          console.warn("Saved MDF update locally; will sync when server is reachable", err);
        }
        const updated = items.map((row) =>
          row.id === editingId
            ? {
                ...row,
                mdfType: cleanType,
                sheetSize: cleanSize,
                thickness: cleanThickness,
                price: cleanPrice,
                uom: cleanUom,
              }
            : row
        );
        saveToStorage(updated);
        setEditingId(null);
      } else {
        const tempId = `mdf-${Date.now()}`;
        let newRecord: MdfPriceRecord = {
          id: tempId,
          mdfType: cleanType,
          sheetSize: cleanSize,
          thickness: cleanThickness,
          price: cleanPrice,
          uom: cleanUom,
          status: "active",
        };
        try {
          const created = await masterDataApi.createMdfPrice({
            id: tempId,
            mdfType: cleanType,
            sheetSize: cleanSize,
            thickness: cleanThickness,
            price: cleanPrice,
            uom: cleanUom,
          });
          newRecord = {
            ...created,
            uom: created.uom || cleanUom,
          };
        } catch (err) {
          console.warn("Saved new MDF price locally; will sync when server is reachable", err);
        }
        saveToStorage([newRecord, ...items]);
      }

      setMdfType("");
      setSheetSize("");
      setThickness("");
      setPrice("");
      setUom("");
    } catch (err: any) {
      setError(err?.message || `Failed to ${editingId ? "update" : "add"} MDF Price.`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item: MdfPriceRecord) {
    setEditingId(item.id);
    setMdfType(item.mdfType || "");
    setSheetSize(item.sheetSize || "");
    setThickness(item.thickness || "");
    setPrice(item.price ?? 0);
    setUom(item.uom || "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setMdfType("");
    setSheetSize("");
    setThickness("");
    setPrice("");
    setUom("");
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this MDF Price item?")) return;
    try {
      await masterDataApi.deleteMdfPrice(id);
    } catch (err) {
      console.warn("Deleted MDF price locally; server unreachable", err);
    }
    if (editingId === id) {
      cancelEdit();
    }
    saveToStorage(items.filter((row) => row.id !== id));
  }

  const displayedUomOptions = (() => {
    if (uom && !uomOptions.some((u) => u.toLowerCase() === uom.toLowerCase())) {
      return [uom, ...uomOptions];
    }
    return uomOptions;
  })();

  return (
    <div style={{ padding: 24, maxWidth: 1080, margin: "0 auto" }}>
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

      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 24px 0" }}>
        MDF Prices
      </h2>

      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: 24,
        }}
      >
        <datalist id="mdf-type-suggestions">
          {MDF_TYPE_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180, flex: 1.3 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              MDF Type
            </label>
            <input
              type="text"
              list="mdf-type-suggestions"
              value={mdfType}
              onChange={(e) => setMdfType(e.target.value)}
              placeholder="e.g. Plain MDF, HDHMR"
              required
              style={{
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130, flex: 0.9 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Sheet Size
            </label>
            <input
              type="text"
              value={sheetSize}
              onChange={(e) => setSheetSize(e.target.value)}
              placeholder="e.g. 8x4"
              required
              style={{
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130, flex: 0.9 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Thickness (mm)
            </label>
            <input
              type="text"
              value={thickness}
              onChange={(e) => setThickness(e.target.value)}
              placeholder="e.g. 12, 18"
              required
              style={{
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 120, flex: 0.9 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="no-spin-arrows"
              value={price}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              required
              style={{
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140, flex: 0.9 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              UOM
            </label>
            <select
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              required
              style={{
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: "#ffffff",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              <option value="">-- Select UOM --</option>
              {displayedUomOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 18px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={submitting}
                style={{
                  padding: "10px 16px",
                  background: "#f1f5f9",
                  color: "#475569",
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
          </div>
        </form>
        {error && <p style={{ color: "#dc2626", marginTop: 12, marginBottom: 0, fontSize: 13 }}>{error}</p>}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                MDF Type
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Sheet Size
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Thickness (mm)
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Price
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                UOM
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151", width: 140 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  No MDF Price items added yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#0f172a", fontWeight: 500 }}>
                    {item.mdfType}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>
                    {item.sheetSize || "-"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>
                    {item.thickness ? `${item.thickness} mm` : "-"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                    ₹{Number(item.price || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151", fontWeight: 500 }}>
                    {item.uom || "-"}
                  </td>
                  <td style={{ padding: "12px 16px", display: "flex", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        padding: 0,
                      }}
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
    </div>
  );
}

