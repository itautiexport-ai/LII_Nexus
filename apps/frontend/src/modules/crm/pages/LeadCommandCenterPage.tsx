import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { crmApi, LeadRecord, SalesStage, LeadStatus, LeadPriority } from "../api/crmApi";
import { merchantsApi, MerchantRecord } from "../../admin/masterdata/api/merchantsApi";

// Formatter for Indian Rupees
function formatINR(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return "₹ 0";
  return "₹ " + Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// Stage labels & colors
const STAGE_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  new_inquiry: { label: "New Inquiry", color: "#6366f1", step: 1 },
  discovery: { label: "Discovery", color: "#8b5cf6", step: 2 },
  qualification: { label: "Qualification", color: "#a855f7", step: 3 },
  product_shared: { label: "Product Shared", color: "#3b82f6", step: 4 },
  quotation_sent: { label: "Quote Sent", color: "#0ea5e9", step: 5 },
  negotiation: { label: "Negotiation", color: "#f59e0b", step: 6 },
  sample_discussion: { label: "Sample Disc.", color: "#d97706", step: 7 },
  sample_under_development: { label: "Sample Dev", color: "#ea580c", step: 8 },
  order_expected: { label: "Order Expected", color: "#16a34a", step: 9 },
  order_won: { label: "Order Won", color: "#10b981", step: 10 },
  order_lost: { label: "Order Lost", color: "#ef4444", step: 11 },
  dead_dormant: { label: "Dead / Dormant", color: "#64748b", step: 12 },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "#fee2e2", text: "#b91c1c" },
  high: { bg: "#ffedd5", text: "#c2410c" },
  medium: { bg: "#fef3c7", text: "#b45309" },
  low: { bg: "#f1f5f9", text: "#475569" },
};

