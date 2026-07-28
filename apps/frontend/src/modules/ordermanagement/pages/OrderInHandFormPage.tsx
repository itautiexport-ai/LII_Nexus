import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { orderInHandApi, OrderInHandRecord } from "../api/orderInHandApi";
import { masterDataApi, Merchant } from "../../admin/masterdata/api/masterDataApi";

export default function OrderInHandFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<Partial<OrderInHandRecord>>({
    orderDate: "",
    customerName: "",
    country: "",
    merchantName: "",
    erpNumber: "",
    exFactoryDate: "",
    marketplace: null,
    poNumber: "",
    noOfProducts: null,
    totalQty: null,
    orderValue: null,
    currency: null,
    paymentStatus: null,
    productionStatus: null,
    qcStatus: null,
    packingStatus: null,
    dispatchStatus: null,
    expectedDispatchDate: "",
    expectedDelivery: "",
    priority: null,
    delayDays: null,
    currentStage: "",
    overallProgress: null
  });

  const [merchants, setMerchants] = useState<Merchant[]>([]);

  useEffect(() => {
    if (id && id !== "new") {
      loadOrder(id);
    }
    loadMerchants();
  }, [id]);

  async function loadMerchants() {
    try {
      const data = await masterDataApi.getMerchants();
      setMerchants(data.filter(m => m.status === 'active'));
    } catch (err) {
      console.error(err);
    }
  }

  async function loadOrder(orderId: string) {
    try {
      const data = await orderInHandApi.getById(orderId);
      setForm(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load order");
      navigate("/admin/order-management/list");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      // clean up empty strings for nullables
      if (!payload.expectedDispatchDate) payload.expectedDispatchDate = null;
      if (!payload.expectedDelivery) payload.expectedDelivery = null;

      if (id && id !== "new") {
        await orderInHandApi.update(id, payload);
      } else {
        await orderInHandApi.create(payload);
      }
      navigate("/admin/order-management/list");
    } catch (err) {
      console.error(err);
      alert("Failed to save order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: "#fff", minHeight: "100vh", fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>{id && id !== "new" ? "Edit Order" : "Add Order"}</h1>
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Order Date *</label>
          <input type="date" required value={form.orderDate || ""} onChange={e => setForm({...form, orderDate: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Customer Name *</label>
          <input type="text" required value={form.customerName || ""} onChange={e => setForm({...form, customerName: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Country *</label>
          <select required value={form.country || ""} onChange={e => setForm({...form, country: e.target.value})} style={inputStyle}>
            <option value="">Select Country...</option>
            <option value="USA">USA</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="India">India</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Italy">Italy</option>
            <option value="Spain">Spain</option>
            <option value="Netherlands">Netherlands</option>
            <option value="UAE">UAE</option>
            <option value="China">China</option>
            <option value="Japan">Japan</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Merchant Name *</label>
          <select required value={form.merchantName || ""} onChange={e => setForm({...form, merchantName: e.target.value})} style={inputStyle}>
            <option value="">Select...</option>
            {merchants.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>ERP Number *</label>
          <input type="text" required value={form.erpNumber || ""} onChange={e => setForm({...form, erpNumber: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ex-Factory Date *</label>
          <input type="date" required value={form.exFactoryDate || ""} onChange={e => setForm({...form, exFactoryDate: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>PO Number *</label>
          <input type="text" required value={form.poNumber || ""} onChange={e => setForm({...form, poNumber: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>No. of Products *</label>
          <input type="number" required value={form.noOfProducts || ""} onChange={e => setForm({...form, noOfProducts: e.target.value ? parseInt(e.target.value) : null})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Total Qty *</label>
          <input type="number" required value={form.totalQty || ""} onChange={e => setForm({...form, totalQty: e.target.value ? parseInt(e.target.value) : null})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Total CBM</label>
          <input type="number" step="0.01" value={form.totalCbm || ""} onChange={e => setForm({...form, totalCbm: e.target.value ? parseFloat(e.target.value) : null})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Order Value *</label>
          <input type="number" step="0.01" required value={form.orderValue || ""} onChange={e => setForm({...form, orderValue: e.target.value ? parseFloat(e.target.value) : null})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Currency *</label>
          <select required value={form.currency || ""} onChange={e => setForm({...form, currency: e.target.value as any})} style={inputStyle}>
            <option value="">Select...</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Payment Status *</label>
          <select required value={form.paymentStatus || ""} onChange={e => setForm({...form, paymentStatus: e.target.value as any})} style={inputStyle}>
            <option value="">Select...</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
        </div>



        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 16 }}>
          <button type="submit" disabled={loading} style={{ background: "#4f46e5", color: "#fff", padding: "10px 20px", border: "none", borderRadius: 6, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Saving..." : "Save Order"}
          </button>
          <button type="button" onClick={() => navigate("/admin/order-management/list")} style={{ background: "#e5e7eb", color: "#374151", padding: "10px 20px", border: "none", borderRadius: 6, fontWeight: 500, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#374151" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
