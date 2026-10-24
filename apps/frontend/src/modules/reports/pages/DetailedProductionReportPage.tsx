import React, { useEffect, useState } from "react";
import { reportApi, ReportFilters, ReportResult } from "../api/reportApi";
import { departmentsApi, DepartmentRecord } from "../../admin/organization/departments/api/departmentsApi";
import { dprApi } from "../../dpr/api/dprApi";
import { useIsAdmin, useIsSystemAdmin } from "../../auth/hooks/usePermissions";
import PermissionGate from "../../../shared/guards/PermissionGate";

export default function DetailedProductionReportPage() {
  const isSystemAdmin = useIsSystemAdmin();
  const isAdmin = isSystemAdmin || useIsAdmin();

  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [filters, setFilters] = useState<ReportFilters>({ dateFrom: monthAgo, dateTo: today });
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Edit & Delete modal states (Admin only)
  const [editModalItem, setEditModalItem] = useState<{
    dprEntryId: string;
    itemId: string;
    date: string;
    department: string;
    shift: string;
    supervisor: string;
    hod: string;
    aliasName: string;
    productCode: string;
    woodType: string;
    orderQty: number | string;
    okQty: number | string;
    reworkQty: number | string;
    uom: string;
    qtyAsPerUom: number | string;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteModalItem, setDeleteModalItem] = useState<{
    dprEntryId: string;
    itemId: string;
    date: string;
    department: string;
    productCode: string;
    aliasName: string;
    okQty: number | string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!showActions) return;
    const close = () => setShowActions(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showActions]);

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

  function handleExportPdf() {
    reportApi.downloadExport("dpr_detailed_report", "pdf", filters, "Detailed_DPR.pdf");
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
              <div style={{ position: "relative", display: "inline-block" }} className="no-print">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                  style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
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
                    {isAdmin && (
                      <th className="no-print" style={{ background: "#153a2b", textAlign: "center", minWidth: 140 }}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.length === 0 && (
                    <tr>
                      <td colSpan={headerCols.length + itemCols.length + (isAdmin ? 1 : 0)}
                        style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>
                        No data found for the selected filters. Select a date range and click Run Report.
                      </td>
                    </tr>
                  )}
                  {result.rows.map((row, i) => {
                    const numCols = ["Order Quantity", "OK Quantity", "Qty as per UOM", "Re-work"];
                    const dprEntryId = String(row[ci("_dpr_entry_id")] || "");
                    const dprItemId = String(row[ci("_dpr_item_id")] || "");

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
                        {isAdmin && (
                          <td className="no-print" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditModalItem({
                                    dprEntryId,
                                    itemId: dprItemId,
                                    date: String(row[ci("Date")] || ""),
                                    department: String(row[ci("Department")] || ""),
                                    shift: String(row[ci("Shift")] || ""),
                                    supervisor: String(row[ci("Supervisor")] || ""),
                                    hod: String(row[ci("HOD")] || ""),
                                    aliasName: String(row[ci("Alias Name")] === "—" ? "" : row[ci("Alias Name")] || ""),
                                    productCode: String(row[ci("Product Code")] === "—" ? "" : row[ci("Product Code")] || ""),
                                    woodType: String(row[ci("Wood Type")] === "—" ? "" : row[ci("Wood Type")] || ""),
                                    orderQty: Number(row[ci("Order Quantity")]) || 0,
                                    okQty: Number(row[ci("OK Quantity")]) || 0,
                                    reworkQty: Number(row[ci("Re-work")]) || 0,
                                    uom: String(row[ci("UOM")] || "Pcs"),
                                    qtyAsPerUom: Number(row[ci("Qty as per UOM")]) || 0,
                                  });
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 8px",
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  border: "1px solid #bfdbfe",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                                title="Edit DPR Item (Admin Only)"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteModalItem({
                                    dprEntryId,
                                    itemId: dprItemId,
                                    date: String(row[ci("Date")] || ""),
                                    department: String(row[ci("Department")] || ""),
                                    productCode: String(row[ci("Product Code")] || "—"),
                                    aliasName: String(row[ci("Alias Name")] || "—"),
                                    okQty: row[ci("OK Quantity")] ?? "0",
                                  });
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 8px",
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                                title="Delete DPR Item / Entry (Admin Only)"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        )}
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

        {/* Edit Modal (Admin Only) */}
        {editModalItem && (
          <div
            onClick={() => setEditModalItem(null)}
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
                maxWidth: 620,
                width: "100%",
                padding: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: "#111827", fontWeight: 700 }}>✏️ Edit DPR Record (Admin)</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    {editModalItem.department} · Date: {editModalItem.date}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editModalItem) return;
                  setSavingEdit(true);
                  try {
                    await dprApi.updateItem(editModalItem.dprEntryId, editModalItem.itemId, {
                      entryDate: editModalItem.date,
                      aliasName: editModalItem.aliasName,
                      productCode: editModalItem.productCode,
                      woodType: editModalItem.woodType,
                      orderQty: Number(editModalItem.orderQty) || 0,
                      okQty: Number(editModalItem.okQty) || 0,
                      reworkQty: Number(editModalItem.reworkQty) || 0,
                      uom: editModalItem.uom,
                      qtyAsPerUom: editModalItem.qtyAsPerUom !== "" ? Number(editModalItem.qtyAsPerUom) : null,
                    });
                    setEditModalItem(null);
                    await loadReport();
                    alert("DPR item updated successfully!");
                  } catch (err: any) {
                    console.error("Failed to update DPR item", err);
                    alert(err?.response?.data?.error?.message || "Failed to update DPR record.");
                  } finally {
                    setSavingEdit(false);
                  }
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={editModalItem.date}
                      onChange={(e) => setEditModalItem({ ...editModalItem, date: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Product Code
                    </label>
                    <input
                      type="text"
                      value={editModalItem.productCode}
                      onChange={(e) => setEditModalItem({ ...editModalItem, productCode: e.target.value })}
                      placeholder="e.g. ITM-001"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Alias Name
                    </label>
                    <input
                      type="text"
                      value={editModalItem.aliasName}
                      onChange={(e) => setEditModalItem({ ...editModalItem, aliasName: e.target.value })}
                      placeholder="e.g. Dining Chair"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Wood Type
                    </label>
                    <input
                      type="text"
                      value={editModalItem.woodType}
                      onChange={(e) => setEditModalItem({ ...editModalItem, woodType: e.target.value })}
                      placeholder="e.g. Teak Wood"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Order Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editModalItem.orderQty}
                      onChange={(e) => setEditModalItem({ ...editModalItem, orderQty: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      OK Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editModalItem.okQty}
                      onChange={(e) => {
                        const ok = e.target.value;
                        setEditModalItem({ 
                          ...editModalItem, 
                          okQty: ok,
                          qtyAsPerUom: (editModalItem.uom === "Pcs" || editModalItem.uom === "Nos") ? ok : editModalItem.qtyAsPerUom
                        });
                      }}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Re-work
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editModalItem.reworkQty}
                      onChange={(e) => setEditModalItem({ ...editModalItem, reworkQty: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      UOM
                    </label>
                    <select
                      value={editModalItem.uom}
                      onChange={(e) => setEditModalItem({ ...editModalItem, uom: e.target.value })}
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

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Qty as per UOM (CBM / Sqft / etc.)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editModalItem.qtyAsPerUom}
                      onChange={(e) => setEditModalItem({ ...editModalItem, qtyAsPerUom: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
                  <button
                    type="button"
                    onClick={() => setEditModalItem(null)}
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
                      background: "#1b4332",
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

        {/* Delete Confirmation Modal (Admin Only) */}
        {deleteModalItem && (
          <div
            onClick={() => setDeleteModalItem(null)}
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
                maxWidth: 480,
                width: "100%",
                padding: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  🗑️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: "#111827", fontWeight: 700 }}>Delete DPR Record</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
                    Admin deletion options
                  </p>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 18, fontSize: 13, color: "#334155" }}>
                <div><strong>Product:</strong> {deleteModalItem.productCode} ({deleteModalItem.aliasName})</div>
                <div><strong>Dept:</strong> {deleteModalItem.department} · <strong>Date:</strong> {deleteModalItem.date}</div>
                <div><strong>OK Qty:</strong> {deleteModalItem.okQty}</div>
              </div>

              <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 16, lineHeight: 1.5 }}>
                Select whether you want to delete only this individual item row or the entire DPR Entry:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await dprApi.removeItem(deleteModalItem.dprEntryId, deleteModalItem.itemId);
                      setDeleteModalItem(null);
                      await loadReport();
                      alert("Item row deleted successfully.");
                    } catch (err: any) {
                      alert(err?.response?.data?.error?.message || "Failed to delete item row.");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  style={{
                    padding: "10px 16px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete This Item Row Only"}
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    if (!window.confirm("Are you sure you want to delete the entire DPR entry and ALL its items?")) return;
                    setDeleting(true);
                    try {
                      await dprApi.remove(deleteModalItem.dprEntryId);
                      setDeleteModalItem(null);
                      await loadReport();
                      alert("Entire DPR Entry deleted successfully.");
                    } catch (err: any) {
                      alert(err?.response?.data?.error?.message || "Failed to delete DPR entry.");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  style={{
                    padding: "10px 16px",
                    background: "#991b1b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete Entire DPR Entry (All Items)"}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModalItem(null)}
                  style={{
                    padding: "8px 16px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
