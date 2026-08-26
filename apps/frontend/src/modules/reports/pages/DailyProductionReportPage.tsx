import React, { useEffect, useState } from "react";
import { reportApi, ReportFilters, ReportResult } from "../api/reportApi";
import { dprApi } from "../../dpr/api/dprApi";
import PermissionGate from "../../../shared/guards/PermissionGate";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

export default function DailyProductionReportPage() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.roles.includes("System Admin") ?? false;
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

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
                      <td className="no-print" style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button 
                          onClick={() => rowId && handleDelete(rowId as string)}
                          style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={result.columns.length} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                    No data available for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
}
