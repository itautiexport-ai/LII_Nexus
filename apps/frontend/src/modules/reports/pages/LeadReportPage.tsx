import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";
import { crmApi, LeadRecord, LeadSource, LeadStatus } from "../../crm/api/crmApi";
import { useIsAdmin, useIsSystemAdmin } from "../../auth/hooks/usePermissions";

const STATUS_COLORS: Record<LeadStatus, string> = {
  won: "#10b981",     // Emerald green
  active: "#3b82f6",  // Vibrant royal blue
  lost: "#ef4444",    // Crimson red
  dead: "#64748b",    // Slate gray
  dormant: "#f59e0b", // Amber
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  won: "Won / Converted",
  active: "Active Pipeline",
  lost: "Lost Order",
  dead: "Dead / Inactive",
  dormant: "Dormant",
};

const SOURCE_LABELS: Record<string, string> = {
  all: "All Sources",
  trade_fair: "🎪 Trade Fair",
  whatsapp: "📱 WhatsApp",
  email: "✉️ Email Inquiry",
  website: "🌐 Website",
  referral: "👥 Referral",
  other: "Other",
};

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹ 0";
  return "₹ " + Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function normalizeFairName(raw: string | null | undefined): string {
  if (!raw) return "Unspecified / Direct";
  const trimmed = raw.trim();
  if (!trimmed) return "Unspecified / Direct";
  if (trimmed.toLowerCase() === "delhi") return "Delhi Fair";
  if (trimmed.toLowerCase() === "china") return "China Fair";
  return trimmed;
}

