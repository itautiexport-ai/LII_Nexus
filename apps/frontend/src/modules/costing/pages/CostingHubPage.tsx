import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi, CostEstimation } from "../api/costingApi";

export default function CostingHubPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [recentEstimations, setRecentEstimations] = useState<CostEstimation[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, estData] = await Promise.all([
        costingApi.getSummary(),
        costingApi.getAllEstimations(),
      ]);
      setSummary(sumData);
      setRecentEstimations(estData.slice(0, 10));
    } catch (err) {
      console.error("Failed to load costing hub data", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#d1fae5", color: "#065f46", fontSize: 12, fontWeight: 600 }}>Approved</span>;
      case "In Review":
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600 }}>In Review</span>;
      case "Rejected":
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 600 }}>Rejected</span>;
      default:
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#e5e7eb", color: "#374151", fontSize: 12, fontWeight: 600 }}>Draft</span>;
    }
  };

  if (loading) {
    return <div style={{ padding: 24, fontSize: 16 }}>Loading Costing & Estimation Hub...</div>;
  }

  const overview = summary?.overview || { total_count: 0, total_value: 0 };
  const approvedCount = summary?.byStatus?.find((s: any) => s.status === "Approved")?.count || 0;
  const inReviewCount = summary?.byStatus?.find((s: any) => s.status === "In Review")?.count || 0;

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Costing & Estimation Hub
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: 14 }}>
            Comprehensive Product Costing, BOM Cost Analysis, and Quotation Price Estimation
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/admin/costing/rates")}
            style={{
              padding: "10px 16px",
              background: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              color: "#374151",
            }}
          >
            ⚙️ Rate Master
          </button>
          <button
            onClick={() => navigate("/admin/costing/new")}
            style={{
              padding: "10px 18px",
              background: "#2563eb",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            + New Cost Estimation
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 500 }}>Total Estimations</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginTop: 4 }}>
            {overview.total_count}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 500 }}>Approved Estimates</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#059669", marginTop: 4 }}>
            {approvedCount}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 500 }}>Under Review</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#d97706", marginTop: 4 }}>
            {inReviewCount}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 500 }}>Total Estimated Value</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>
            ₹{Number(overview.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Recent Estimations List */}
      <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>
            Recent Cost Estimations
          </h2>
          <button
            onClick={() => navigate("/admin/costing/list")}
            style={{ color: "#2563eb", background: "none", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            View All →
          </button>
        </div>

        {recentEstimations.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
            No cost estimations created yet. Click "+ New Cost Estimation" to build your first product estimation sheet!
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Est. #</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Title / Product</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Client</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Subtotal Cost</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Margin %</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Final Price</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Status</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentEstimations.map((est) => (
                <tr key={est.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#2563eb" }}>
                    {est.estimation_number}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#111827" }}>
                    {est.title}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#4b5563" }}>
                    {est.client_name || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>
                    ₹{Number(est.subtotal_cost).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#059669", fontWeight: 600 }}>
                    {est.margin_percentage}%
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#111827" }}>
                    ₹{Number(est.final_price).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{getStatusBadge(est.status)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => navigate(`/admin/costing/detail/${est.id}`)}
                      style={{
                        padding: "6px 12px",
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        marginRight: 6,
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/admin/costing/edit/${est.id}`)}
                      style={{
                        padding: "6px 12px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
