import React, { useState, useEffect } from "react";
import { productionEmApi, ProductionEmRecord } from "../api/productionEmApi";
import * as XLSX from "xlsx";

export default function ProductionEmReportPage() {
  const [data, setData] = useState<ProductionEmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (!showActions) return;
    const close = () => setShowActions(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showActions]);

  const handleExportExcel = () => {
    if (data.length === 0) return;
    const wsData = data.map(r => ({
      "S.No.": r.sNo,
      "Department Name": r.departmentName,
      "HOD Name": r.hodName,
      "Achieved CBM": r.achievedCbm,
      "Total Manpower": r.manpower,
      "Estimated Salary": r.salary
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production EM");
    XLSX.writeFile(wb, `Production_EM_${startDate}_to_${endDate}.xlsx`);
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productionEmApi.getReport(startDate, endDate);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const formatDateToDDMMYY = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year.slice(-2)}`;
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; margin-top: 8px; font-weight: 500; color: #374151; }
            body { background-color: white; padding: 0; }
            @page { margin: 2cm; }
          }
        `}
      </style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Production EM</h1>
          <p style={{ color: "#6b7280", fontSize: 16, margin: 0 }}>
            Executive summary of production output, manpower, and estimated salary costs by department.
          </p>
          <div className="print-only" style={{ display: "none" }}>
            Report Period: {formatDateToDDMMYY(startDate)} to {formatDateToDDMMYY(endDate)}
          </div>
        </div>
        <div className="no-print" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: 14, color: "#6b7280" }}>From:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: 14, color: "#6b7280" }}>To:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </div>
          <div style={{ position: "relative", display: "inline-block" }} className="no-print">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              style={{ 
                padding: "8px 16px", 
                backgroundColor: "#2563eb", 
                color: "white", 
                border: "none", 
                borderRadius: 6, 
                cursor: "pointer", 
                fontSize: 14, 
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
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
                <button 
                  onClick={() => {
                    handleExportExcel();
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

      {error && (
        <div style={{ padding: 12, background: "#fee2e2", color: "#b91c1c", borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading report data...</div>
      ) : (
        <div style={{ background: "white", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151", fontSize: 14 }}>S.No.</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151", fontSize: 14 }}>Department Name</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151", fontSize: 14 }}>HOD Name</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151", fontSize: 14 }}>Achieved CBM</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151", fontSize: 14 }}>Total Manpower</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151", fontSize: 14 }}>Estimated Salary</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                    No data available for the selected period.
                  </td>
                </tr>
              ) : (
                data.map((row: ProductionEmRecord, i) => (
                  <tr key={row.sNo} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", color: "#4b5563", fontSize: 14 }}>{row.sNo}</td>
                    <td style={{ padding: "12px 16px", color: "#111827", fontSize: 14, fontWeight: 500 }}>{row.departmentName}</td>
                    <td style={{ padding: "12px 16px", color: "#4b5563", fontSize: 14 }}>{row.hodName}</td>
                    <td style={{ padding: "12px 16px", color: "#16a34a", fontSize: 14, fontWeight: 600 }}>{row.achievedCbm.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#d97706", fontSize: 14, fontWeight: 600 }}>{row.manpower.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#4f46e5", fontSize: 14, fontWeight: 600 }}>Rs. {row.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
