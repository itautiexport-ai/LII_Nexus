import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { crmApi, LeadRecord, LeadSource, LeadStatus } from "../../crm/api/crmApi";
import { merchantsApi, MerchantRecord } from "../../admin/masterdata/api/merchantsApi";

// Color palettes for executive dashboard
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
  trade_fair: "Trade Fair",
  whatsapp: "WhatsApp",
  email: "Email Inquiry",
  website: "Website",
  referral: "Referral",
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

  // Raw data state
  const [allLeads, setAllLeads] = useState<LeadRecord[]>([]);
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [datePreset, setDatePreset] = useState<"all" | "30d" | "90d" | "year" | "custom">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedFair, setSelectedFair] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMerchant, setSelectedMerchant] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Table pagination & sorting
  const [tablePage, setTablePage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<keyof LeadRecord>("inquiryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch leads from CRM API
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, merchantsRes] = await Promise.all([
        crmApi.list({ pageSize: "10000" }),
        merchantsApi.list().catch(() => [] as MerchantRecord[]),
      ]);
      setAllLeads(leadsRes.items || []);
      setMerchants(merchantsRes || []);
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

  // Distinct trade fair names from leads
  const distinctTradeFairs = useMemo(() => {
    const set = new Set<string>();
    allLeads.forEach((l) => {
      if (l.tradeFairName && l.tradeFairName.trim()) {
        set.add(normalizeFairName(l.tradeFairName));
      }
    });
    return Array.from(set).sort();
  }, [allLeads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      // Date filter
      if (dateFrom && lead.inquiryDate && lead.inquiryDate < dateFrom) return false;
      if (dateTo && lead.inquiryDate && lead.inquiryDate > dateTo) return false;

      // Source filter
      if (selectedSource !== "all" && lead.leadSource !== selectedSource) return false;

      // Trade fair filter
      if (selectedFair !== "all") {
        const leadFair = normalizeFairName(lead.tradeFairName);
        if (leadFair !== selectedFair) return false;
      }

      // Status filter
      if (selectedStatus !== "all" && lead.status !== selectedStatus) return false;

      // Merchant filter
      if (selectedMerchant !== "all") {
        if (lead.assignedMerchantId !== selectedMerchant && lead.merchantName !== selectedMerchant) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (lead.leadCode || "").toLowerCase().includes(q);
        const matchName = (lead.contactName || "").toLowerCase().includes(q);
        const matchCompany = (lead.companyName || "").toLowerCase().includes(q);
        const matchCountry = (lead.country || "").toLowerCase().includes(q);
        const matchFair = (lead.tradeFairName || "").toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCompany && !matchCountry && !matchFair) {
          return false;
        }
      }

      return true;
    });
  }, [allLeads, dateFrom, dateTo, selectedSource, selectedFair, selectedStatus, selectedMerchant, searchQuery]);

  // Executive KPI Aggregations
  const kpis = useMemo(() => {
    const total = filteredLeads.length;
    let active = 0;
    let won = 0;
    let lost = 0;
    let dead = 0;
    let dormant = 0;
    let tradeFairLeads = 0;
    let totalForecast = 0;
    let wonRevenue = 0;

    filteredLeads.forEach((lead) => {
      if (lead.status === "active") active++;
      else if (lead.status === "won") {
        won++;
        wonRevenue += Number(lead.forecastAmount || 0);
      } else if (lead.status === "lost") lost++;
      else if (lead.status === "dead") dead++;
      else if (lead.status === "dormant") dormant++;

      if (lead.leadSource === "trade_fair") {
        tradeFairLeads++;
      }

      totalForecast += Number(lead.forecastAmount || 0);
    });

    const deadAndLost = dead + lost;
    const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
    const activeRate = total > 0 ? ((active / total) * 100).toFixed(1) : "0.0";
    const dropRate = total > 0 ? ((deadAndLost / total) * 100).toFixed(1) : "0.0";
    const tradeFairPercent = total > 0 ? ((tradeFairLeads / total) * 100).toFixed(1) : "0.0";

    return {
      total,
      active,
      activeRate,
      won,
      winRate,
      wonRevenue,
      dead,
      lost,
      deadAndLost,
      dropRate,
      tradeFairLeads,
      tradeFairPercent,
      totalForecast,
    };
  }, [filteredLeads]);

  // Status Distribution Pie Chart Data
  const statusPieData = useMemo(() => {
    const counts: Record<LeadStatus, { count: number; value: number }> = {
      active: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
      dead: { count: 0, value: 0 },
      dormant: { count: 0, value: 0 },
    };

    filteredLeads.forEach((l) => {
      if (counts[l.status]) {
        counts[l.status].count++;
        counts[l.status].value += Number(l.forecastAmount || 0);
      }
    });

    const items: Array<{ name: string; key: LeadStatus; count: number; value: number; color: string; percent: string }> = [];
    (Object.keys(counts) as LeadStatus[]).forEach((st) => {
      if (counts[st].count > 0) {
        items.push({
          name: STATUS_LABELS[st],
          key: st,
          count: counts[st].count,
          value: counts[st].value,
          color: STATUS_COLORS[st],
          percent: kpis.total > 0 ? ((counts[st].count / kpis.total) * 100).toFixed(1) : "0",
        });
      }
    });

    return items;
  }, [filteredLeads, kpis.total]);

  // Trade Fair Performance Aggregations (Bar Chart + Leaderboard)
  const tradeFairAnalysis = useMemo(() => {
    const fairMap = new Map<
      string,
      {
        fairName: string;
        totalGenerated: number;
        won: number;
        active: number;
        lost: number;
        dead: number;
        totalForecast: number;
        wonRevenue: number;
      }
    >();

    filteredLeads.forEach((lead) => {
      // Analyze leads with a trade fair name or source == trade_fair
      if (lead.leadSource === "trade_fair" || (lead.tradeFairName && lead.tradeFairName.trim())) {
        const fair = normalizeFairName(lead.tradeFairName);
        if (!fairMap.has(fair)) {
          fairMap.set(fair, {
            fairName: fair,
            totalGenerated: 0,
            won: 0,
            active: 0,
            lost: 0,
            dead: 0,
            totalForecast: 0,
            wonRevenue: 0,
          });
        }

        const entry = fairMap.get(fair)!;
        entry.totalGenerated++;
        const amount = Number(lead.forecastAmount || 0);
        entry.totalForecast += amount;

        if (lead.status === "won") {
          entry.won++;
          entry.wonRevenue += amount;
        } else if (lead.status === "active") {
          entry.active++;
        } else if (lead.status === "lost") {
          entry.lost++;
        } else if (lead.status === "dead") {
          entry.dead++;
        }
      }
    });

    const rows = Array.from(fairMap.values()).map((f) => {
      const winRateNum = f.totalGenerated > 0 ? (f.won / f.totalGenerated) * 100 : 0;
      return {
        ...f,
        winRate: winRateNum.toFixed(1),
        winRateNum,
      };
    });

    // Sort by total generated descending for display
    rows.sort((a, b) => b.totalGenerated - a.totalGenerated);

    // Identify winners
    const topLeadGenerator = rows.length > 0 ? [...rows].sort((a, b) => b.totalGenerated - a.totalGenerated)[0] : null;
    const topWinFair = rows.length > 0 ? [...rows].sort((a, b) => b.won - a.won || b.winRateNum - a.winRateNum)[0] : null;

    return {
      rows,
      topLeadGenerator,
      topWinFair,
    };
  }, [filteredLeads]);

  // Acquisition Channels Breakdown
  const channelBreakdown = useMemo(() => {
    const channels: Record<string, { label: string; count: number; won: number; forecast: number }> = {
      trade_fair: { label: "Trade Fair", count: 0, won: 0, forecast: 0 },
      whatsapp: { label: "WhatsApp", count: 0, won: 0, forecast: 0 },
      email: { label: "Email", count: 0, won: 0, forecast: 0 },
      website: { label: "Website", count: 0, won: 0, forecast: 0 },
      referral: { label: "Referral", count: 0, won: 0, forecast: 0 },
      other: { label: "Other", count: 0, won: 0, forecast: 0 },
    };

    filteredLeads.forEach((l) => {
      const src = channels[l.leadSource] ? l.leadSource : "other";
      channels[src].count++;
      if (l.status === "won") channels[src].won++;
      channels[src].forecast += Number(l.forecastAmount || 0);
    });

    return Object.entries(channels)
      .map(([key, data]) => ({
        key,
        label: data.label,
        count: data.count,
        won: data.won,
        forecast: data.forecast,
        percent: kpis.total > 0 ? ((data.count / kpis.total) * 100).toFixed(1) : "0",
        winRate: data.count > 0 ? ((data.won / data.count) * 100).toFixed(1) : "0",
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads, kpis.total]);

  // Sorted Leads for Data Table
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let valA: any = a[sortField] ?? "";
      let valB: any = b[sortField] ?? "";

      if (sortField === "forecastAmount") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortOrder]);

  // Paginated Leads
  const paginatedLeads = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, tablePage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));

  const handleSort = (field: keyof LeadRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Lead Code",
      "Inquiry Date",
      "Buyer Name",
      "Company",
      "Country",
      "City",
      "Source",
      "Trade Fair Name",
      "Assigned Merchant",
      "Stage",
      "Status",
      "Forecast Amount (INR)",
      "Priority",
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.leadCode}"`,
      `"${l.inquiryDate || ""}"`,
      `"${(l.contactName || "").replace(/"/g, '""')}"`,
      `"${(l.companyName || "").replace(/"/g, '""')}"`,
      `"${l.country || ""}"`,
      `"${l.city || ""}"`,
      `"${l.leadSource}"`,
      `"${(l.tradeFairName || "").replace(/"/g, '""')}"`,
      `"${(l.merchantName || "").replace(/"/g, '""')}"`,
      `"${l.salesStage}"`,
      `"${l.status}"`,
      `"${l.forecastAmount || 0}"`,
      `"${l.priority || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lead_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
    setSelectedSource("all");
    setSelectedFair("all");
    setSelectedStatus("all");
    setSelectedMerchant("all");
    setSearchQuery("");
    setTablePage(1);
  };

  const activeFilterCount = [
    datePreset !== "all" || dateFrom || dateTo,
    selectedSource !== "all",
    selectedFair !== "all",
    selectedStatus !== "all",
    selectedMerchant !== "all",
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div style={{ padding: "28px 36px", background: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
      {/* Top Breadcrumb & Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 6 }}>
            <Link to="/admin/modules/reports" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
              Reports
            </Link>
            <span>/</span>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>Lead Report</span>
            <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>
              Executive Dashboard
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Lead Intelligence & Trade Fair Performance Report
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Management-level overview of lead generation, pipeline status, and trade fair conversion efficiency.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <span style={{ display: "inline-block", transform: loading ? "rotate(180deg)" : "none", transition: "transform 0.4s" }}>🔄</span>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <span>📥</span> Export CSV
          </button>

          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <span>🖨️</span> Print Report
          </button>

          <button
            onClick={() => navigate("/admin/crm/leads/new")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#2563eb",
              border: "1px solid #1d4ed8",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
          >
            <span>+</span> Add Lead
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 14, borderRadius: 8, color: "#991b1b", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* KPI Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        {/* Total Leads Created */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #3b82f6",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Total Leads Created
            </span>
            <span style={{ fontSize: 18 }}>📋</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{kpis.total}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Inquiries entered via Add Lead & CRM
          </div>
        </div>

        {/* Active Leads */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #06b6d4",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Active Leads
            </span>
            <span style={{ fontSize: 18 }}>⚡</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#0284c7" }}>{kpis.active}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0369a1", background: "#e0f2fe", padding: "2px 6px", borderRadius: 6 }}>
              {kpis.activeRate}% of total
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            In active discussions & negotiation
          </div>
        </div>

        {/* Won / Converted Leads */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #10b981",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Won / Converted
            </span>
            <span style={{ fontSize: 18 }}>🏆</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#059669" }}>{kpis.won}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#047857", background: "#d1fae5", padding: "2px 8px", borderRadius: 6 }}>
              {kpis.winRate}% Win Rate
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginTop: 4 }}>
            Revenue Won: {formatCurrency(kpis.wonRevenue)}
          </div>
        </div>

        {/* Dead / Lost Leads */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #ef4444",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Dead & Lost Leads
            </span>
            <span style={{ fontSize: 18 }}>⚠️</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#dc2626" }}>{kpis.deadAndLost}</span>
            <span style={{ fontSize: 12, color: "#991b1b", background: "#fee2e2", padding: "2px 6px", borderRadius: 6 }}>
              Dead: {kpis.dead} · Lost: {kpis.lost}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {kpis.dropRate}% total drop-off rate
          </div>
        </div>

        {/* Trade Fair Sourced */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #8b5cf6",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Trade Fair Leads
            </span>
            <span style={{ fontSize: 18 }}>🎪</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#7c3aed" }}>{kpis.tradeFairLeads}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9", background: "#ede9fe", padding: "2px 6px", borderRadius: 6 }}>
              {kpis.tradeFairPercent}% of Total
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Acquired through trade exhibition booths
          </div>
        </div>

        {/* Total Pipeline Forecast */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #f59e0b",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Pipeline Value
            </span>
            <span style={{ fontSize: 18 }}>💰</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#b45309", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatCurrency(kpis.totalForecast)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Combined estimated inquiry value
          </div>
        </div>
      </div>

      {/* Filter and Drill-down Panel */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Filters & Drilldown:</span>
            {activeFilterCount > 0 && (
              <span style={{ fontSize: 12, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                {activeFilterCount} Active
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              ✕ Reset All Filters
            </button>
          )}
        </div>

        {/* Date presets */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginRight: 4 }}>Period:</span>
          {(["all", "30d", "90d", "year", "custom"] as const).map((p) => {
            const labels = {
              all: "All Time",
              "30d": "Last 30 Days",
              "90d": "Last 90 Days",
              year: "This Year",
              custom: "Custom Range",
            };
            const isSelected = datePreset === p;
            return (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                  background: isSelected ? "#eff6ff" : "#fff",
                  color: isSelected ? "#1d4ed8" : "#475569",
                  cursor: "pointer",
                }}
              >
                {labels[p]}
              </button>
            );
          })}

          {datePreset === "custom" && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 8 }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 6 }}
              />
              <span style={{ fontSize: 12, color: "#64748b" }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 6 }}
              />
            </div>
          )}
        </div>

        {/* Filter dropdowns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {/* Source Filter */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              LEAD SOURCE
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff" }}
            >
              <option value="all">All Sources</option>
              <option value="trade_fair">🎪 Trade Fair</option>
              <option value="whatsapp">📱 WhatsApp</option>
              <option value="email">✉️ Email Inquiry</option>
              <option value="website">🌐 Website</option>
              <option value="referral">👥 Referral</option>
              <option value="other">📌 Other</option>
            </select>
          </div>

          {/* Trade Fair Filter */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              TRADE FAIR EXHIBITION
            </label>
            <select
              value={selectedFair}
              onChange={(e) => setSelectedFair(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff" }}
            >
              <option value="all">All Trade Fairs ({distinctTradeFairs.length})</option>
              {distinctTradeFairs.map((fair) => (
                <option key={fair} value={fair}>
                  🎪 {fair}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              LEAD STATUS
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff" }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Pipeline</option>
              <option value="won">🏆 Won / Converted</option>
              <option value="lost">Lost</option>
              <option value="dead">Dead</option>
              <option value="dormant">Dormant</option>
            </select>
          </div>

          {/* Merchant Filter */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              ASSIGNED MERCHANT
            </label>
            <select
              value={selectedMerchant}
              onChange={(e) => setSelectedMerchant(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff" }}
            >
              <option value="all">All Merchants</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  👤 {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              SEARCH BUYER / COMPANY / FAIR
            </label>
            <input
              type="text"
              placeholder="e.g. Nordic, Delhi, LEAD-000..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {/* Two Major Visual Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* CHART 1: Pie Chart for Lead Status Distribution */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Lead Status Distribution
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                Breakdown of {kpis.total} inquiries across Active, Won, Dead & Lost status
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Overall Win Rate</span>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>{kpis.winRate}%</div>
            </div>
          </div>

          {statusPieData.length === 0 ? (
            <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              No leads available for this selection
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240, height: 280, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val} leads (${item.payload.percent}%) · Value: ${formatCurrency(item.payload.value)}`,
                        name,
                      ]}
                    />
                    <Pie
                      data={statusPieData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{kpis.total}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                    Total Leads
                  </div>
                </div>
              </div>

              {/* Status Breakdown Legend & Counts */}
              <div style={{ minWidth: 170, paddingLeft: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {statusPieData.map((item) => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: item.color }} />
                      <span style={{ color: "#334155", fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>{item.count}</strong>
                      <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: Trade Fair Analysis (Dual Bar Chart: Leads Generated vs Leads Won) */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Trade Fair Performance Analysis
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                Which trade fair generated the most leads vs converted (won) the most orders
              </p>
            </div>

            {/* Quick Performance Badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tradeFairAnalysis.topLeadGenerator && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>
                  <span style={{ color: "#1e40af", fontWeight: 700 }}>🥇 Top Volume: </span>
                  <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                    {tradeFairAnalysis.topLeadGenerator.fairName} ({tradeFairAnalysis.topLeadGenerator.totalGenerated})
                  </span>
                </div>
              )}
              {tradeFairAnalysis.topWinFair && tradeFairAnalysis.topWinFair.won > 0 && (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>
                  <span style={{ color: "#065f46", fontWeight: 700 }}>🏆 Top Converter: </span>
                  <span style={{ color: "#047857", fontWeight: 600 }}>
                    {tradeFairAnalysis.topWinFair.fairName} ({tradeFairAnalysis.topWinFair.won} won · {tradeFairAnalysis.topWinFair.winRate}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {tradeFairAnalysis.rows.length === 0 ? (
            <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              No trade fair inquiries found for this filter criteria
            </div>
          ) : (
            <div style={{ height: 280, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeFairAnalysis.rows} margin={{ top: 15, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="fairName"
                    fontSize={11}
                    tick={{ fill: "#475569" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis fontSize={11} tick={{ fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ background: "#fff", border: "1px solid #cbd5e1", padding: "10px 14px", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13, marginBottom: 4 }}>
                              🎪 {data.fairName}
                            </div>
                            <div style={{ fontSize: 12, color: "#2563eb", marginBottom: 2 }}>
                              • Leads Generated: <strong>{data.totalGenerated}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: "#059669", marginBottom: 2 }}>
                              • Leads Won / Converted: <strong>{data.won}</strong> ({data.winRate}% win rate)
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>
                              • Active Pipeline: <strong>{data.active}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 2 }}>
                              • Dead / Lost: <strong>{data.lost + data.dead}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 600, marginTop: 4, paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
                              Won Value: {formatCurrency(data.wonRevenue)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                  />
                  <Bar
                    dataKey="totalGenerated"
                    name="Leads Generated"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="won"
                    name="Leads Won (Converted)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Trade Fair Detailed Leaderboard Table & Lead Source Channel Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Trade Fair Performance Leaderboard */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Trade Fair Conversion Leaderboard
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                Rankings by inquiries generated, conversions and revenue won
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, background: "#f8fafc", padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              {tradeFairAnalysis.rows.length} Exhibitions
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>Exhibition Name</th>
                  <th style={{ padding: "8px 10px", color: "#64748b", fontWeight: 600, textAlign: "center" }}>Generated</th>
                  <th style={{ padding: "8px 10px", color: "#64748b", fontWeight: 600, textAlign: "center" }}>Active</th>
                  <th style={{ padding: "8px 10px", color: "#64748b", fontWeight: 600, textAlign: "center" }}>Won</th>
                  <th style={{ padding: "8px 10px", color: "#64748b", fontWeight: 600, textAlign: "center" }}>Win Rate</th>
                  <th style={{ padding: "8px 10px", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Won Value</th>
                </tr>
              </thead>
              <tbody>
                {tradeFairAnalysis.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>
                      No trade fair records match the filter
                    </td>
                  </tr>
                ) : (
                  tradeFairAnalysis.rows.map((row, idx) => {
                    const isTopGenerator = row === tradeFairAnalysis.topLeadGenerator;
                    const isTopWon = row === tradeFairAnalysis.topWinFair && row.won > 0;
                    return (
                      <tr key={row.fairName} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, width: 16 }}>#{idx + 1}</span>
                            <span style={{ fontWeight: 600, color: "#1e293b" }}>{row.fairName}</span>
                            {isTopGenerator && (
                              <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 10, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                Top Leads
                              </span>
                            )}
                            {isTopWon && (
                              <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 10, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                Top Won
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 700, color: "#2563eb" }}>
                          {row.totalGenerated}
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "center", color: "#0284c7" }}>
                          {row.active}
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 700, color: "#10b981" }}>
                          {row.won}
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              background: row.winRateNum >= 30 ? "#d1fae5" : row.winRateNum > 0 ? "#fef3c7" : "#f1f5f9",
                              color: row.winRateNum >= 30 ? "#065f46" : row.winRateNum > 0 ? "#92400e" : "#64748b",
                            }}
                          >
                            {row.winRate}%
                          </span>
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                          {formatCurrency(row.wonRevenue)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Acquisition Channels Comparison */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Lead Generation by Channel / Source
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                Performance comparison across marketing and outreach channels
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {channelBreakdown.map((ch) => (
              <div key={ch.key} style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{ch.label}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>({ch.count} leads · {ch.percent}%)</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>{ch.won} Won ({ch.winRate}%)</span>
                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{formatCurrency(ch.forecast)}</span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${ch.percent}%`,
                      height: "100%",
                      background: ch.key === "trade_fair" ? "#3b82f6" : ch.key === "whatsapp" ? "#22c55e" : "#6366f1",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Management Leads Explorer Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Leads Explorer & Management Records ({sortedLeads.length})
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
              Detailed leads created via Add Lead & CRM with quick drilldown
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setTablePage(1);
              }}
              style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 6 }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th
                  onClick={() => handleSort("leadCode")}
                  style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  Lead ID {sortField === "leadCode" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("inquiryDate")}
                  style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  Inquiry Date {sortField === "inquiryDate" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("contactName")}
                  style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  Customer / Buyer {sortField === "contactName" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600 }}>Company & Country</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600 }}>Source / Trade Fair</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600 }}>Assigned Merchant</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600 }}>Stage</th>
                <th
                  onClick={() => handleSort("forecastAmount")}
                  style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600, textAlign: "right", cursor: "pointer" }}
                >
                  Forecast {sortField === "forecastAmount" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600, textAlign: "center" }}>Status</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#475569", fontWeight: 600, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    No leads match the specified filters. Try resetting filters above.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  return (
                    <tr
                      key={lead.id}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                      onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                    >
                      <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "#2563eb" }}>
                        {lead.leadCode}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b" }}>
                        {lead.inquiryDate || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                        {lead.contactName || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>
                        <div>{lead.companyName || "—"}</div>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{lead.country || "—"} {lead.city ? `(${lead.city})` : ""}</span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12 }}>
                        <div style={{ fontWeight: 500, color: "#334155" }}>
                          {SOURCE_LABELS[lead.leadSource] || lead.leadSource}
                        </div>
                        {lead.leadSource === "trade_fair" && lead.tradeFairName && (
                          <span style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontSize: 11, padding: "1px 6px", borderRadius: 4, fontWeight: 600, display: "inline-block", marginTop: 2 }}>
                            🎪 {normalizeFairName(lead.tradeFairName)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>
                        {lead.merchantName || "Unassigned"}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155", textTransform: "capitalize" }}>
                        {(lead.salesStage || "").replace(/_/g, " ")}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#0f172a", textAlign: "right" }}>
                        {formatCurrency(lead.forecastAmount)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor:
                              lead.status === "won"
                                ? "#d1fae5"
                                : lead.status === "active"
                                ? "#dbeafe"
                                : lead.status === "lost"
                                ? "#fee2e2"
                                : lead.status === "dead"
                                ? "#f1f5f9"
                                : "#fef3c7",
                            color:
                              lead.status === "won"
                                ? "#065f46"
                                : lead.status === "active"
                                ? "#1e40af"
                                : lead.status === "lost"
                                ? "#991b1b"
                                : lead.status === "dead"
                                ? "#475569"
                                : "#92400e",
                          }}
                        >
                          {STATUS_LABELS[lead.status] || lead.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/admin/crm/leads/${lead.id}`}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#2563eb",
                            textDecoration: "none",
                            background: "#eff6ff",
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Showing {(tablePage - 1) * pageSize + 1} to {Math.min(tablePage * pageSize, sortedLeads.length)} of {sortedLeads.length} leads
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                disabled={tablePage === 1}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  background: "#fff",
                  cursor: tablePage === 1 ? "not-allowed" : "pointer",
                  color: tablePage === 1 ? "#94a3b8" : "#334155",
                }}
              >
                &larr; Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTablePage(i + 1)}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    borderRadius: 6,
                    border: tablePage === i + 1 ? "1px solid #2563eb" : "1px solid #cbd5e1",
                    background: tablePage === i + 1 ? "#2563eb" : "#fff",
                    color: tablePage === i + 1 ? "#fff" : "#334155",
                    fontWeight: tablePage === i + 1 ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                disabled={tablePage === totalPages}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  background: "#fff",
                  cursor: tablePage === totalPages ? "not-allowed" : "pointer",
                  color: tablePage === totalPages ? "#94a3b8" : "#334155",
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
