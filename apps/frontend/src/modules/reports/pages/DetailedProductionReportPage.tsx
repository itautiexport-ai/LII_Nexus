import React, { useEffect, useState } from "react";
import { reportApi, ReportFilters, ReportResult } from "../api/reportApi";
import { departmentsApi, DepartmentRecord } from "../../admin/organization/departments/api/departmentsApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

export default function DetailedProductionReportPage() {
  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [filters, setFilters] = useState<ReportFilters>({ dateFrom: monthAgo, dateTo: today });
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(console.error);
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await reportApi.run("dpr_detailed_report", filters);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  function handleExportXlsx() {
    reportApi.downloadExport("dpr_detailed_report", "xlsx", filters, "Detailed_DPR.xlsx");
  }

  // Column index map for easy lookup
  const cols = result?.columns ?? [];
  const ci = (name: string) => cols.indexOf(name);

  // Item-wise columns (matching the form)
  const itemCols = ["Alias Name", "Product Code", "Wood Type", "Order Quantity", "OK Quantity", "UOM", "Qty as per UOM", "Re-work"];
  const headerCols = ["Date", "Department", "Shift", "Supervisor", "HOD"];

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .dpr-det-print, .dpr-det-print * { visibility: visible; }
          .dpr-det-print { position: absolute; left: 0; top: 0; width: 100%; padding: 16px !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .dpr-table { width: 100%; border-collapse: collapse; }
        .dpr-table thead tr { background: #1b4332; }
        .dpr-table thead th { color: #fff; padding: 10px 14px; font-size: 12px; font-weight: 600; text-align: left; white-space: nowrap; letter-spacing: 0.4px; }
        .dpr-table thead th.item-col { background: #2d6a4f; }
        .dpr-table tbody tr:nth-child(even) td { background: #f8fffe; }
        .dpr-table tbody tr:hover td { background: #e8f5e9; }
        .dpr-table td { padding: 9px 14px; font-size: 13px; color: #1f2937; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
        .dpr-table td.item-cell { color: #1b4332; font-weight: 500; }
        .dpr-table td.num-cell { text-align: right; font-variant-numeric: tabular-nums; }
        .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 20px; min-width: 140px; }
        .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; }
        .stat-value { font-size: 24px; font-weight: 700; margin-top: 2px; }
      `}</style>

      <div className="dpr-det-print" style={{ padding: 24, background: "#f9fafb", minHeight: "100vh" }}>

        {/* Header */}
        <div className="no-print" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, margin: 0, color: "#1b4332", fontWeight: 700 }}>Detailed DPR</h1>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>Item-wise Production Details — as filled in DPR Entry</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input type="date" value={filters.dateFrom ?? ""}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
              <span style={{ color: "#6b7280" }}>to</span>
              <input type="date" value={filters.dateTo ?? ""}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
              <select value={filters.departmentId ?? ""}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value || undefined })}
                style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}>
                <option value="">— All Departments —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button onClick={loadReport} disabled={loading}
                style={{ padding: "8px 18px", background: "#1b4332", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                {loading ? "Loading…" : "Run Report"}
              </button>
              <PermissionGate permission="report.export">
                <button onClick={handleExportXlsx}
                  style={{ padding: "8px 16px", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  ⬇ Export Excel
                </button>
              </PermissionGate>
              <button onClick={() => window.print()}
                style={{ padding: "8px 16px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                🖨️ Print
              </button>
            </div>
          </div>
        </div>

        {/* Print title */}
        <div className="print-only" style={{ display: "none", marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: "#1b4332" }}>Detailed DPR — {filters.dateFrom} to {filters.dateTo}</h2>
        </div>

        {/* Stats */}
        {result && (
          <div className="no-print" style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
            <div className="stat-card">
              <div className="stat-label">Total Item Lines</div>
              <div className="stat-value" style={{ color: "#1b4332" }}>{result.rows.length}</div>
            </div>
            {(() => {
              const okIdx = ci("OK Quantity");
              const orderIdx = ci("Order Quantity");
              const reworkIdx = ci("Re-work");
              const cbmIdx = ci("Qty as per UOM");
              const totalOk = result.rows.reduce((s, r) => s + (Number(r[okIdx]) || 0), 0);
              const totalOrder = result.rows.reduce((s, r) => s + (Number(r[orderIdx]) || 0), 0);
              const totalRework = result.rows.reduce((s, r) => s + (Number(r[reworkIdx]) || 0), 0);
              const totalCbm = result.rows.reduce((s, r) => s + (Number(r[cbmIdx]) || 0), 0);
              return (
                <>
                  <div className="stat-card">
                    <div className="stat-label">Total Order Qty</div>
                    <div className="stat-value" style={{ color: "#1d4ed8" }}>{totalOrder.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total OK Qty</div>
                    <div className="stat-value" style={{ color: "#059669" }}>{totalOk.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total CBM</div>
                    <div className="stat-value" style={{ color: "#7c3aed" }}>{totalCbm.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total Re-work</div>
                    <div className="stat-value" style={{ color: "#dc2626" }}>{totalRework.toLocaleString()}</div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Table */}
        {result && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="dpr-table">
                <thead>
                  <tr>
                    {/* Header columns */}
                    {headerCols.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                    {/* Item-wise columns — highlighted differently */}
                    {itemCols.map((c) => (
                      <th key={c} className="item-col">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.length === 0 && (
                    <tr>
                      <td colSpan={headerCols.length + itemCols.length}
                        style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>
                        No data found for the selected filters. Select a date range and click Run Report.
                      </td>
                    </tr>
                  )}
                  {result.rows.map((row, i) => {
                    const numCols = ["Order Quantity", "OK Quantity", "Qty as per UOM", "Re-work"];
                    return (
                      <tr key={i}>
                        {headerCols.map((c) => (
                          <td key={c}>{row[ci(c)] ?? "—"}</td>
                        ))}
                        {itemCols.map((c) => (
                          <td key={c} className={`item-cell${numCols.includes(c) ? " num-cell" : ""}`}>
                            {row[ci(c)] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontSize: 14 }}>
            Select a date range and click <strong>Run Report</strong> to view item-wise production data.
          </div>
        )}
      </div>
    </>
  );
}
