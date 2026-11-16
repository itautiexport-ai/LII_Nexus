import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HardwareAccessory, masterDataApi } from "../api/masterDataApi";

const LOCAL_STORAGE_KEY = "nexus_hardware_accessories";

export function getLocalHardwareAccessories(): HardwareAccessory[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          id: String(item.id || `hw-${Date.now()}`),
          itemCode: String(item.itemCode ?? ""),
          itemName: String(item.itemName ?? ""),
          category: String(item.category || "Hardware"),
          sizeSpec: String(item.sizeSpec || ""),
          materialFinish: String(item.materialFinish || ""),
          uom: String(item.uom || "Pc"),
          rate: Number(item.rate) || 0,
          status: item.status === "inactive" ? "inactive" : "active",
        }));
      }
    }
  } catch (e) {
    console.error("Failed to read local hardware accessories", e);
  }
  return [];
}

export async function loadSyncedHardwareAccessories(): Promise<HardwareAccessory[]> {
  const localItems = getLocalHardwareAccessories();
  try {
    const remoteItems = await masterDataApi.getHardwareAccessories();
    if (Array.isArray(remoteItems)) {
      const remoteIds = new Set(remoteItems.map((r) => r.id));
      const unsyncedLocal = localItems.filter((l) => !remoteIds.has(l.id));
      if (unsyncedLocal.length > 0) {
        await Promise.all(
          unsyncedLocal.map((item) =>
            masterDataApi
              .createHardwareAccessory({
                id: item.id,
                itemCode: item.itemCode,
                itemName: item.itemName,
                category: item.category || "Hardware",
                uom: item.uom || "Pc",
                rate: item.rate,
                status: item.status || "active",
              })
              .catch(() => null)
          )
        );
        const refreshed = await masterDataApi.getHardwareAccessories().catch(() => [
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

export default function HardwareAccessoriesPage() {
  const [items, setItems] = useState<HardwareAccessory[]>([]);
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [uom, setUom] = useState("Per Piece");
  const [rate, setRate] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const saveToStorage = (updated: HardwareAccessory[]) => {
    setItems(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  async function loadData() {
    setLoading(true);
    try {
      const list = await loadSyncedHardwareAccessories();
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load hardware items:", err);
      setItems(getLocalHardwareAccessories());
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
    const cleanUom = (uom || "Pcs").trim();
    const cleanRate = Number(rate) || 0;

    try {
      if (editingId) {
        const payload = {
          itemCode: cleanCode,
          itemName: cleanName,
          uom: cleanUom,
          rate: cleanRate,
        };
        try {
          await masterDataApi.updateHardwareAccessory(editingId, payload);
        } catch (err) {
          console.warn("Saved update locally; will sync when server is reachable", err);
        }
        const updated = items.map((row) =>
          row.id === editingId
            ? { ...row, itemCode: cleanCode, itemName: cleanName, uom: cleanUom, rate: cleanRate }
            : row
        );
        saveToStorage(updated);
        setEditingId(null);
      } else {
        const tempId = `hw-${Date.now()}`;
        let newRecord: HardwareAccessory = {
          id: tempId,
          itemCode: cleanCode,
          itemName: cleanName,
          category: "Hardware",
          sizeSpec: "",
          materialFinish: "",
          uom: cleanUom,
          rate: cleanRate,
          status: "active",
        };
        try {
          newRecord = await masterDataApi.createHardwareAccessory({
            id: tempId,
            itemCode: cleanCode,
            itemName: cleanName,
            uom: cleanUom,
            rate: cleanRate,
          });
        } catch (err) {
          console.warn("Saved new hardware locally; will sync when server is reachable", err);
        }
        saveToStorage([newRecord, ...items]);
      }
      setItemCode("");
      setItemName("");
      setUom("Per Piece");
      setRate("");
    } catch (err: any) {
      setError(err?.message || `Failed to ${editingId ? "update" : "add"} Hardware.`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item: HardwareAccessory) {
    setEditingId(item.id);
    setItemCode(item.itemCode || "");
    setItemName(item.itemName || "");
    setUom(item.uom || "Per Piece");
    setRate(item.rate ?? 0);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setItemCode("");
    setItemName("");
    setUom("Per Piece");
    setRate("");
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this Hardware item?")) return;
    try {
      await masterDataApi.deleteHardwareAccessory(id);
    } catch (err) {
      console.warn("Deleted hardware locally; server unreachable", err);
    }
    if (editingId === id) {
      cancelEdit();
    }
    saveToStorage(items.filter((row) => row.id !== id));
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
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
        Hardware And Accessories
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160, flex: 1 }}>
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

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220, flex: 1.4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Hardware Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter Hardware Name"
              required
              style={{
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160, flex: 0.9 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              UOM (Unit)
            </label>
            <select
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
                background: "#ffffff",
                color: "#111827",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <option value="Per Piece">Per Piece</option>
              <option value="Per Meter">Per Meter</option>
              <option value="Per Pcs">Per Pcs</option>
              <option value="Per Kg">Per Kg</option>
              <option value="Per Set">Per Set</option>
              <option value="Per Roll">Per Roll</option>
              <option value="Per Feet">Per Feet</option>
              <option value="Per Inch">Per Inch</option>
              <option value="Per Pair">Per Pair</option>
              <option value="Per Sheet">Per Sheet</option>
              <option value="Per Packet">Per Packet</option>
              {!["Per Piece", "Per Meter", "Per Pcs", "Per Kg", "Per Set", "Per Roll", "Per Feet", "Per Inch", "Per Pair", "Per Sheet", "Per Packet"].includes(uom) && uom && (
                <option value={uom}>{uom}</option>
              )}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 150, flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Price (₹ / {uom || "Unit"})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="no-spin-arrows"
              value={rate}
              onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))}
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
                Hardware Name
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                UOM
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Price
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
                  No Hardware items added yet.
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
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#2563eb", fontWeight: 600 }}>
                    <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                      {item.uom || "Pcs"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                    ₹{Number(item.rate || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400, marginLeft: 4 }}>
                      / {item.uom || "Pcs"}
                    </span>
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
