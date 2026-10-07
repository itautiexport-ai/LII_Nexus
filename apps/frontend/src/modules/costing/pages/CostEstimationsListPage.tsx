import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi, CostEstimation } from "../api/costingApi";

export default function CostEstimationsListPage() {
  const navigate = useNavigate();
  const [estimations, setEstimations] = useState<CostEstimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadEstimations();
  }, [search, statusFilter]);

  const loadEstimations = async () => {
    setLoading(true);
    try {
      const data = await costingApi.getAllEstimations(search, statusFilter);
      setEstimations(data);
    } catch (err) {
      console.error("Failed to load estimations list", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete estimation ${number}?`)) return;
    try {
      await costingApi.deleteEstimation(id);
      loadEstimations();
    } catch (err) {
      alert("Failed to delete estimation");
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

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Cost Estimations Directory
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: 14 }}>
            Manage product costing sheets, profit margin calculations, and client quotations
          </p>
        </div>
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

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, background: "#ffffff", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <input
          type="text"
          placeholder="Search by Est #, Title, or Client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            background: "#ffffff",
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="In Review">In Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Datatable */}
      <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>Loading cost estimations...</div>
        ) : estimations.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
            No cost estimations match your search criteria.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Est #</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Title / Product</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Client</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Material Cost</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Labor Cost</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Subtotal Cost</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Margin</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Final Price</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Status</th>
                <th style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {estimations.map((est) => (
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
                    ₹{Number(est.total_material_cost).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>
                    ₹{Number(est.total_labor_cost).toLocaleString()}
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
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => navigate(`/admin/costing/detail/${est.id}`)}
                        style={{
                          padding: "4px 8px",
                          background: "#f3f4f6",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/admin/costing/edit/${est.id}`)}
                        style={{
                          padding: "4px 8px",
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(est.id, est.estimation_number)}
                        style={{
                          padding: "4px 8px",
                          background: "#fef2f2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
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