export default function LeadCommandCenterPage() {
  const navigate = useNavigate();

  // Core Data
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pipeline" | "actionRequired" | "merchants" | "intelligence">("pipeline");

  // Filter & Search
  const [search, setSearch] = useState("");
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState("all");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState("all");

  // Modals
  const [followupModalLead, setFollowupModalLead] = useState<LeadRecord | null>(null);
  const [followupDate, setFollowupDate] = useState("");
  const [followupRemarks, setFollowupRemarks] = useState("");
  const [followupNextAction, setFollowupNextAction] = useState("");
  const [submittingFollowup, setSubmittingFollowup] = useState(false);

  const [assignModalLead, setAssignModalLead] = useState<LeadRecord | null>(null);
  const [selectedNewMerchantId, setSelectedNewMerchantId] = useState("");
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch all leads & merchants
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [leadsRes, merchantsList] = await Promise.all([
        crmApi.list({ pageSize: "1000" }),
        merchantsApi.list().catch(() => []),
      ]);
      setLeads(leadsRes.items || []);
      setMerchants(merchantsList || []);
      if (isManual) {
        setNotification({ type: "success", text: "Command Center synced with live database!" });
      }
    } catch (err: any) {
      console.error("Failed to load Lead Command Center data:", err);
      setNotification({ type: "error", text: "Failed to load CRM data. Please refresh." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (selectedMerchantFilter !== "all") {
        if (selectedMerchantFilter === "unassigned") {
          if (lead.assignedMerchantId) return false;
        } else if (lead.assignedMerchantId !== selectedMerchantFilter) {
          return false;
        }
      }

      if (selectedSourceFilter !== "all" && lead.leadSource !== selectedSourceFilter) {
        return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          lead.leadCode?.toLowerCase().includes(q) ||
          lead.contactName?.toLowerCase().includes(q) ||
          lead.companyName?.toLowerCase().includes(q) ||
          lead.city?.toLowerCase().includes(q) ||
          lead.country?.toLowerCase().includes(q) ||
          lead.merchantName?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [leads, selectedMerchantFilter, selectedSourceFilter, search]);

  // Command Center Metrics Calculation
  const metrics = useMemo(() => {
    const totalCount = leads.length;
    let totalForecast = 0;
    let totalWeighted = 0;
    let wonCount = 0;
    let wonRevenue = 0;
    let activeCount = 0;
    let overdueCount = 0;
    let unassignedCount = 0;
    let hotDealsCount = 0;

    const todayStr = new Date().toISOString().split("T")[0];

    leads.forEach((l) => {
      const forecast = Number(l.forecastAmount) || 0;
      const weighted = Number(l.weightedForecast) || 0;
      totalForecast += forecast;
      totalWeighted += weighted;

      if (l.status === "won" || l.salesStage === "order_won") {
        wonCount++;
        wonRevenue += forecast;
      } else if (l.status === "active") {
        activeCount++;
      }

      if (!l.assignedMerchantId) {
        unassignedCount++;
      }

      // Overdue follow-up condition
      const isOverdue =
        (l.delayDays != null && l.delayDays > 0) ||
        (l.nextFollowUpDate && l.nextFollowUpDate < todayStr && l.status === "active");
      if (isOverdue) {
        overdueCount++;
      }

      // Hot deals: high probability or urgent/high priority with significant forecast
      if (
        (l.winProbability && l.winProbability >= 70) ||
        (l.priority === "urgent" && forecast >= 500000)
      ) {
        hotDealsCount++;
      }
    });

    const winRate = totalCount > 0 ? ((wonCount / totalCount) * 100).toFixed(1) : "0.0";

    return {
      totalCount,
      totalForecast,
      totalWeighted,
      activeCount,
      wonCount,
      wonRevenue,
      overdueCount,
      unassignedCount,
      hotDealsCount,
      winRate,
    };
  }, [leads]);

  // Stage Distribution for Funnel / Pipeline Radar
  const stageStats = useMemo(() => {
    const counts: Record<string, { count: number; value: number; leads: LeadRecord[] }> = {};
    Object.keys(STAGE_CONFIG).forEach((k) => {
      counts[k] = { count: 0, value: 0, leads: [] };
    });

    filteredLeads.forEach((l) => {
      const stage = l.salesStage || "new_inquiry";
      if (!counts[stage]) {
        counts[stage] = { count: 0, value: 0, leads: [] };
      }
      counts[stage].count++;
      counts[stage].value += Number(l.forecastAmount) || 0;
      counts[stage].leads.push(l);
    });

    return counts;
  }, [filteredLeads]);

  // Overdue & Action-Required Queue
  const actionRequiredLeads = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return filteredLeads
      .filter((l) => {
        const isOverdue =
          (l.delayDays != null && l.delayDays > 0) ||
          (l.nextFollowUpDate && l.nextFollowUpDate < todayStr && l.status === "active");
        const isUnassigned = !l.assignedMerchantId;
        const isUrgent = l.priority === "urgent";
        return isOverdue || isUnassigned || isUrgent;
      })
      .sort((a, b) => {
        // Sort by overdue days desc, then urgency
        const d1 = a.delayDays || 0;
        const d2 = b.delayDays || 0;
        return d2 - d1;
      });
  }, [filteredLeads]);

  // Merchant Performance Table
  const merchantStats = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        activeDeals: number;
        totalPipeline: number;
        wonCount: number;
        wonRevenue: number;
        overdueCount: number;
      }
    > = {};

    merchants.forEach((m) => {
      map[m.id] = {
        id: m.id,
        name: m.name,
        activeDeals: 0,
        totalPipeline: 0,
        wonCount: 0,
        wonRevenue: 0,
        overdueCount: 0,
      };
    });

    // Unassigned bucket
    map["unassigned"] = {
      id: "unassigned",
      name: "⚡ Unassigned / Open Pool",
      activeDeals: 0,
      totalPipeline: 0,
      wonCount: 0,
      wonRevenue: 0,
      overdueCount: 0,
    };

    const todayStr = new Date().toISOString().split("T")[0];

    leads.forEach((l) => {
      const mId = l.assignedMerchantId || "unassigned";
      if (!map[mId]) {
        map[mId] = {
          id: mId,
          name: l.merchantName || "Unknown Merchant",
          activeDeals: 0,
          totalPipeline: 0,
          wonCount: 0,
          wonRevenue: 0,
          overdueCount: 0,
        };
      }

      const amt = Number(l.forecastAmount) || 0;
      map[mId].totalPipeline += amt;

      if (l.status === "active") map[mId].activeDeals++;
      if (l.status === "won" || l.salesStage === "order_won") {
        map[mId].wonCount++;
        map[mId].wonRevenue += amt;
      }

      const isOverdue =
        (l.delayDays != null && l.delayDays > 0) ||
        (l.nextFollowUpDate && l.nextFollowUpDate < todayStr && l.status === "active");
      if (isOverdue) map[mId].overdueCount++;
    });

    return Object.values(map)
      .filter((m) => m.activeDeals > 0 || m.wonCount > 0 || m.id === "unassigned")
      .sort((a, b) => b.totalPipeline - a.totalPipeline);
  }, [leads, merchants]);

  // Source Chart Data
  const sourceChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.leadSource || "other";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " ").toUpperCase(),
      value,
    }));
  }, [leads]);

  // Handle Quick Follow-up
  const handleOpenFollowupModal = (lead: LeadRecord) => {
    setFollowupModalLead(lead);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setFollowupDate(tomorrow.toISOString().split("T")[0]);
    setFollowupRemarks("");
    setFollowupNextAction(lead.nextAction || "Follow up on quotation feedback");
  };

  const handleSaveFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupModalLead || !followupDate) return;

    setSubmittingFollowup(true);
    try {
      await crmApi.logFollowup(
        followupModalLead.id,
        followupDate,
        followupRemarks.trim() || undefined,
        followupNextAction.trim() || undefined
      );
      setNotification({
        type: "success",
        text: `Follow-up logged for ${followupModalLead.leadCode}!`,
      });
      setFollowupModalLead(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", text: "Failed to record follow-up" });
    } finally {
      setSubmittingFollowup(false);
    }
  };

  // Handle Quick Assign Merchant
  const handleOpenAssignModal = (lead: LeadRecord) => {
    setAssignModalLead(lead);
    setSelectedNewMerchantId(lead.assignedMerchantId || "");
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalLead) return;

    setSubmittingAssign(true);
    try {
      await crmApi.assign(assignModalLead.id, selectedNewMerchantId || null);
      setNotification({
        type: "success",
        text: `Lead ${assignModalLead.leadCode} successfully assigned!`,
      });
      setAssignModalLead(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", text: "Failed to assign lead" });
    } finally {
      setSubmittingAssign(false);
    }
  };

  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", fontFamily: "Inter, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          animation: pulseDot 2s infinite ease-in-out;
        }
        .kpi-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px 18px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
        }
        .control-tab-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 700;
          border: none;
          background: transparent;
          color: #64748b;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .control-tab-btn.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
          background: #eff6ff;
          border-radius: 6px 6px 0 0;
        }
        .cmd-table th {
          padding: 11px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-align: left;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cmd-table td {
          padding: 12px 14px;
          font-size: 13px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .cmd-table tbody tr:hover td {
          background: #f8fafc;
        }
        .lead-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>

      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 4 }}>
            <Link to="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Sales & CRM</Link>
            <span>/</span>
            <span style={{ color: "#2563eb", fontWeight: 600 }}>Lead Command Center</span>
            <span style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span className="live-dot" /> LIVE COCKPIT
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Lead Command Center
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            Operational sales command cockpit for deal acceleration, overdue escalation & merchant accountability.
          </p>
        </div>

        {/* Global Quick Action Bar */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
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
            🔄 {refreshing ? "Syncing..." : "Refresh Live"}
          </button>

          <Link
            to="/admin/crm/leads"
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
              textDecoration: "none",
            }}
          >
            📋 All Leads
          </Link>

          <Link
            to="/admin/reports/lead-report"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#15803d",
              textDecoration: "none",
            }}
          >
            📊 Performance Report
          </Link>

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
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
            }}
          >
            ➕ Add Lead
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 18,
            fontSize: 13,
            fontWeight: 600,
            background: notification.type === "success" ? "#ecfdf5" : "#fee2e2",
            color: notification.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${notification.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "inherit" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP COMMAND METRICS: 6 High-Impact Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        {/* Total Pipeline */}
        <div className="kpi-card" style={{ borderLeft: "4px solid #6366f1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pipeline Value</span>
            <span style={{ fontSize: 18 }}>💰</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              {formatINR(metrics.totalForecast)}
            </div>
            <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginTop: 2 }}>
              Weighted: {formatINR(metrics.totalWeighted)}
            </div>
          </div>
        </div>

        {/* Active Deals in Flight */}
        <div className="kpi-card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Active Pipeline</span>
            <span style={{ fontSize: 18 }}>⚡</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: "#2563eb" }}>{metrics.activeCount}</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>/ {metrics.totalCount} leads</span>
            </div>
            <span style={{ fontSize: 11, color: "#64748b" }}>Under active negotiation</span>
          </div>
        </div>

        {/* Action Required: Overdue Follow-ups */}
        <div
          className="kpi-card"
          onClick={() => setActiveTab("actionRequired")}
          style={{
            borderLeft: metrics.overdueCount > 0 ? "4px solid #dc2626" : "4px solid #10b981",
            cursor: "pointer",
            background: metrics.overdueCount > 0 ? "#fff5f5" : "#ffffff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: metrics.overdueCount > 0 ? "#991b1b" : "#64748b", textTransform: "uppercase" }}>
              Action Required
            </span>
            <span style={{ fontSize: 18 }}>{metrics.overdueCount > 0 ? "🚨" : "✅"}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: metrics.overdueCount > 0 ? "#dc2626" : "#059669" }}>
                {metrics.overdueCount}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: metrics.overdueCount > 0 ? "#b91c1c" : "#059669" }}>
                Overdue Deals
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#64748b" }}>Past due follow-ups</span>
          </div>
        </div>

        {/* Won Revenue & Win Rate */}
        <div className="kpi-card" style={{ borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Won Revenue</span>
            <span style={{ fontSize: 18 }}>🏆</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>
              {formatINR(metrics.wonRevenue)}
            </div>
            <div style={{ fontSize: 11, color: "#047857", fontWeight: 700, marginTop: 2 }}>
              {metrics.wonCount} Closed ({metrics.winRate}% Win)
            </div>
          </div>
        </div>

        {/* Hot Opportunities */}
        <div className="kpi-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Hot Deals (≥70%)</span>
            <span style={{ fontSize: 18 }}>🔥</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#d97706" }}>
              {metrics.hotDealsCount}
            </div>
            <span style={{ fontSize: 11, color: "#64748b" }}>High probability closure</span>
          </div>
        </div>

        {/* Unassigned / Open Pool */}
        <div className="kpi-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Unassigned Pool</span>
            <span style={{ fontSize: 18 }}>👥</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: metrics.unassignedCount > 0 ? "#7c3aed" : "#0f172a" }}>
              {metrics.unassignedCount}
            </div>
            <span style={{ fontSize: 11, color: "#64748b" }}>Awaiting merchant assignment</span>
          </div>
        </div>
      </div>

      {/* FILTER & DRILLDOWN STRIP */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ minWidth: 260 }}>
            <input
              placeholder="🔍 Search lead code, buyer, city, merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                outline: "none",
                background: "#f8fafc",
              }}
            />
          </div>

          {/* Merchant Filter */}
          <select
            value={selectedMerchantFilter}
            onChange={(e) => setSelectedMerchantFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              fontWeight: 500,
              color: "#334155",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="all">👤 All Merchants ({merchants.length})</option>
            <option value="unassigned">⚡ Unassigned Only ({metrics.unassignedCount})</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSourceFilter}
            onChange={(e) => setSelectedSourceFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              fontWeight: 500,
              color: "#334155",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="all">🌐 All Sources</option>
            <option value="trade_fair">🎪 Trade Fair</option>
            <option value="whatsapp">📱 WhatsApp</option>
            <option value="email">✉️ Email Inquiry</option>
            <option value="website">💻 Website</option>
            <option value="referral">👥 Referral</option>
            <option value="other">Other</option>
          </select>

          {(search || selectedMerchantFilter !== "all" || selectedSourceFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedMerchantFilter("all");
                setSelectedSourceFilter("all");
              }}
              style={{
                padding: "6px 10px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                color: "#64748b",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Viewing <strong>{filteredLeads.length}</strong> of {leads.length} leads
        </div>
      </div>

      {/* MAIN COMMAND CENTER SECTION: TABS & VIEWS */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        {/* Tab Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", padding: "0 12px", overflowX: "auto" }}>
          <button
            type="button"
            onClick={() => setActiveTab("pipeline")}
            className={`control-tab-btn ${activeTab === "pipeline" ? "active" : ""}`}
          >
            <span>📊 Pipeline Stage Radar</span>
            <span style={{ fontSize: 11, background: activeTab === "pipeline" ? "#dbeafe" : "#e2e8f0", color: activeTab === "pipeline" ? "#1d4ed8" : "#475569", padding: "1px 6px", borderRadius: 10 }}>
              {filteredLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("actionRequired")}
            className={`control-tab-btn ${activeTab === "actionRequired" ? "active" : ""}`}
          >
            <span>🚨 Action Required / Escalations</span>
            {metrics.overdueCount > 0 && (
              <span style={{ fontSize: 11, background: "#fee2e2", color: "#b91c1c", fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
                {metrics.overdueCount} Overdue
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("merchants")}
            className={`control-tab-btn ${activeTab === "merchants" ? "active" : ""}`}
          >
            <span>⚔️ Merchant Matrix</span>
            <span style={{ fontSize: 11, background: "#e2e8f0", color: "#475569", padding: "1px 6px", borderRadius: 10 }}>
              {merchants.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("intelligence")}
            className={`control-tab-btn ${activeTab === "intelligence" ? "active" : ""}`}
          >
            <span>🧭 Intelligence & Sources</span>
          </button>
        </div>

        {/* TAB 1: PIPELINE STAGE RADAR */}
        {activeTab === "pipeline" && (
          <div style={{ padding: 22 }}>
            <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Active Stage Progression
                </h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Lead count and volume at each pipeline milestone
                </span>
              </div>
            </div>

            {/* Stage Columns Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {Object.entries(STAGE_CONFIG).map(([stageKey, cfg]) => {
                const sData = stageStats[stageKey] || { count: 0, value: 0, leads: [] };
                return (
                  <div
                    key={stageKey}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, background: "#fff", padding: "2px 7px", borderRadius: 12, border: "1px solid #cbd5e1" }}>
                          {sData.count}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
                        {formatINR(sData.value)}
                      </div>
                    </div>

                    {/* Top 3 Leads in this stage */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {sData.leads.slice(0, 3).map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                          style={{
                            background: "#ffffff",
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#93c5fd")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#1e293b" }}>
                            <span>{lead.leadCode}</span>
                            <span style={{ color: "#059669" }}>{formatINR(lead.forecastAmount)}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {lead.contactName} {lead.companyName ? `(${lead.companyName})` : ""}
                          </div>
                        </div>
                      ))}

                      {sData.leads.length > 3 && (
                        <div style={{ fontSize: 11, textAlign: "center", color: "#64748b", fontWeight: 600, paddingTop: 4 }}>
                          + {sData.leads.length - 3} more leads
                        </div>
                      )}

                      {sData.leads.length === 0 && (
                        <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>
                          No leads in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ACTION REQUIRED / OVERDUE ESCALATION QUEUE */}
        {activeTab === "actionRequired" && (
          <div>
            <div style={{ padding: "16px 20px", background: "#fef2f2", borderBottom: "1px solid #fee2e2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#991b1b" }}>
                  🚨 Urgent Escalations & Overdue Deals
                </h3>
                <span style={{ fontSize: 12, color: "#b91c1c" }}>
                  Leads with past due follow-ups, delayed responses, or missing merchant assignments requiring immediate intervention.
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, background: "#dc2626", color: "#fff", padding: "4px 10px", borderRadius: 12 }}>
                {actionRequiredLeads.length} Pending Actions
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="cmd-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Buyer / Company</th>
                    <th>Stage & Value</th>
                    <th>Assigned Merchant</th>
                    <th>Delay / Status</th>
                    <th>Next Action</th>
                    <th style={{ textAlign: "center", width: 180 }}>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {actionRequiredLeads.map((lead) => {
                    const isOverdue = lead.delayDays > 0;
                    const pConfig = PRIORITY_COLORS[lead.priority || "medium"];

                    return (
                      <tr key={lead.id}>
                        <td>
                          <div>
                            <span
                              onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                              style={{ fontWeight: 700, color: "#2563eb", cursor: "pointer", fontSize: 13 }}
                            >
                              {lead.leadCode}
                            </span>
                            <div style={{ marginTop: 2 }}>
                              <span className="lead-pill" style={{ background: pConfig.bg, color: pConfig.text }}>
                                {lead.priority || "medium"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{lead.contactName}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {lead.companyName || "Direct"} • {lead.country || ""}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {formatINR(lead.forecastAmount)}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {STAGE_CONFIG[lead.salesStage]?.label || lead.salesStage} ({lead.winProbability || 0}%)
                          </div>
                        </td>

                        <td>
                          {lead.merchantName ? (
                            <span style={{ fontWeight: 600, color: "#334155" }}>👤 {lead.merchantName}</span>
                          ) : (
                            <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              ⚡ UNASSIGNED
                            </span>
                          )}
                        </td>

                        <td>
                          {isOverdue ? (
                            <div style={{ background: "#fef2f2", color: "#dc2626", padding: "3px 8px", borderRadius: 6, fontWeight: 700, fontSize: 12, display: "inline-block" }}>
                              ⚠️ {lead.delayDays} Days Overdue
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              Due: {lead.nextFollowUpDate || "Pending"}
                            </div>
                          )}
                        </td>

                        <td style={{ maxWidth: 220 }}>
                          <div style={{ fontSize: 12, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {lead.nextAction || lead.followUpRemarks || "No follow-up logged"}
                          </div>
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenFollowupModal(lead)}
                              style={{
                                padding: "5px 9px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              📞 Log Action
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(lead)}
                              style={{
                                padding: "5px 9px",
                                background: "#f8fafc",
                                color: "#475569",
                                border: "1px solid #cbd5e1",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Reassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {actionRequiredLeads.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#10b981", fontWeight: 600 }}>
                        🎉 Outstanding! No overdue follow-ups or unassigned leads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MERCHANT PERFORMANCE MATRIX */}
        {activeTab === "merchants" && (
          <div style={{ padding: 22 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Merchant Performance & Ownership Matrix
              </h3>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                Deal ownership, active pipeline capacity, and overdue follow-up health across merchants
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="cmd-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Merchant Name</th>
                    <th style={{ textAlign: "right" }}>Active Deals</th>
                    <th style={{ textAlign: "right" }}>Pipeline Value</th>
                    <th style={{ textAlign: "right" }}>Deals Won</th>
                    <th style={{ textAlign: "right" }}>Won Revenue</th>
                    <th style={{ textAlign: "right" }}>Overdue Deals</th>
                    <th style={{ textAlign: "center", width: 140 }}>Filter View</th>
                  </tr>
                </thead>
                <tbody>
                  {merchantStats.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>
                        {m.name}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#2563eb" }}>
                        {m.activeDeals}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                        {formatINR(m.totalPipeline)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#059669" }}>
                        {m.wonCount}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#059669" }}>
                        {formatINR(m.wonRevenue)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {m.overdueCount > 0 ? (
                          <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                            {m.overdueCount}
                          </span>
                        ) : (
                          <span style={{ color: "#10b981", fontWeight: 700 }}>0</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMerchantFilter(m.id);
                            setActiveTab("pipeline");
                          }}
                          style={{
                            padding: "4px 10px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Drilldown &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: INTELLIGENCE & SOURCES */}
        {activeTab === "intelligence" && (
          <div style={{ padding: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
              {/* Lead Source Breakdown Chart */}
              <div style={{ background: "#f8fafc", padding: 18, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px", color: "#0f172a" }}>
                  Inquiry Volume by Lead Channel
                </h4>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sourceChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Priority Distribution */}
              <div style={{ background: "#f8fafc", padding: 18, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px", color: "#0f172a" }}>
                  Operational Priority Distribution
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                  {(["urgent", "high", "medium", "low"] as LeadPriority[]).map((p) => {
                    const count = leads.filter((l) => l.priority === p).length;
                    const pct = leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : "0";
                    const pCfg = PRIORITY_COLORS[p];
                    return (
                      <div key={p} style={{ background: "#ffffff", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="lead-pill" style={{ background: pCfg.bg, color: pCfg.text }}>
                          {p}
                        </span>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{count}</span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK LOG FOLLOW-UP MODAL */}
      {followupModalLead && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>
              📞 Log Quick Follow-Up ({followupModalLead.leadCode})
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              {followupModalLead.contactName} • {followupModalLead.companyName || "Direct"}
            </p>

            <form onSubmit={handleSaveFollowup}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Next Follow-up Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Next Planned Action
                </label>
                <input
                  placeholder="e.g. Call buyer for quotation feedback"
                  value={followupNextAction}
                  onChange={(e) => setFollowupNextAction(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Follow-up Remarks / Meeting Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Buyer reviewed catalog; agreed to finalize quantities by Thursday."
                  value={followupRemarks}
                  onChange={(e) => setFollowupRemarks(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setFollowupModalLead(null)}
                  style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFollowup}
                  style={{ padding: "8px 16px", background: "#2563eb", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}
                >
                  {submittingFollowup ? "Saving..." : "✓ Save Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK REASSIGN MERCHANT MODAL */}
      {assignModalLead && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 440,
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>
              👤 Reassign Merchant ({assignModalLead.leadCode})
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Current: <strong>{assignModalLead.merchantName || "Unassigned"}</strong>
            </p>

            <form onSubmit={handleSaveAssign}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Select Assigned Merchant
                </label>
                <select
                  value={selectedNewMerchantId}
                  onChange={(e) => setSelectedNewMerchantId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}
                >
                  <option value="">-- Unassigned (Open Pool) --</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setAssignModalLead(null)}
                  style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  style={{ padding: "8px 16px", background: "#2563eb", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}
                >
                  {submittingAssign ? "Saving..." : "✓ Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
