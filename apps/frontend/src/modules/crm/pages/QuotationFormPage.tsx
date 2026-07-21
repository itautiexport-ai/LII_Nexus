import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { crmApi } from "../api/crmApi";
import { masterDataApi } from "../../admin/masterdata/api/masterDataApi";

export default function QuotationFormPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState<any[]>([]);
  const [form, setForm] = useState({ buyerId: "", skuCode: "", productName: "", productImageUrl: "", status: "draft" });
  const [quotes, setQuotes] = useState<any[]>([]);
  const [newQuote, setNewQuote] = useState({ quoteName: "", currency: "USD", price: "", notes: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const buyersData = await masterDataApi.getBuyers();
      setBuyers(buyersData);

      if (id) {
        // Fetch quotation details and quotes
        // For simplicity, we just filter from list and fetch quotes directly
        const quotations = await crmApi.listQuotations();
        const current = quotations.find((q: any) => q.id === id);
        if (current) {
          setForm({
            buyerId: current.buyer_id,
            skuCode: current.sku_code,
            productName: current.product_name,
            productImageUrl: current.product_image_url || "",
            status: current.status
          });
        }
        const quotesData = await crmApi.listQuotes(id);
        setQuotes(quotesData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!id) {
        await crmApi.createQuotation(form);
        navigate("/admin/crm/quotations");
      } else {
        await crmApi.updateQuotationStatus(id, form.status);
        alert("Status updated");
      }
    } catch (e) {
      alert("Error saving quotation");
    }
  };

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newQuote.quoteName || !newQuote.price) return;
    try {
      await crmApi.addQuote(id, { 
        quoteName: newQuote.quoteName, 
        currency: newQuote.currency,
        price: parseFloat(newQuote.price), 
        notes: newQuote.notes 
      });
      setNewQuote({ quoteName: "", currency: "USD", price: "", notes: "" });
      loadData();
    } catch (e) {
      alert("Error adding quote iteration");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        {id ? "Quotation Details" : "New Quotation"}
      </h1>

      <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Basic Info</h2>
        <form onSubmit={handleSaveQuotation} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#374151", fontSize: 14 }}>Buyer</label>
            <select
              value={form.buyerId}
              onChange={e => setForm({ ...form, buyerId: e.target.value })}
              disabled={!!id}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 }}
              required
            >
              <option value="">Select Buyer...</option>
              {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#374151", fontSize: 14 }}>Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 }}
            >
              <option value="draft">Draft</option>
              <option value="negotiating">Negotiating</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#374151", fontSize: 14 }}>SKU Code</label>
            <input
              value={form.skuCode}
              onChange={e => setForm({ ...form, skuCode: e.target.value })}
              disabled={!!id}
              required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#374151", fontSize: 14 }}>Product Name</label>
            <input
              value={form.productName}
              onChange={e => setForm({ ...form, productName: e.target.value })}
              disabled={!!id}
              required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 }}
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", marginBottom: 8, color: "#374151", fontSize: 14 }}>Product Image URL</label>
            <input
              value={form.productImageUrl}
              onChange={e => setForm({ ...form, productImageUrl: e.target.value })}
              disabled={!!id}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 }}
              placeholder="https://..."
            />
            {form.productImageUrl && <img src={form.productImageUrl} alt="Product" style={{ marginTop: 16, maxHeight: 200, borderRadius: 8 }} />}
          </div>
          <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button type="submit" style={{ padding: "8px 24px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
              {id ? "Update Status" : "Create Quotation"}
            </button>
          </div>
        </form>
      </div>

      {id && (
        <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Quote History</h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={{ padding: 12, borderBottom: "1px solid #eee", color: "#555" }}>Iteration</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee", color: "#555" }}>Price</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee", color: "#555" }}>Notes</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee", color: "#555" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q: any) => (
                <tr key={q.id}>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}><strong>{q.quote_name}</strong></td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{q.currency || 'USD'} {Number(q.price).toFixed(2)}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee", color: "#6b7280" }}>{q.notes || '-'}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee", fontSize: 13, color: "#9ca3af" }}>
                    {new Date(q.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>No quotes added yet.</td></tr>
              )}
            </tbody>
          </table>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>Add New Quote</h3>
          <form onSubmit={handleAddQuote} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#6b7280" }}>Quote Name (e.g. 1st quote, 2nd quote)</label>
              <input required value={newQuote.quoteName} onChange={e => setNewQuote({ ...newQuote, quoteName: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 }} />
            </div>
            <div style={{ flex: 1, display: "flex", gap: 8 }}>
              <div style={{ width: 80 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#6b7280" }}>Currency</label>
                <select value={newQuote.currency} onChange={e => setNewQuote({ ...newQuote, currency: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: 4 }}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="RMB">RMB</option>
                  <option value="IDR">IDR</option>
                  <option value="VND">VND</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#6b7280" }}>Price</label>
                <input required type="number" step="0.01" value={newQuote.price} onChange={e => setNewQuote({ ...newQuote, price: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#6b7280" }}>Notes (Optional)</label>
              <input value={newQuote.notes} onChange={e => setNewQuote({ ...newQuote, notes: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4 }} />
            </div>
            <button type="submit" style={{ padding: "9px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
              Add Quote
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
