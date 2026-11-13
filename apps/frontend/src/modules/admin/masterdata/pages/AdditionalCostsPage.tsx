import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdditionalCostRecord, masterDataApi, Uom } from "../api/masterDataApi";

const LOCAL_STORAGE_KEY = "nexus_additional_costs";
const CACHED_UOMS_STORAGE_KEY = "nexus_cached_uoms";

export const DEFAULT_UOM_OPTIONS: string[] = [
  "Pcs",
  "Pieces",
  "Pairs",
  "Set",
  "Nos",
  "Sq.ft",
  "Sq.in",
  "Sq.mtr",
  "Cft",
  "Cbm",
  "Rft",
  "Ft",
  "Inch",
  "Meters",
  "Cm",
  "Mm",
  "Kg",
  "Gm",
  "Ton",
  "Liters",
  "Ml",
  "Sheet",
  "Roll",
  "Yard",
  "Box",
  "Packet",
  "Bag",
  "Dozen",
];

export function mergeUomNames(customNames: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const raw of [...customNames, ...DEFAULT_UOM_OPTIONS]) {
    const clean = (raw || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(clean);
  }
  return merged;
}

export function getCachedUomOptions(): string[] {
  try {
    const saved = localStorage.getItem(CACHED_UOMS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return mergeUomNames(parsed.map((v: any) => String(v?.name ?? v ?? "")));
      }
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_UOM_OPTIONS];
}

export async function loadMergedUomOptions(): Promise<string[]> {
  try {
    const remoteUoms: Uom[] = await masterDataApi.getUoms();
    if (Array.isArray(remoteUoms)) {
      const names = remoteUoms.map((u) => (u.name || "").trim()).filter(Boolean);
      localStorage.setItem(CACHED_UOMS_STORAGE_KEY, JSON.stringify(names));
      return mergeUomNames(names);
    }
  } catch {
    // Fallback to cached + default UOMs when server is unreachable
  }
  return getCachedUomOptions();
}

export function getLocalAdditionalCosts(): AdditionalCostRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          id: String(item.id || `ac-${Date.now()}`),
          itemCode: String(item.itemCode ?? ""),
          itemName: String(item.itemName ?? ""),
          price: Number(item.price) || 0,
          uom: String(item.uom ?? ""),
          status: item.status === "inactive" ? "inactive" : "active",
        }));
      }
    }
  } catch (e) {
    console.error("Failed to read local additional costs", e);
  }
  return [];
}

export async function loadSyncedAdditionalCosts(): Promise<AdditionalCostRecord[]> {
  const localItems = getLocalAdditionalCosts();
  try {
    const remoteItems = await masterDataApi.getAdditionalCosts();
    if (Array.isArray(remoteItems)) {
      const localById = new Map(localItems.map((l) => [l.id, l]));
      const remoteIds = new Set(remoteItems.map((r) => r.id));
      const unsyncedLocal = localItems.filter((l) => !remoteIds.has(l.id));
      const missingRemoteUom = remoteItems.filter(
        (r) => !r.uom && Boolean(localById.get(r.id)?.uom)
      );

      if (unsyncedLocal.length > 0 || missingRemoteUom.length > 0) {
        await Promise.all([
          ...unsyncedLocal.map((item) =>
            masterDataApi
              .createAdditionalCost({
                id: item.id,
                itemCode: item.itemCode,
                itemName: item.itemName,
                price: item.price,
                uom: item.uom || "",
                status: item.status || "active",
              })
              .catch(() => null)
          ),
          ...missingRemoteUom.map((item) => {
            const localMatch = localById.get(item.id);
            return masterDataApi
              .updateAdditionalCost(item.id, {
                itemCode: item.itemCode,
                itemName: item.itemName,
                price: item.price,
                uom: localMatch?.uom || "",
                status: item.status || "active",
              })
              .catch(() => null);
          }),
        ]);
        const refreshed = await masterDataApi.getAdditionalCosts().catch(() => [
          ...unsyncedLocal,
          ...remoteItems.map((r) => ({
            ...r,
            uom: r.uom || localById.get(r.id)?.uom || "",
          })),
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

export default function AdditionalCostsPage() {
  const [items, setItems] = useState<AdditionalCostRecord[]>([]);
  const [uomOptions, setUomOptions] = useState<string[]>(() => getCachedUomOptions());
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [uom, setUom] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const saveToStorage = (updated: AdditionalCostRecord[]) => {
    setItems(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  async function loadData() {
    setLoading(true);
    try {
      const [list, mergedUoms] = await Promise.all([
        loadSyncedAdditionalCosts(),
        loadMergedUomOptions(),
      ]);
      setItems(Array.isArray(list) ? list : []);
      setUomOptions(mergedUoms);
    } catch (err) {
      console.error("Failed to load additional costs:", err);
      setItems(getLocalAdditionalCosts());
      setUomOptions(getCachedUomOptions());
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemCode.trim() || !itemName.trim()) return;
    setSubmitting(true);
    setError(null);
    const cleanCode = itemCode.trim();
    const cleanName = itemName.trim();
    const cleanPrice = Number(price) || 0;
    const cleanUom = uom.trim();

    try {
      if (editingId) {
        const payload = {
          itemCode: cleanCode,
          itemName: cleanName,
          price: cleanPrice,
          uom: cleanUom,
        };
        try {
          await masterDataApi.updateAdditionalCost(editingId, payload);
        } catch (err) {
          console.warn("Saved update locally; will sync when server is reachable", err);
        }
        const updated = items.map((row) =>
          row.id === editingId
            ? { ...row, itemCode: cleanCode, itemName: cleanName, price: cleanPrice, uom: cleanUom }
            : row
        );
        saveToStorage(updated);
        setEditingId(null);
      } else {
        const tempId = `ac-${Date.now()}`;
        let newRecord: AdditionalCostRecord = {
          id: tempId,
          itemCode: cleanCode,
          itemName: cleanName,
          price: cleanPrice,
          uom: cleanUom,
          status: "active",
        };
        try {
          const created = await masterDataApi.createAdditionalCost({
            id: tempId,
            itemCode: cleanCode,
            itemName: cleanName,
            price: cleanPrice,
            uom: cleanUom,
          });
          newRecord = {
            ...created,
            uom: created.uom || cleanUom,
          };
        } catch (err) {
          console.warn("Saved new additional cost locally; will sync when server is reachable", err);
        }
        saveToStorage([newRecord, ...items]);
      }
      setItemCode("");
      setItemName("");
      setPrice("");
      setUom("");
    } catch (err: any) {
      setError(err?.message || `Failed to ${editingId ? "update" : "add"} Additional Cost.`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item: AdditionalCostRecord) {
    setEditingId(item.id);
    setItemCode(item.itemCode || "");
    setItemName(item.itemName || "");
    setPrice(item.price ?? 0);
    setUom(item.uom || "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setItemCode("");
    setItemName("");
    setPrice("");
    setUom("");
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this Additional Cost item?")) return;
    try {
      await masterDataApi.deleteAdditionalCost(id);
    } catch (err) {
      console.warn("Deleted additional cost locally; server unreachable", err);
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
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
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
        Additional Cost
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
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130, flex: 0.9 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Code
            </label>
            <input
              type="text"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="Enter Code"
              required
              style={{
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 210, flex: 1.4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Additional Cost Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter Additional Cost Name"
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
                Code
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Additional Cost Name
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
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  No Additional Cost items added yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>
                    {item.itemCode}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#0f172a", fontWeight: 500 }}>
                    {item.itemName}
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
