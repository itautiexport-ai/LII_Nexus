import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../../services/api/axiosInstance";

export default function MonthlyPayrollPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/hr/payroll/monthly/${year}/${month}`);
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch monthly payroll data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [year, month]);

  const totalGrossAmt = data.reduce((sum, row) => sum + (Number(row.grossAmt) || 0), 0);
  const totalOtAmt = data.reduce((sum, row) => sum + (Number(row.otAmt) || 0), 0);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Monthly Payroll</h1>
          <p style={{ color: "#6b7280", fontSize: 16, margin: 0 }}>
            Aggregated department-wise payroll for the selected month.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Month</span>
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Year</span>
            <input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, width: 80 }}
            />
          </div>
          <button 
            onClick={fetchMonthlyData}
            style={{ 
              marginTop: 18, padding: "8px 16px", background: "#4f46e5", color: "white", 
              border: "none", borderRadius: 6, fontWeight: 500, cursor: "pointer"
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading data...</div>}
      {error && <div style={{ padding: 16, background: "#fee2e2", color: "#b91c1c", borderRadius: 8, marginBottom: 24 }}>{error}</div>}

      {!loading && !error && data.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748b" }}>SR NO</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748b" }}>DEPARTMENT</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "#64748b" }}>TOTAL GROSS</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "#64748b" }}>TOTAL DAYS</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "#64748b" }}>TOTAL OT HRS</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "#64748b" }}>TOTAL GROSS AMT</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "#64748b" }}>TOTAL OT AMT</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{row.sNo}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>{row.departmentName}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#6b7280" }}>{row.gross}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#6b7280" }}>{row.days}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#6b7280" }}>{row.otHrs}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>₹{row.grossAmt?.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>₹{row.otAmt?.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={5} style={{ padding: "16px", textAlign: "right", color: "#334155" }}>Grand Total</td>
                  <td style={{ padding: "16px", textAlign: "right", color: "#16a34a", fontSize: 16 }}>₹{totalGrossAmt.toLocaleString()}</td>
                  <td style={{ padding: "16px", textAlign: "right", color: "#16a34a", fontSize: 16 }}>₹{totalOtAmt.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
         <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", background: "#f9fafb", borderRadius: 8, border: "1px dashed #d1d5db" }}>
           <p style={{ fontSize: 16, fontWeight: 500, color: "#6b7280", margin: 0 }}>No payroll data found for this month.</p>
           <p style={{ fontSize: 14, color: "#9ca3af", margin: "8px 0 0 0" }}>Upload weekly sheets to see aggregated data here.</p>
         </div>
      )}
    </div>
  );
}
