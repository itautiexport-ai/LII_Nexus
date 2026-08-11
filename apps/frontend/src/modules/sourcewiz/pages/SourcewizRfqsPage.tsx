import { useState } from "react";
import "../Sourcewiz.css";

interface Rfq {
  id: string;
  buyer: string;
  country: string;
  productRequested: string;
  targetQty: number;
  date: string;
  status: "New" | "Quotation Sent" | "In Review" | "Closed";
}

export default function SourcewizRfqsPage() {
  const [rfqs] = useState<Rfq[]>([
    { id: "RFQ-8801", buyer: "Crate & Barrel Trading", country: "🇺🇸 USA", productRequested: "Solid Oak Dining Tables & Dining Chairs", targetQty: 200, date: "2026-08-06", status: "New" },
    { id: "RFQ-8800", buyer: "JYSK Nordic Sourcing", country: "🇩🇰 Denmark", productRequested: "Rattan Armchairs & Outdoor Patio Sets", targetQty: 450, date: "2026-08-04", status: "In Review" },
    { id: "RFQ-8799", buyer: "Pottery Barn Sourcing Ltd", country: "🇺🇸 USA", productRequested: "Mango Wood Brass Inlay Cabinets", targetQty: 120, date: "2026-08-01", status: "Quotation Sent" },
    { id: "RFQ-8798", buyer: "Wayfair Global Sourcing", country: "🇨🇦 Canada", productRequested: "Minimalist Office Workstation Sets", targetQty: 300, date: "2026-07-28", status: "Closed" },
  ]);

  return (
    <div className="sw-container">
      {/* Header */}
      <div className="sw-header-gradient" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="sw-title">📥 Buyer RFQs & Inquiries</h1>
          <p className="sw-subtitle">Incoming International Buyer Inquiries & Custom Specification Requests</p>
        </div>
      </div>

      <div className="sw-card">
        <div className="sw-card-header">
          <h3 className="sw-card-title">📋 Active RFQ Pipeline ({rfqs.length})</h3>
        </div>
        <div className="sw-card-body" style={{ padding: 0 }}>
          <table className="sw-table">
            <thead>
              <tr>
                <th className="sw-th">RFQ ID</th>
                <th className="sw-th">Buyer Name</th>
                <th className="sw-th">Requested Specifications</th>
                <th className="sw-th">Target Qty</th>
                <th className="sw-th">Date</th>
                <th className="sw-th">Status</th>
                <th className="sw-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="sw-tr">
                  <td className="sw-td" style={{ fontWeight: 700, color: "#4f46e5" }}>{rfq.id}</td>
                  <td className="sw-td" style={{ fontWeight: 600 }}>
                    {rfq.buyer} <span style={{ fontSize: "0.80rem", marginLeft: "4px" }}>{rfq.country}</span>
                  </td>
                  <td className="sw-td">{rfq.productRequested}</td>
                  <td className="sw-td" style={{ fontWeight: 700 }}>{rfq.targetQty} Pcs</td>
                  <td className="sw-td" style={{ color: "#64748b" }}>{rfq.date}</td>
                  <td className="sw-td">
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: rfq.status === "New" ? "#fef3c7" : rfq.status === "Quotation Sent" ? "#f0fdf4" : "#f1f5f9",
                        color: rfq.status === "New" ? "#d97706" : rfq.status === "Quotation Sent" ? "#16a34a" : "#475569",
                        border: `1px solid ${rfq.status === "New" ? "#fde68a" : rfq.status === "Quotation Sent" ? "#bbf7d0" : "#cbd5e1"}`
                      }}
                    >
                      {rfq.status}
                    </span>
                  </td>
                  <td className="sw-td">
                    <button
                      className="sw-btn sw-btn-primary"
                      style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                      onClick={() => alert(`Creating quotation for ${rfq.buyer}...`)}
                    >
                      📄 Create Quote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
