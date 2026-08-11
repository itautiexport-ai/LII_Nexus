import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Sourcewiz.css";

export default function SourcewizDashboardPage() {
  const navigate = useNavigate();

  const metrics = [
    { label: "Digital Catalog Items", val: "148", icon: "📦", bg: "#eef2ff", color: "#4f46e5" },
    { label: "Active Quotations", val: "32", icon: "📄", bg: "#f0fdf4", color: "#16a34a" },
    { label: "Pending Buyer RFQs", val: "12", icon: "📥", bg: "#fef3c7", color: "#d97706" },
    { label: "Total Pipeline Value", val: "$485,200", icon: "💵", bg: "#faf5ff", color: "#9333ea" },
  ];

  const recentQuotations = [
    { id: "QT-2026-089", buyer: "West Elm Exports LLC", country: "🇺🇸 USA", total: "$42,500", date: "2026-08-05", status: "Sent" },
    { id: "QT-2026-088", buyer: "IKEA Global Sourcing", country: "🇸🇪 Sweden", total: "$128,000", date: "2026-08-04", status: "Approved" },
    { id: "QT-2026-087", buyer: "Habitat Home Living", country: "🇬🇧 UK", total: "$19,800", date: "2026-08-02", status: "Under Review" },
    { id: "QT-2026-086", buyer: "Maaison Du Monde", country: "🇫🇷 France", total: "$64,200", date: "2026-07-29", status: "Sent" },
  ];

  const featuredCatalog = [
    { name: "Nordic Solid Oak Dining Table", sku: "SW-LII-DT-01", price: "$245.00", moq: "50 Pcs", cbm: "0.35 CBM", category: "Furniture" },
    { name: "Minimalist Ergonomic Office Chair", sku: "SW-LII-OC-04", price: "$110.00", moq: "100 Pcs", cbm: "0.18 CBM", category: "Office" },
    { name: "Handcrafted Rattan Lounge Armchair", sku: "SW-LII-AC-09", price: "$185.00", moq: "30 Pcs", cbm: "0.42 CBM", category: "Outdoor" },
  ];

  return (
    <div className="sw-container">
      {/* Header Banner */}
      <div className="sw-header-gradient">
        <div>
          <h1 className="sw-title">
            <span>✨ Product Catalog 2.0</span>
            <span className="sw-badge-pro">PRO ENTERPRISE</span>
          </h1>
          <p className="sw-subtitle">
            Next-Gen B2B Product Sourcing, Factory Digital Showroom & Quotation Engine
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className="sw-btn sw-btn-primary"
            onClick={() => navigate("/admin/sourcewiz/quotations")}
          >
            ➕ New Quotation
          </button>
          <button 
            className="sw-btn sw-btn-primary"
            onClick={() => navigate("/admin/sourcewiz/product-form")}
          >
            📷 Product Form
          </button>
          <button 
            className="sw-btn sw-btn-secondary"
            onClick={() => navigate("/admin/sourcewiz/products")}
          >
            📦 Product Catalog
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="sw-metrics-grid">
        {metrics.map((m, idx) => (
          <div key={idx} className="sw-metric-card">
            <div>
              <div className="sw-metric-label">{m.label}</div>
              <div className="sw-metric-val">{m.val}</div>
            </div>
            <div className="sw-metric-icon" style={{ background: m.bg, color: m.color }}>
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Recent Quotations Card */}
        <div className="sw-card">
          <div className="sw-card-header">
            <h3 className="sw-card-title">📄 Recent B2B Quotations</h3>
            <button 
              className="sw-btn sw-btn-secondary" 
              style={{ padding: "4px 12px", fontSize: "0.80rem" }}
              onClick={() => navigate("/admin/sourcewiz/quotations")}
            >
              View All
            </button>
          </div>
          <div className="sw-card-body" style={{ padding: 0 }}>
            <table className="sw-table">
              <thead>
                <tr>
                  <th className="sw-th">Quote Ref</th>
                  <th className="sw-th">Buyer / Importer</th>
                  <th className="sw-th">Total Value</th>
                  <th className="sw-th">Date</th>
                  <th className="sw-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.map((q) => (
                  <tr key={q.id} className="sw-tr">
                    <td className="sw-td" style={{ fontWeight: 700, color: "#4f46e5" }}>{q.id}</td>
                    <td className="sw-td" style={{ fontWeight: 600 }}>
                      {q.buyer} <span style={{ fontSize: "0.80rem", marginLeft: "4px" }}>{q.country}</span>
                    </td>
                    <td className="sw-td" style={{ fontWeight: 700 }}>{q.total}</td>
                    <td className="sw-td" style={{ color: "#64748b" }}>{q.date}</td>
                    <td className="sw-td">
                      <span style={{ 
                        padding: "3px 8px", 
                        borderRadius: "12px", 
                        fontSize: "0.75rem", 
                        fontWeight: 700,
                        background: q.status === "Approved" ? "#f0fdf4" : q.status === "Sent" ? "#eff6ff" : "#fef3c7",
                        color: q.status === "Approved" ? "#16a34a" : q.status === "Sent" ? "#2563eb" : "#d97706",
                        border: `1px solid ${q.status === "Approved" ? "#bbf7d0" : q.status === "Sent" ? "#bfdbfe" : "#fde68a"}`
                      }}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Sourcing Actions */}
        <div className="sw-card">
          <div className="sw-card-header">
            <h3 className="sw-card-title">⚡ Sourcing Quick Actions</h3>
          </div>
          <div className="sw-card-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button 
              className="sw-btn sw-btn-primary" 
              style={{ justifyContent: "flex-start", padding: "12px 16px" }}
              onClick={() => navigate("/admin/sourcewiz/product-form")}
            >
              📷 Product Form (Upload Multi-Angle Photos & Specs)
            </button>
            <button 
              className="sw-btn sw-btn-secondary" 
              style={{ justifyContent: "flex-start", padding: "12px 16px" }}
              onClick={() => navigate("/admin/sourcewiz/quotations")}
            >
              📊 Generate Container Load Quote (FOB/CIF)
            </button>
            <button 
              className="sw-btn sw-btn-secondary" 
              style={{ justifyContent: "flex-start", padding: "12px 16px" }}
              onClick={() => navigate("/admin/sourcewiz/rfqs")}
            >
              📥 Review Buyer Inquiries & RFQs
            </button>

            <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                💡 Product Catalog 2.0 Integration Status
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                Connected to LII Factory ERP & Buyer Order Pipeline. Container CBM math active.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
