import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { costingApi, CostEstimation } from "../api/costingApi";

export default function CostEstimationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [estimation, setEstimation] = useState<CostEstimation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadEstimation(id);
  }, [id]);

  const loadEstimation = async (estId: string) => {
    setLoading(true);
    try {
      const data = await costingApi.getEstimationById(estId);
      setEstimation(data);
    } catch (err) {
      console.error("Failed to load estimation", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading estimation breakdown...</div>;
  }

  if (!estimation) {
    return <div style={{ padding: 24, color: "#dc2626" }}>Cost estimation sheet not found.</div>;
  }

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
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      {/* Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button
          onClick={() => navigate("/admin/costing/list")}
          style={{ padding: "8px 16px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer" }}
        >
          ← Back to List
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handlePrint}
            style={{ padding: "8px 16px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
          >
            🖨️ Print / Save PDF
          </button>
          <button
            onClick={() => navigate(`/admin/costing/edit/${estimation.id}`)}
            style={{ padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
          >
            Edit Estimation
          </button>
        </div>
      </div>

      {/* Printable Printable Sheet */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 32 }}>
        {/* Document Header */}
        <div style={{ borderBottom: "2px solid #2563eb", paddingBottom: 16, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>
              COSTING & ESTIMATION SHEET
            </h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: 14 }}>
              LII Performance Nexus — Enterprise Product Cost Analysis
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2563eb" }}>
              {estimation.estimation_number}
            </div>
            <div style={{ marginTop: 4 }}>{getStatusBadge(estimation.status)}</div>
          </div>
        </div>

        {/* Estimation Metadata */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, background: "#f9fafb", padding: 16, borderRadius: 6, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Product / Title</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{estimation.title}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Client Name</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{estimation.client_name || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Currency / Rate</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{estimation.currency} (Ex: {estimation.exchange_rate})</div>
          </div>
        </div>

        {/* BOM Items Table */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
          Bill of Materials (BOM) & Line Item Breakdown
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", marginBottom: 24 }}>
          <thead>
            <tr style={{ background: "#f3f4f6", borderBottom: "1px solid #d1d5db" }}>
              <th style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>Category</th>
              <th style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>Item / Component Name</th>
              <th style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>Quantity</th>
              <th style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>UOM</th>
              <th style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>Unit Cost</th>
              <th style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {estimation.items?.map((it, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#4b5563" }}>{it.category}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#111827" }}>{it.item_name}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>{it.quantity}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>{it.unit_of_measure}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>₹{Number(it.unit_cost).toLocaleString()}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#111827" }}>₹{Number(it.total_cost).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation Summary Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, borderTop: "2px solid #e5e7eb", paddingTop: 20 }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginTop: 0 }}>Cost Group Summary</h4>
            <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>Material Cost: ₹{Number(estimation.total_material_cost).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>Labor Cost: ₹{Number(estimation.total_labor_cost).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>Finishing Cost: ₹{Number(estimation.total_finishing_cost).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>Packaging Cost: ₹{Number(estimation.total_packaging_cost).toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4 }}>Overhead Cost: ₹{Number(estimation.total_overhead_cost).toLocaleString()}</div>
          </div>

          <div style={{ background: "#f9fafb", padding: 16, borderRadius: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              <span>Subtotal Cost:</span>
              <span>₹{Number(estimation.subtotal_cost).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#059669", fontWeight: 600, marginBottom: 8 }}>
              <span>Profit Margin ({estimation.margin_percentage}%):</span>
              <span>+ ₹{Number(estimation.margin_amount).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4b5563", marginBottom: 12 }}>
              <span>Tax ({estimation.tax_percentage}%):</span>
              <span>+ ₹{Number(estimation.tax_amount).toLocaleString()}</span>
            </div>
            <div style={{ background: "#2563eb", color: "#ffffff", padding: 12, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>Final Quoted Price:</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>₹{Number(estimation.final_price).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {estimation.notes && (
          <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 6px 0" }}>Notes / Technical Remarks</h4>
            <p style={{ fontSize: 13, color: "#4b5563", margin: 0, whiteSpace: "pre-wrap" }}>{estimation.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
