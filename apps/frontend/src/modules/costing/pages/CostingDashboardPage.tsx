import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi } from "../api/costingApi";

export default function CostingDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await costingApi.getDashboardMetrics();
      setData(res);
    } catch (err) {
      console.error("Failed to load costing dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics || {
    total_requests: 0,
    not_started_count: 0,
    in_progress_count: 0,
    in_review_count: 0,
    approved_count: 0,
    rejected_count: 0,
    total_bunches: 0,
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", color: "#1f2937" }}>
      {/* Top Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>📊</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#111827" }}>
            Costing & Estimation Dashboard
          </h1>
        </div>
      </div>

      {/* Main KPI Cards (Exact categories requested by user) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        {/* Total Product Requests */}
        <div
          onClick={() => navigate("/admin/costing/sku-wise")}
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: 8,
            padding: 18,
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Total Product Requests</span>
            <span style={{ fontSize: 20 }}>📦</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>
            {metrics.total_requests}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Across {metrics.total_bunches} request bunch{metrics.total_bunches !== 1 ? "es" : ""}
          </div>
        </div>

        {/* Not Started */}
        <div
          onClick={() => navigate("/admin/costing/tracker?stage=Pending")}
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: 8,
            padding: 18,
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Not Started</span>
            <span style={{ fontSize: 20 }}>⏳</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#334155", marginTop: 8 }}>
            {metrics.not_started_count}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Awaiting costing estimation
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => navigate("/admin/costing/tracker?stage=In Progress")}
          style={{
            background: "#ffffff",
            border: "1.5px solid #93c5fd",
            borderRadius: 8,
            padding: 18,
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8" }}>In Progress</span>
            <span style={{ fontSize: 20 }}>🛠️</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#2563eb", marginTop: 8 }}>
            {metrics.in_progress_count}
          </div>
          <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
            Cost estimation underway
          </div>
        </div>

        {/* Pending Approval */}
        <div
          onClick={() => navigate("/admin/costing/tracker?stage=In Review")}
          style={{
            background: "#ffffff",
            border: "1.5px solid #fde047",
            borderRadius: 8,
            padding: 18,
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#854d0e" }}>Pending Approval</span>
            <span style={{ fontSize: 20 }}>📤</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#d97706", marginTop: 8 }}>
            {metrics.in_review_count}
          </div>
          <div style={{ fontSize: 12, color: "#b45309", marginTop: 4 }}>
            Submitted for review
          </div>
        </div>

        {/* Approved */}
        <div
          onClick={() => navigate("/admin/costing/tracker?stage=Approved")}
          style={{
            background: "#ffffff",
            border: "1.5px solid #86efac",
            borderRadius: 8,
            padding: 18,
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>Approved</span>
            <span style={{ fontSize: 20 }}>✅</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#16a34a", marginTop: 8 }}>
            {metrics.approved_count}
          </div>
          <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
            Finalized & ready
          </div>
        </div>
      </div>
    </div>
  );
}

