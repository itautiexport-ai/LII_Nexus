import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi } from "../../costing/api/costingApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

export type DashboardRoleType = "directors" | "gm" | "hods" | "merchants" | "managers";

interface RoleDashboardConfig {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  quickLinks: { label: string; to: string; icon: string }[];
}

const ROLE_CONFIGS: Record<DashboardRoleType, RoleDashboardConfig> = {
  directors: {
    title: "Directors Dashboard",
    subtitle: "Executive overview of company operations, costing approvals, and key performance metrics.",
    icon: "🏛️",
    accent: "#4338ca",
    quickLinks: [
      { label: "SKU Wise Costing (Approvals)", to: "/admin/costing/sku-wise", icon: "✅" },
      { label: "Merchant Folders", to: "/admin/costing/merchant-wise", icon: "📂" },
      { label: "Costing Tracker", to: "/admin/costing/tracker", icon: "⏱️" },
      { label: "Orders In Hand", to: "/admin/orders-in-hand", icon: "📦" },
    ],
  },
  gm: {
    title: "GM Dashboard",
    subtitle: "General Management overview across production, costing, quality, and department performance.",
    icon: "📊",
    accent: "#0369a1",
    quickLinks: [
      { label: "Costing Dashboard", to: "/admin/costing/dashboard", icon: "💰" },
      { label: "Production Progress", to: "/admin/manufacturing/production-progress", icon: "🏭" },
      { label: "Costing Tracker", to: "/admin/costing/tracker", icon: "⏱️" },
      { label: "Task Center", to: "/admin/task-center", icon: "📋" },
    ],
  },
  hods: {
    title: "HOD's Dashboard",
    subtitle: "Departmental tracking for Heads of Department covering tasks, checklists, and costing pipeline.",
    icon: "🎯",
    accent: "#0f766e",
    quickLinks: [
      { label: "Task Center", to: "/admin/task-center", icon: "📋" },
      { label: "Costing Tracker", to: "/admin/costing/tracker", icon: "⏱️" },
      { label: "Production Progress", to: "/admin/manufacturing/production-progress", icon: "🏭" },
      { label: "SKU Wise Costing", to: "/admin/costing/sku-wise", icon: "📝" },
    ],
  },
  merchants: {
    title: "Merchants Dashboard",
    subtitle: "Merchant workspace for submitting costing requests, tracking buyer quotes, and monitoring order status.",
    icon: "🛍️",
    accent: "#7c3aed",
    quickLinks: [
      { label: "Costing Request Center", to: "/admin/costing/request-center", icon: "➕" },
      { label: "Merchant Folders", to: "/admin/costing/merchant-wise", icon: "📂" },
      { label: "SKU Wise Costing", to: "/admin/costing/sku-wise", icon: "📋" },
      { label: "Costing Tracker", to: "/admin/costing/tracker", icon: "⏱️" },
    ],
  },
  managers: {
    title: "Manager's Dashboard",
    subtitle: "Operational management view for daily execution, delegations, checklists, and costing follow-ups.",
    icon: "📈",
    accent: "#b45309",
    quickLinks: [
      { label: "Task Center", to: "/admin/task-center", icon: "📋" },
      { label: "My Checklists", to: "/admin/my-checklists", icon: "☑️" },
      { label: "Costing Tracker", to: "/admin/costing/tracker", icon: "⏱️" },
      { label: "Merchant Folders", to: "/admin/costing/merchant-wise", icon: "📂" },
    ],
  },
};

export default function RoleDashboardPage({ roleType }: { roleType: DashboardRoleType }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const config = ROLE_CONFIGS[roleType];

  const [metrics, setMetrics] = useState<{
    total_requests: number;
    not_started_count: number;
    in_progress_count: number;
    in_review_count: number;
    approved_count: number;
    rejected_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    costingApi
      .getDashboardMetrics()
      .then((res) => {
        if (res?.metrics) setMetrics(res.metrics);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roleType]);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", color: "#1f2937" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${config.accent}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            {config.icon}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#111827" }}>
              {config.title}
            </h1>
          </div>
        </div>

        {user?.fullName && (
          <div style={{ fontSize: 13, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontWeight: 600 }}>
            Welcome, <strong style={{ color: "#0f172a" }}>{user.fullName}</strong>
          </div>
        )}
      </div>

      {/* Live Costing Overview KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total Costing Requests</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
            {loading ? "—" : metrics?.total_requests ?? 0}
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>⏳ Not Started</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#334155", marginTop: 6 }}>
            {loading ? "—" : metrics?.not_started_count ?? 0}
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8" }}>🛠️ In Progress</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", marginTop: 6 }}>
            {loading ? "—" : metrics?.in_progress_count ?? 0}
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #fde68a", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#b45309" }}>⏳ Pending Approval</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706", marginTop: 6 }}>
            {loading ? "—" : metrics?.in_review_count ?? 0}
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>✅ Approved</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", marginTop: 6 }}>
            {loading ? "—" : metrics?.approved_count ?? 0}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px 0", color: "#111827" }}>
          Quick Access
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {config.quickLinks.map((link) => (
            <button
              key={link.to}
              type="button"
              onClick={() => navigate(link.to)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 600,
                fontSize: 13,
                color: "#1e293b",
              }}
            >
              <span style={{ fontSize: 18 }}>{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

