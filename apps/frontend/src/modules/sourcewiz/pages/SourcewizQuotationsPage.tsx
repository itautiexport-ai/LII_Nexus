import { useState } from "react";
import "../Sourcewiz.css";

interface QuoteItem {
  sku: string;
  name: string;
  unitPrice: number;
  qty: number;
  cbm: number;
}

export default function SourcewizQuotationsPage() {
  const [buyerName, setBuyerName] = useState("West Elm Global Sourcing");
  const [currency, setCurrency] = useState("USD");
  const [incoterms, setIncoterms] = useState("FOB Mundra Port");
  const [discountPercent, setDiscountPercent] = useState(5);

  const [items, setItems] = useState<QuoteItem[]>([
    { sku: "SW-LII-DT-01", name: "Nordic Solid Oak Dining Table", unitPrice: 245.0, qty: 50, cbm: 0.35 },
    { sku: "SW-LII-OC-04", name: "Minimalist Ergonomic Executive Chair", unitPrice: 110.0, qty: 100, cbm: 0.18 },
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const grandTotal = subtotal - discountVal;
  const totalCbm = items.reduce((sum, item) => sum + item.cbm * item.qty, 0);

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";

  const handleQtyChange = (index: number, newQty: number) => {
    const updated = [...items];
    updated[index].qty = Math.max(1, newQty);
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleGeneratePdfQuote = () => {
    alert(`Quotation generated successfully for ${buyerName}!\nTotal Amount: ${currencySymbol}${grandTotal.toFixed(2)}\nTotal Volume: ${totalCbm.toFixed(2)} CBM`);
  };

  return (
    <div className="sw-container">
      {/* Header */}
      <div className="sw-header-gradient" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="sw-title">📊 Product Catalog 2.0 B2B Quotation Builder</h1>
          <p className="sw-subtitle">Container Load & Multicurrency Export Quotation Generator</p>
        </div>

        <button className="sw-btn sw-btn-primary" onClick={handleGeneratePdfQuote}>
          📥 Export PDF / Send to Buyer
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Quote Details & Line Items */}
        <div className="sw-card">
          <div className="sw-card-header">
            <h3 className="sw-card-title">📝 Quotation Header & Line Items</h3>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4f46e5", background: "#eef2ff", padding: "4px 10px", borderRadius: "12px" }}>
              Ref: QT-2026-092
            </span>
          </div>
          <div className="sw-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Buyer / Company Name</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Incoterms / Shipping</label>
                <input
                  type="text"
                  value={incoterms}
                  onChange={(e) => setIncoterms(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            {/* Line Items Table */}
            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 700, color: "#334155" }}>
              Selected Products ({items.length})
            </h4>

            <table className="sw-table">
              <thead>
                <tr>
                  <th className="sw-th">SKU</th>
                  <th className="sw-th">Item Description</th>
                  <th className="sw-th">FOB Unit Price</th>
                  <th className="sw-th">Quantity</th>
                  <th className="sw-th">Total Vol (CBM)</th>
                  <th className="sw-th">Line Total</th>
                  <th className="sw-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                      No items added to quotation.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="sw-tr">
                      <td className="sw-td" style={{ fontWeight: 700 }}>{item.sku}</td>
                      <td className="sw-td" style={{ fontWeight: 600 }}>{item.name}</td>
                      <td className="sw-td">{currencySymbol}{item.unitPrice.toFixed(2)}</td>
                      <td className="sw-td">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 1)}
                          style={{ width: "70px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                        />
                      </td>
                      <td className="sw-td">{(item.cbm * item.qty).toFixed(2)} m³</td>
                      <td className="sw-td" style={{ fontWeight: 700, color: "#0f172a" }}>
                        {currencySymbol}{(item.unitPrice * item.qty).toFixed(2)}
                      </td>
                      <td className="sw-td">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Container & Commercial Summary */}
        <div className="sw-card">
          <div className="sw-card-header">
            <h3 className="sw-card-title">💰 Commercial Summary</h3>
          </div>
          <div className="sw-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.90rem" }}>
                <span style={{ color: "#64748b" }}>Subtotal:</span>
                <span style={{ fontWeight: 700 }}>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.90rem" }}>
                <span style={{ color: "#64748b" }}>Discount (%):</span>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  style={{ width: "70px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", textAlign: "right" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.90rem", color: "#dc2626" }}>
                <span>Discount Amount:</span>
                <span style={{ fontWeight: 700 }}>-{currencySymbol}{discountVal.toFixed(2)}</span>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "4px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                <span>Grand Total:</span>
                <span style={{ color: "#4f46e5" }}>{currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>

              {/* Container Capacity Breakdown */}
              <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  📦 Container Volume Calculation
                </div>
                <div style={{ fontSize: "0.80rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>Total Volume: <strong>{totalCbm.toFixed(2)} CBM</strong></div>
                  <div>20ft FCL Container (~28 CBM): <strong>{(totalCbm / 28 * 100).toFixed(1)}% Full</strong></div>
                  <div>40ft HQ Container (~68 CBM): <strong>{(totalCbm / 68 * 100).toFixed(1)}% Full</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
