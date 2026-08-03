import { useEffect, useState } from "react";
import { reportApi, REPORT_TYPE_LABELS, ReportType, ChartType, ReportFilters, ReportResult, SavedReportRecord } from "../api/reportApi";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReportChart from "../components/ReportChart";
import PermissionGate from "../../../shared/guards/PermissionGate";

const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[];
const CHART_TYPES: ChartType[] = ["table", "bar", "line", "area", "pie", "treemap", "gauge", "heatmap"];

export default function ReportsHubPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<ReportType>((searchParams.get("reportType") as ReportType) || "employee_performance");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [filters, setFilters] = useState<ReportFilters>({});
  const [result, setResult] = useState<ReportResult | null>(null);
  const [saved, setSaved] = useState<SavedReportRecord[]>([]);
  const [saveName, setSaveName] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSaved() { setSaved(await reportApi.listSaved()); }
  useEffect(() => { loadSaved(); }, []);
  
  useEffect(() => {
    const qReportType = searchParams.get("reportType") as ReportType;
    if (qReportType === "dpr_product_report") {
      navigate("/admin/reports/daily-production", { replace: true });
      return;
    }
    if (qReportType && REPORT_TYPES.includes(qReportType)) {
      setReportType(qReportType);
    }
  }, [searchParams, navigate]);

  async function handleRun() {
    setLoading(true);
    try { setResult(await reportApi.run(reportType, filters)); } finally { setLoading(false); }
  }

  async function handleSave() {
    if (!saveName) return;
    await reportApi.save(reportType, saveName, filters, chartType);
    setSaveName("");
    await loadSaved();
  }

  async function handleFavourite() {
    await reportApi.addFavourite(reportType, null);
    alert("Added to favourites.");
  }

  async function handleLoadSaved(s: SavedReportRecord) {
    setReportType(s.reportType);
    setFilters(s.filters);
    setChartType(s.chartType);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Reports & Business Intelligence</h1>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} style={{ padding: 6 }}>
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>)}
            </select>
            <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)} style={{ padding: 6 }}>
              {CHART_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <input type="date" value={filters.dateFrom ?? ""} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })} style={{ padding: 6 }} placeholder="From" />
            <input type="date" value={filters.dateTo ?? ""} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })} style={{ padding: 6 }} placeholder="To" />
            <input placeholder="Buyer/Company" value={filters.buyerCompany ?? ""} onChange={(e) => setFilters({ ...filters, buyerCompany: e.target.value || undefined })} style={{ padding: 6 }} />
            <input placeholder="Customer" value={filters.customerName ?? ""} onChange={(e) => setFilters({ ...filters, customerName: e.target.value || undefined })} style={{ padding: 6 }} />
            <input placeholder="Status" value={filters.status ?? ""} onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })} style={{ padding: 6 }} />
            <button onClick={handleRun} disabled={loading}>{loading ? "Running..." : "Run Report"}</button>
          </div>

          {result && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 16 }}>
                  {result.summary.map((s, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <PermissionGate permission="report.export">
                    <button onClick={() => reportApi.downloadExport(reportType, "xlsx", filters, `${reportType}.xlsx`)}>Excel</button>
                    <button onClick={() => reportApi.downloadExport(reportType, "csv", filters, `${reportType}.csv`)}>CSV</button>
                    <button onClick={() => reportApi.downloadExport(reportType, "pdf", filters, `${reportType}.pdf`)}>PDF</button>
                  </PermissionGate>
                  <button onClick={handlePrint}>Print</button>
                  <button onClick={handleFavourite}>☆ Favourite</button>
                </div>
              </div>

              <ReportChart chartType={chartType} data={result.chartSeries} />

              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>{result.columns.map((c) => <th key={c} style={{ padding: 6, fontSize: 12, color: "#666" }}>{c}</th>)}</tr></thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>{row.map((cell, j) => <td key={j} style={{ padding: 6, fontSize: 13 }}>{cell ?? "—"}</td>)}</tr>
                    ))}
                    {result.rows.length === 0 && <tr><td colSpan={result.columns.length} style={{ padding: 16, textAlign: "center", color: "#999" }}>No data for this filter combination.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <input placeholder="Save this report as..." value={saveName} onChange={(e) => setSaveName(e.target.value)} style={{ padding: 6, flex: 1 }} />
                <button onClick={handleSave}>Save Report</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 220 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Saved Reports</h3>
          {saved.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13, cursor: "pointer" }} onClick={() => handleLoadSaved(s)}>
              <span>{s.name}</span>
              <button onClick={(e) => { e.stopPropagation(); reportApi.deleteSaved(s.id).then(loadSaved); }} style={{ fontSize: 11 }}>✕</button>
            </div>
          ))}
          {saved.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>No saved reports yet.</p>}
        </div>
      </div>
    </div>
  );
}
