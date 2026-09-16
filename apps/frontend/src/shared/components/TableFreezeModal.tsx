import React, { useState, useEffect } from "react";
import { TableFreezeSettings } from "../api/tableFreezeApi";
import { ColumnDefinition } from "../hooks/useTableFreeze";

interface TableFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TableFreezeSettings;
  availableColumns?: ColumnDefinition[];
  onSave: (newSettings: {
    freezeColumns: number;
    freezeColumnKey?: string | null;
    freezeRows: number;
    freezeHeader: boolean;
    tableMaxHeight: string;
    isUniversal: boolean;
  }) => Promise<void>;
  onReset: (resetUniversal?: boolean) => Promise<void>;
  isSaving?: boolean;
}

export const TableFreezeModal: React.FC<TableFreezeModalProps> = ({
  isOpen,
  onClose,
  settings,
  availableColumns = [],
  onSave,
  onReset,
  isSaving = false,
}) => {
  const [freezeColumns, setFreezeColumns] = useState<number>(settings.freezeColumns || 0);
  const [freezeColumnKey, setFreezeColumnKey] = useState<string | null>(settings.freezeColumnKey || null);
  const [freezeRows, setFreezeRows] = useState<number>(settings.freezeRows || 0);
  const [freezeHeader, setFreezeHeader] = useState<boolean>(settings.freezeHeader ?? true);
  const [tableMaxHeight, setTableMaxHeight] = useState<string>(settings.tableMaxHeight || "72vh");
  const [isUniversal, setIsUniversal] = useState<boolean>(settings.isUniversal ?? true);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFreezeColumns(settings.freezeColumns || 0);
      setFreezeColumnKey(settings.freezeColumnKey || null);
      setFreezeRows(settings.freezeRows || 0);
      setFreezeHeader(settings.freezeHeader ?? true);
      setTableMaxHeight(settings.tableMaxHeight || "72vh");
      setIsUniversal(settings.isUniversal ?? true);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  // Handle column dropdown selection
  const handleColumnSelect = (colKey: string) => {
    if (!colKey) {
      setFreezeColumnKey(null);
      setFreezeColumns(0);
      return;
    }
    setFreezeColumnKey(colKey);
    const idx = availableColumns.findIndex((c) => c.key === colKey);
    if (idx !== -1) {
      setFreezeColumns(idx + 1);
    }
  };

  const handleSave = async () => {
    await onSave({
      freezeColumns,
      freezeColumnKey,
      freezeRows,
      freezeHeader,
      tableMaxHeight,
      isUniversal,
    });
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset freeze panes?")) {
      await onReset(isUniversal);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "520px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>❄️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
                Freeze Panes Settings
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                Pin columns and rows to lock headers while scrolling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#cbd5e1",
              fontSize: "1.2rem",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Column Freezing */}
          <div
            style={{
              background: "#f8fafc",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              🔒 Column Freezing (Horizontal Lock)
            </label>

            {availableColumns.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "4px" }}>
                  Freeze up to specific column:
                </span>
                <select
                  value={freezeColumnKey || ""}
                  onChange={(e) => handleColumnSelect(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    backgroundColor: "#ffffff",
                    color: "#1e293b",
                    fontWeight: 500,
                  }}
                >
                  <option value="">— Unfreeze Columns (None) —</option>
                  {availableColumns.map((col, idx) => (
                    <option key={col.key} value={col.key}>
                      {idx + 1}. {col.label} {idx + 1 <= freezeColumns ? "(Frozen)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Number of Columns:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(0, freezeColumns - 1);
                    setFreezeColumns(next);
                    if (next === 0) setFreezeColumnKey(null);
                    else if (availableColumns[next - 1]) setFreezeColumnKey(availableColumns[next - 1].key);
                  }}
                  disabled={freezeColumns <= 0}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: freezeColumns <= 0 ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  -
                </button>
                <span
                  style={{
                    minWidth: "32px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#0f172a",
                  }}
                >
                  {freezeColumns}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const maxCols = availableColumns.length > 0 ? availableColumns.length : 15;
                    const next = Math.min(maxCols, freezeColumns + 1);
                    setFreezeColumns(next);
                    if (availableColumns[next - 1]) setFreezeColumnKey(availableColumns[next - 1].key);
                  }}
                  disabled={freezeColumns >= (availableColumns.length || 15)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Row & Header Freezing */}
          <div
            style={{
              background: "#f8fafc",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              📌 Header & Row Freezing (Vertical Lock)
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#334155",
                fontWeight: 500,
                marginBottom: "12px",
              }}
            >
              <input
                type="checkbox"
                checked={freezeHeader}
                onChange={(e) => setFreezeHeader(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
              />
              <span>Sticky Table Header (keep column names fixed at top)</span>
            </label>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Freeze Top Data Rows:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setFreezeRows(Math.max(0, freezeRows - 1))}
                  disabled={freezeRows <= 0}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: freezeRows <= 0 ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  -
                </button>
                <span
                  style={{
                    minWidth: "32px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#0f172a",
                  }}
                >
                  {freezeRows}
                </span>
                <button
                  type="button"
                  onClick={() => setFreezeRows(Math.min(10, freezeRows + 1))}
                  disabled={freezeRows >= 10}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Table Container Height */}
          <div
            style={{
              background: "#f8fafc",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              📏 Table Viewport Height
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { label: "Compact (55vh)", value: "55vh" },
                { label: "Standard (72vh)", value: "72vh" },
                { label: "Tall (85vh)", value: "85vh" },
                { label: "Natural (Full)", value: "none" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTableMaxHeight(opt.value)}
                  style={{
                    flex: 1,
                    padding: "8px 6px",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border: tableMaxHeight === opt.value ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: tableMaxHeight === opt.value ? "#eff6ff" : "#ffffff",
                    color: tableMaxHeight === opt.value ? "#1d4ed8" : "#475569",
                    fontWeight: tableMaxHeight === opt.value ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Universal Scope Toggle */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              backgroundColor: isUniversal ? "#eff6ff" : "#f1f5f9",
              border: isUniversal ? "1.5px solid #bfdbfe" : "1px solid #cbd5e1",
              transition: "all 0.2s ease",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isUniversal}
                onChange={(e) => setIsUniversal(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "#2563eb",
                  marginTop: "2px",
                  cursor: "pointer",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: isUniversal ? "#1d4ed8" : "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🌐 Apply Universally (All Users & New Users)</span>
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: isUniversal ? "#3b82f6" : "#64748b",
                    marginTop: "2px",
                    lineHeight: 1.4,
                  }}
                >
                  {isUniversal
                    ? "This freeze configuration will automatically be the default view for all existing accounts and any new users created in the system."
                    : "Save this freeze configuration for your personal user login only."}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc",
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            style={{
              background: "transparent",
              border: "1px solid #e2e8f0",
              color: "#dc2626",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            Reset to Default
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#475569",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                border: "none",
                color: "#ffffff",
                padding: "8px 20px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: isSaving ? "wait" : "pointer",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
              }}
            >
              {isSaving ? "Saving..." : "Save & Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
