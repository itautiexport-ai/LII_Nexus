import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WoodPartNameRecord, masterDataApi } from "../api/masterDataApi";

const LOCAL_STORAGE_KEY = "nexus_wood_part_names";

export function getLocalWoodPartNames(): WoodPartNameRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          id: String(item.id || `wpn-${Date.now()}`),
          partCode: String(item.partCode ?? ""),
          partName: String(item.partName ?? ""),
        }));
      }
    }
  } catch (e) {
    console.error("Failed to read local wood part names", e);
  }
  return [];
}

export async function loadSyncedWoodPartNames(): Promise<WoodPartNameRecord[]> {
  const localItems = getLocalWoodPartNames();
  try {
    const remoteItems = await masterDataApi.getWoodPartNames();
    if (Array.isArray(remoteItems)) {
      const remoteIds = new Set(remoteItems.map((r) => r.id));
      const unsyncedLocal = localItems.filter((l) => !remoteIds.has(l.id));
      if (unsyncedLocal.length > 0) {
        await Promise.all(
          unsyncedLocal.map((item) =>
            masterDataApi
              .createWoodPartName({
                id: item.id,
                partCode: item.partCode,
                partName: item.partName,
              })
              .catch(() => null)
          )
        );
        const refreshed = await masterDataApi.getWoodPartNames().catch(() => [
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

export default function WoodPartNamesPage() {
  const [items, setItems] = useState<WoodPartNameRecord[]>([]);
  const [partName, setPartName] = useState("");
  const [partCode, setPartCode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const saveToStorage = (updated: WoodPartNameRecord[]) => {
    setItems(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  async function loadData() {
    setLoading(true);
    try {
      const list = await loadSyncedWoodPartNames();
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load Wood Part Names:", err);
      setItems(getLocalWoodPartNames());
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partName.trim() || !partCode.trim()) return;
    setSubmitting(true);
    setError(null);
    const cleanName = partName.trim();
    const cleanCode = partCode.trim();

    try {
      if (editingId) {
        try {
          await masterDataApi.updateWoodPartName(editingId, {
            partName: cleanName,
            partCode: cleanCode,
          });
        } catch (err) {
          console.warn("Saved update locally; will sync when server is reachable", err);
        }
        const updated = items.map((row) =>
          row.id === editingId ? { ...row, partName: cleanName, partCode: cleanCode } : row
        );
        saveToStorage(updated);
        setEditingId(null);
      } else {
        const tempId = `wpn-${Date.now()}`;
        let newRecord: WoodPartNameRecord = {
          id: tempId,
          partCode: cleanCode,
          partName: cleanName,
        };
        try {
          newRecord = await masterDataApi.createWoodPartName({
            id: tempId,
            partName: cleanName,
            partCode: cleanCode,
          });
        } catch (err) {
          console.warn("Saved new wood part name locally; will sync when server is reachable", err);
        }
        saveToStorage([newRecord, ...items]);
      }
      setPartName("");
      setPartCode("");
    } catch (err: any) {
      setError(err?.message || `Failed to ${editingId ? "update" : "add"} Wood Part Name.`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item: WoodPartNameRecord) {
    setEditingId(item.id);
    setPartName(item.partName || "");
    setPartCode(item.partCode || "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setPartName("");
    setPartCode("");
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this Wood Part Name?")) return;
    try {
      await masterDataApi.deleteWoodPartName(id);
    } catch (err) {
      console.warn("Deleted wood part name locally; server unreachable", err);
    }
    if (editingId === id) {
      cancelEdit();
    }
    saveToStorage(items.filter((row) => row.id !== id));
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
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
        Wood Part Name
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220, flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Wood Part Name
            </label>
            <input
              type="text"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="Enter Wood Part Name"
              required
              style={{
                padding: "9px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180, flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Code
            </label>
            <input
              type="text"
              value={partCode}
              onChange={(e) => setPartCode(e.target.value)}
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
                Wood Part Name
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Code
              </th>
              <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151", width: 140 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  No Wood Part Names added yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#0f172a", fontWeight: 500 }}>
                    {item.partName}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>
                    {item.partCode}
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
