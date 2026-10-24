import React, { useEffect, useState } from "react";
import { reportApi, ReportFilters, ReportResult } from "../api/reportApi";
import { dprApi } from "../../dpr/api/dprApi";
import PermissionGate from "../../../shared/guards/PermissionGate";
import { useIsAdmin, useIsSystemAdmin } from "../../auth/hooks/usePermissions";

export default function DailyProductionReportPage() {
  const isSystemAdmin = useIsSystemAdmin();
  const isAdmin = isSystemAdmin || useIsAdmin();

  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Edit modal state (Admin only)
  const [editEntry, setEditEntry] = useState<{
    id: string;
    dept: string;
    supervisor: string;
    hod: string;
    totalAchievement: number | string;
    totalRework: number | string;
    uom: string;
    manpower: number | string;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!showActions) return;
    const close = () => setShowActions(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showActions]);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await reportApi.run("daily_production_report", filters);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this Daily Production Report entry?")) return;
    try {
      await dprApi.remove(id);
      loadReport();
    } catch (e) {
      console.error(e);
      alert("Failed to delete entry");
    }
  }

  function handleExportXlsx() {
    reportApi.downloadExport("daily_production_report", "xlsx", filters, "Daily_Production_Report.xlsx");
  }

  function handleExportPdf() {
    reportApi.downloadExport("daily_production_report", "pdf", filters, "Daily_Production_Report.pdf");
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; visibility: visible; }
        }
      `}</style>
      <div className="print-area" style={{ padding: 24, background: "#fff", minHeight: "100vh", borderRadius: 8 }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0, color: "#111827" }}>Daily Production Report</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <input 
            type="date" 
            value={filters.dateFrom ?? ""} 
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })} 
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }} 
          />
          <input 
            type="date" 
            value={filters.dateTo ?? ""} 
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })} 
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }} 
          />
          <button 
            onClick={loadReport} 
            disabled={loading}
            style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            {loading ? "Loading..." : "Run Report"}
          </button>
          
          <div style={{ position: "relative", display: "inline-block" }} className="no-print">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              📥 Options <span style={{ fontSize: "10px" }}>▼</span>
            </button>
            
            {showActions && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                zIndex: 100,
                minWidth: "160px",
                overflow: "hidden"
              }}>
                <PermissionGate permission="report.export">
                  <button 
                    onClick={() => {
                      handleExportXlsx();
                      setShowActions(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      color: "#1e293b",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    🟢 Export Excel
                  </button>
                  <button 
                    onClick={() => {
                      handleExportPdf();
                      setShowActions(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      color: "#1e293b",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    🔴 Export PDF
                  </button>
                </PermissionGate>
                <button 
                  onClick={() => {
                    window.print();
                    setShowActions(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    color: "#1e293b",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  🖨️ Print / PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <h1 style={{ fontSize: 24, margin: 0, marginBottom: 16, color: "#111827", display: "none" }} className="print-only" >Daily Production Report ({filters.dateFrom} to {filters.dateTo})</h1>

      {result && (
        <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                {result.columns.map((c) => {
                  if (c === "_id") return null;
                  return (
                    <th key={c} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                      {c}
                    </th>
                  );
                })}
                {isAdmin && (
                  <th className="no-print" style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => {
                const idIndex = result.columns.indexOf("_id");
                const rowId = idIndex >= 0 ? row[idIndex] : null;

                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    {row.map((cell, j) => {
                      if (result.columns[j] === "_id") return null;
                      return (
                        <td key={j} style={{ padding: "12px 16px", fontSize: 14, color: "#111827" }}>
                          {cell ?? "—"}
                        </td>
                      );
                    })}
                    {isAdmin && (
                      <td className="no-print" style={{ padding: "12px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          <button 
                            type="button"
                            onClick={() => {
                              if (!rowId) return;
                              const c = (colName: string) => result.columns.indexOf(colName);
                              setEditEntry({
                                id: String(rowId),
                                dept: String(row[c("Department Name")] || ""),
                                supervisor: String(row[c("Supervisor Name")] || ""),
                                hod: String(row[c("HOD Name")] || ""),
                                manpower: row[c("Total Manpower")] ?? 0,
                                uom: String(row[c("UOM")] || "Pcs"),
                                totalAchievement: row[c("Total Achievement")] ?? 0,
                                totalRework: row[c("Total Re-work")] ?? 0,
                              });
                            }}
                            style={{ padding: "6px 12px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            title="Edit DPR Entry (Admin Only)"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => rowId && handleDelete(rowId as string)}
                            style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            title="Delete DPR Entry (Admin Only)"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={result.columns.length + (isAdmin ? 1 : 0)} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                    No data available for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal (Admin Only) */}
      {editEntry && (
        <div
          onClick={() => setEditEntry(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              maxWidth: 500,
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "#111827", fontWeight: 700 }}>✏️ Edit Production Entry</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                  {editEntry.dept} · Supervisor: {editEntry.supervisor}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditEntry(null)}
                style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editEntry) return;
                setSavingEdit(true);
                try {
                  await dprApi.update(editEntry.id, {
                    totalAchievement: Number(editEntry.totalAchievement) || 0,
                    totalRework: Number(editEntry.totalRework) || 0,
                    uom: editEntry.uom,
                  });
                  setEditEntry(null);
                  await loadReport();
                  alert("Production entry updated successfully!");
                } catch (err: any) {
                  console.error("Failed to update DPR entry", err);
                  alert(err?.response?.data?.error?.message || "Failed to update DPR entry.");
                } finally {
                  setSavingEdit(false);
                }
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Total Achievement
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editEntry.totalAchievement}
                    onChange={(e) => setEditEntry({ ...editEntry, totalAchievement: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Total Re-work
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editEntry.totalRework}
                    onChange={(e) => setEditEntry({ ...editEntry, totalRework: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    UOM
                  </label>
                  <select
                    value={editEntry.uom}
                    onChange={(e) => setEditEntry({ ...editEntry, uom: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Sqft">Sqft</option>
                    <option value="Nos">Nos</option>
                    <option value="Kg">Kg</option>
                    <option value="Mtr">Mtr</option>
                    <option value="CBM">CBM</option>
                    <option value="CFT">CFT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                <button
                  type="button"
                  onClick={() => setEditEntry(null)}
                  style={{
                    padding: "8px 16px",
                    background: "#f3f4f6",
                    color: "#4b5563",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: "8px 20px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
