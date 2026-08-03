import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { crmApi } from "../api/crmApi";

export default function QuotationsListPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const data = await crmApi.listQuotations();
      setQuotations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return { bg: '#f3f4f6', text: '#374151' };
      case 'negotiating': return { bg: '#fef3c7', text: '#92400e' };
      case 'accepted': return { bg: '#d1fae5', text: '#065f46' };
      case 'rejected': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#e5e7eb', text: '#374151' };
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Quotations</h1>
        <Link 
          to="/admin/crm/quotations/new"
          style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", textDecoration: "none", borderRadius: 4 }}
        >
          New Quotation
        </Link>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: 16, fontWeight: 600, color: "#555" }}>Buyer Name</th>
            <th style={{ padding: 16, fontWeight: 600, color: "#555" }}>SKU Code</th>
            <th style={{ padding: 16, fontWeight: 600, color: "#555" }}>Product Name</th>
            <th style={{ padding: 16, fontWeight: 600, color: "#555" }}>Latest Price</th>
            <th style={{ padding: 16, fontWeight: 600, color: "#555" }}>Status</th>
            <th style={{ padding: 16, fontWeight: 600, color: "#555" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map(q => {
            const colors = getStatusColor(q.status);
            return (
              <tr key={q.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 16 }}>{q.buyer_name || 'N/A'}</td>
                <td style={{ padding: 16 }}>{q.sku_code}</td>
                <td style={{ padding: 16 }}>{q.product_name}</td>
                <td style={{ padding: 16 }}>{q.latest_price ? `${q.latest_currency || 'USD'} ${Number(q.latest_price).toFixed(2)}` : '-'}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ padding: "4px 8px", background: colors.bg, color: colors.text, borderRadius: 12, fontSize: 12, textTransform: 'capitalize' }}>
                    {q.status}
                  </span>
                </td>
                <td style={{ padding: 16 }}>
                  <Link to={`/admin/crm/quotations/new?id=${q.id}`} style={{ color: "#3b82f6", textDecoration: "none", marginRight: 16 }}>
                    Edit / Quotes
                  </Link>
                </td>
              </tr>
            );
          })}
          {quotations.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>No quotations found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