export default function LeadReportPage() {
  const navigate = useNavigate();
  const isSystemAdmin = useIsSystemAdmin();
  const isAdmin = isSystemAdmin || useIsAdmin();

  // Raw data state
  const [allLeads, setAllLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedFair, setSelectedFair] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<"all" | "30d" | "90d" | "year" | "custom">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Fetch leads from CRM API
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const leadsRes = await crmApi.list({ pageSize: "10000" });
      setAllLeads(leadsRes.items || []);
    } catch (err: any) {
      console.error("Failed to load lead reports data:", err);
      setError("Failed to fetch lead data. Please ensure the CRM service is active.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Update date filter based on presets
  const handlePresetChange = (preset: "all" | "30d" | "90d" | "year" | "custom") => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    } else if (preset === "30d") {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setDateFrom(past.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    } else if (preset === "90d") {
      const past = new Date();
      past.setDate(now.getDate() - 90);
      setDateFrom(past.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    } else if (preset === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setDateFrom(startOfYear.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    }
  };

  // Distinct trade fair names for secondary dropdown
  const distinctTradeFairs = useMemo(() => {
    const set = new Set<string>();
    allLeads.forEach((lead) => {
      if (lead.leadSource === "trade_fair" && lead.tradeFairName) {
        set.add(normalizeFairName(lead.tradeFairName));
      }
    });
    return Array.from(set).sort();
  }, [allLeads]);

  // Overall Global Statistics (All leads regardless of filter)
  const overallStats = useMemo(() => {
    const total = allLeads.length;
    let wonCount = 0;
    let activeCount = 0;
    let lostDeadCount = 0;
    let totalRevenue = 0;
    let pipelineValue = 0;

    allLeads.forEach((lead) => {
      const amt = Number(lead.forecastAmount) || 0;
      pipelineValue += amt;

      if (lead.status === "won") {
        wonCount++;
        totalRevenue += amt;
      } else if (lead.status === "active") {
        activeCount++;
      } else if (lead.status === "lost" || lead.status === "dead") {
        lostDeadCount++;
      }
    });

    const winRate = total > 0 ? ((wonCount / total) * 100).toFixed(1) : "0.0";
    const activeShare = total > 0 ? ((activeCount / total) * 100).toFixed(1) : "0.0";
    const dropOffRate = total > 0 ? ((lostDeadCount / total) * 100).toFixed(1) : "0.0";

    return {
      total,
      wonCount,
      activeCount,
      lostDeadCount,
      totalRevenue,
      pipelineValue,
      winRate,
      activeShare,
      dropOffRate,
    };
  }, [allLeads]);

  // Filtered Leads based on Source, Fair, and Date
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      // 1. Date filter
      if (dateFrom && lead.inquiryDate && lead.inquiryDate < dateFrom) return false;
      if (dateTo && lead.inquiryDate && lead.inquiryDate > dateTo) return false;

      // 2. Source filter
      if (selectedSource !== "all" && lead.leadSource !== selectedSource) {
        return false;
      }

      // 3. Trade Fair filter (if source is trade_fair or if fair selected)
      if (selectedSource === "trade_fair" && selectedFair !== "all") {
        const fairNormalized = normalizeFairName(lead.tradeFairName);
        if (fairNormalized !== selectedFair) return false;
      }

      return true;
    });
  }, [allLeads, selectedSource, selectedFair, dateFrom, dateTo]);

  // Performance metrics for filtered data (for Pie Chart & Value Table)
  const performanceData = useMemo(() => {
    const total = filteredLeads.length;
    const statusMap: Record<LeadStatus, { count: number; forecast: number; wonRevenue: number }> = {
      won: { count: 0, forecast: 0, wonRevenue: 0 },
      active: { count: 0, forecast: 0, wonRevenue: 0 },
      lost: { count: 0, forecast: 0, wonRevenue: 0 },
      dead: { count: 0, forecast: 0, wonRevenue: 0 },
      dormant: { count: 0, forecast: 0, wonRevenue: 0 },
    };

    filteredLeads.forEach((lead) => {
      const amt = Number(lead.forecastAmount) || 0;
      const st = (lead.status || "active") as LeadStatus;
      if (statusMap[st]) {
        statusMap[st].count++;
        statusMap[st].forecast += amt;
        if (st === "won") {
          statusMap[st].wonRevenue += amt;
        }
      }
    });

    const statuses: LeadStatus[] = ["won", "active", "lost", "dead", "dormant"];

    const tableRows = statuses.map((st) => {
      const d = statusMap[st];
      const count = d.count;
      const share = total > 0 ? (count / total) * 100 : 0;
      const avgValue = count > 0 ? d.forecast / count : 0;
      const isWon = st === "won";
      const winRate = total > 0 ? (isWon ? (count / total) * 100 : 0) : 0;

      return {
        status: st,
        label: STATUS_LABELS[st],
        color: STATUS_COLORS[st],
        count,
        share: share.toFixed(1),
        forecast: d.forecast,
        wonRevenue: d.wonRevenue,
        avgValue,
        winRate: isWon ? winRate.toFixed(1) : "—",
      };
    });

    // Pie chart slices (only include categories that have count > 0)
    const pieSlices = statuses
      .filter((st) => statusMap[st].count > 0)
      .map((st) => ({
        name: STATUS_LABELS[st],
        value: statusMap[st].count,
        revenue: statusMap[st].wonRevenue,
        forecast: statusMap[st].forecast,
        color: STATUS_COLORS[st],
        status: st,
      }));

    const totalForecast = filteredLeads.reduce((acc, l) => acc + (Number(l.forecastAmount) || 0), 0);
    const totalWonRevenue = statusMap.won.wonRevenue;
    const overallWinRate = total > 0 ? ((statusMap.won.count / total) * 100).toFixed(1) : "0.0";
    const overallAvgValue = total > 0 ? totalForecast / total : 0;

    return {
      total,
      pieSlices,
      tableRows,
      totalForecast,
      totalWonRevenue,
      overallWinRate,
      overallAvgValue,
    };
  }, [filteredLeads]);

  // CSV Export for filtered performance data
  const handleExportCSV = () => {
    const headers = ["Status / Outcome", "Leads Count", "Share (%)", "Expected Forecast Value (INR)", "Won Revenue (INR)", "Avg Value (INR)", "Win Rate (%)"];
    const rows = performanceData.tableRows.map((r) => [
      r.label,
      r.count,
      `${r.share}%`,
      r.forecast,
      r.wonRevenue,
      Math.round(r.avgValue),
      r.winRate !== "—" ? `${r.winRate}%` : "—",
    ]);

    rows.push([
      "Total / Net Pipeline",
      performanceData.total,
      "100%",
      performanceData.totalForecast,
      performanceData.totalWonRevenue,
      Math.round(performanceData.overallAvgValue),
      `${performanceData.overallWinRate}%`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lead_Performance_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1300, margin: "0 auto", fontFamily: "Inter, sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .lead-report-print, .lead-report-print * { visibility: visible; }
          .lead-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; background: #fff !important; }
          .no-print { display: none !important; }
        }
        .stat-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
        }
        .filter-select {
          padding: 9px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .filter-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .perf-table th {
          padding: 12px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          text-align: left;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .perf-table td {
          padding: 13px 14px;
          font-size: 13px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .perf-table tbody tr:hover td {
          background: #f8fafc;
        }
      `}</style>

      <div className="lead-report-print">
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 4 }}>
              <Link to="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Reports</Link>
              <span>/</span>
              <span style={{ color: "#2563eb", fontWeight: 600 }}>Lead Performance Report</span>
            </div>
            {/* Title only - subtitle removed as requested */}
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Lead Performance Report
            </h1>
          </div>

          <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              🔄 {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              📥 Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              🖨️ Print Report
            </button>
            <Link
              to="/admin/crm/leads/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                background: "#2563eb",
                borderRadius: 8,
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              ➕ Add Lead
            </Link>
          </div>
        </div>

        {/* OVERALL VIEW CARDS (Right below heading, clear & simple overview) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 22 }}>
          {/* Total Leads */}
          <div className="stat-card" style={{ borderLeft: "4px solid #6366f1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Leads Created
              </span>
              <span style={{ fontSize: 18 }}>📋</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
                {overallStats.total}
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>Overall inquiries recorded</span>
            </div>
          </div>

          {/* Active Leads */}
          <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Pipeline
              </span>
              <span style={{ fontSize: 18 }}>⚡</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb" }}>
                  {overallStats.activeCount}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", background: "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>
                  {overallStats.activeShare}%
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>In discussion & quotation</span>
            </div>
          </div>

          {/* Won / Converted */}
          <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Won / Converted
              </span>
              <span style={{ fontSize: 18 }}>🏆</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>
                  {overallStats.wonCount}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#065f46", background: "#d1fae5", padding: "1px 6px", borderRadius: 4 }}>
                  {overallStats.winRate}% Win
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#047857", fontWeight: 600, marginTop: 2 }}>
                Won: {formatCurrency(overallStats.totalRevenue)}
              </div>
            </div>
          </div>

          {/* Expected Pipeline Value */}
          <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Pipeline Value
              </span>
              <span style={{ fontSize: 18 }}>💰</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706" }}>
                {formatCurrency(overallStats.pipelineValue)}
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>Combined inquiry estimate</span>
            </div>
          </div>

          {/* Dead & Lost */}
          <div className="stat-card" style={{ borderLeft: "4px solid #ef4444" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Dead & Lost Leads
              </span>
              <span style={{ fontSize: 18 }}>⚠️</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#dc2626" }}>
                  {overallStats.lostDeadCount}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", background: "#fee2e2", padding: "1px 6px", borderRadius: 4 }}>
                  {overallStats.dropOffRate}%
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>Dropped or non-responsive</span>
            </div>
          </div>
        </div>

        {/* DROPDOWN CONTROLS SECTION */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 22,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            {/* Primary Source Dropdown + Secondary Trade Fair Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              {/* Dropdown 1: Lead Source */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Lead Source
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => {
                    setSelectedSource(e.target.value);
                    if (e.target.value !== "trade_fair") {
                      setSelectedFair("all");
                    }
                  }}
                  className="filter-select"
                  style={{ minWidth: 200 }}
                >
                  <option value="all">🌐 All Sources</option>
                  <option value="trade_fair">🎪 Trade Fair</option>
                  <option value="whatsapp">📱 WhatsApp</option>
                  <option value="email">✉️ Email Inquiry</option>
                  <option value="website">💻 Website</option>
                  <option value="referral">👥 Referral</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Dropdown 2: Dynamic Trade Fair Selection (Shown only when Trade Fair is selected) */}
              {selectedSource === "trade_fair" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    Select Trade Fair
                  </label>
                  <select
                    value={selectedFair}
                    onChange={(e) => setSelectedFair(e.target.value)}
                    className="filter-select"
                    style={{ minWidth: 230, borderColor: "#3b82f6", background: "#eff6ff" }}
                  >
                    <option value="all">🎪 All Trade Fairs ({distinctTradeFairs.length})</option>
                    {distinctTradeFairs.map((fair) => (
                      <option key={fair} value={fair}>
                        📍 {fair}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Date Preset Filter */}
            <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Time Period:</span>
              <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                {(["all", "30d", "90d", "year"] as const).map((p) => {
                  const labels = { all: "All Time", "30d": "Last 30 Days", "90d": "Last 90 Days", year: "This Year" };
                  const active = datePreset === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePresetChange(p)}
                      style={{
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        border: "none",
                        borderRadius: 6,
                        background: active ? "#ffffff" : "transparent",
                        color: active ? "#1e293b" : "#64748b",
                        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                        cursor: "pointer",
                      }}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* VISUAL PERFORMANCE DISPLAY: PIE CHART + HIGHLIGHTS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20, marginBottom: 24 }}>
          {/* Simple Clean Pie Chart */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Performance Distribution ({performanceData.total} Leads)
                </h2>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {SOURCE_LABELS[selectedSource] || selectedSource}
                  {selectedSource === "trade_fair" && selectedFair !== "all" ? ` — ${selectedFair}` : ""}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "3px 8px", borderRadius: 6 }}>
                Win Rate: {performanceData.overallWinRate}%
              </span>
            </div>

            {performanceData.total === 0 ? (
              <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
                No lead records found for this selection.
              </div>
            ) : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceData.pieSlices}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {performanceData.pieSlices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          const pct = performanceData.total > 0 ? ((item.value / performanceData.total) * 100).toFixed(1) : "0";
                          return (
                            <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "10px 14px", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                              <div style={{ fontWeight: 700, color: item.color, fontSize: 13, marginBottom: 4 }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: 12, color: "#334155" }}>
                                Count: <strong>{item.value}</strong> ({pct}%)
                              </div>
                              <div style={{ fontSize: 12, color: "#334155", marginTop: 2 }}>
                                Forecast: <strong>{formatCurrency(item.forecast)}</strong>
                              </div>
                              {item.status === "won" && (
                                <div style={{ fontSize: 12, color: "#059669", fontWeight: 700, marginTop: 2 }}>
                                  Revenue Won: {formatCurrency(item.revenue)}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Metrics Summary for Current Selection */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a", marginBottom: 4 }}>
                Selection Performance Metrics
              </h2>
              <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "#64748b" }}>
                Key commercial figures for {SOURCE_LABELS[selectedSource] || selectedSource}
                {selectedSource === "trade_fair" && selectedFair !== "all" ? ` (${selectedFair})` : ""}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Filtered Inquiries</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                    {performanceData.total}
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "#ecfdf5", borderRadius: 8, border: "1px solid #d1fae5" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#065f46", textTransform: "uppercase" }}>Conversion Win Rate</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>
                    {performanceData.overallWinRate}%
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #dbeafe" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1e40af", textTransform: "uppercase" }}>Won Revenue</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1d4ed8", marginTop: 4 }}>
                    {formatCurrency(performanceData.totalWonRevenue)}
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#92400e", textTransform: "uppercase" }}>Forecast Value</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#d97706", marginTop: 4 }}>
                    {formatCurrency(performanceData.totalForecast)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "10px 14px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Average Deal Size in Scope:</span>
              <strong style={{ color: "#0f172a", fontSize: 13 }}>{formatCurrency(performanceData.overallAvgValue)}</strong>
            </div>
          </div>
        </div>

        {/* PERFORMANCE & EXPECTED VALUE TABLE */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Performance & Expected Value Summary
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
                Status-wise conversion, pipeline expectation, and realized revenue
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="perf-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Status / Outcome</th>
                  <th style={{ textAlign: "right" }}>Leads Count</th>
                  <th style={{ textAlign: "right" }}>Share of Leads</th>
                  <th style={{ textAlign: "right" }}>Expected / Forecast Value</th>
                  <th style={{ textAlign: "right" }}>Won Revenue</th>
                  <th style={{ textAlign: "right" }}>Avg Value / Lead</th>
                  <th style={{ textAlign: "right" }}>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.tableRows.map((r) => (
                  <tr key={r.status}>
                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: r.color,
                            display: "inline-block",
                          }}
                        />
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>{r.label}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {r.count}
                    </td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>
                      {r.share}%
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#334155" }}>
                      {formatCurrency(r.forecast)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: r.status === "won" ? "#059669" : "#64748b" }}>
                      {r.status === "won" ? formatCurrency(r.wonRevenue) : "—"}
                    </td>
                    <td style={{ textAlign: "right", color: "#475569" }}>
                      {formatCurrency(r.avgValue)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: r.status === "won" ? "#059669" : "#94a3b8" }}>
                      {r.winRate !== "—" ? `${r.winRate}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", fontWeight: 700 }}>
                  <td style={{ padding: "14px", fontSize: 13, color: "#0f172a" }}>
                    TOTAL / NET PIPELINE
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", fontSize: 14, color: "#0f172a" }}>
                    {performanceData.total}
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", color: "#64748b" }}>
                    100.0%
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", fontSize: 14, color: "#d97706" }}>
                    {formatCurrency(performanceData.totalForecast)}
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", fontSize: 14, color: "#059669" }}>
                    {formatCurrency(performanceData.totalWonRevenue)}
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", color: "#475569" }}>
                    {formatCurrency(performanceData.overallAvgValue)}
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", fontSize: 14, color: "#059669" }}>
                    {performanceData.overallWinRate}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
