import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmApi } from "../api/crmApi";
import { merchantsApi, MerchantRecord } from "../../admin/masterdata/api/merchantsApi";

const fieldGroupStyle: React.CSSProperties = { display: "flex", flexDirection: "column", marginBottom: 14 };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: 14,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#1f2937",
  outline: "none",
  minHeight: 38,
};

export default function LeadFormPage() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [form, setForm] = useState({
    inquiryDate: new Date().toISOString().slice(0, 10),
    contactName: "", companyName: "", country: "", city: "", phone: "", email: "",
    leadSource: "website", tradeFairName: "", leadCategory: "domestic", currency: "", preferredLanguage: "", creditLimit: "", paymentTerms: "", productCategory: "", inquiryDetails: "",
    assignedMerchantId: "", forecastAmount: "", winProbability: "", expectedCloseDate: "",
    nextFollowUpDate: "", priority: "medium",
  });
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { merchantsApi.list().then(setMerchants); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const lead = await crmApi.create({
        ...form,
        companyName: form.companyName || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        multipleAddresses: addresses.filter(a => a.trim() !== "").join(" | ") || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        currency: form.currency || undefined,
        preferredLanguage: form.preferredLanguage || undefined,
        creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
        paymentTerms: form.paymentTerms || undefined,
        productCategory: form.productCategory || undefined,
        inquiryDetails: form.inquiryDetails || undefined,
        assignedMerchantId: form.assignedMerchantId || undefined,
        forecastAmount: form.forecastAmount ? Number(form.forecastAmount) : undefined,
        winProbability: form.winProbability ? Number(form.winProbability) : undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
        nextFollowUpDate: form.nextFollowUpDate || undefined,
      });
      navigate(`/admin/crm/leads/${lead.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create lead.");
    }
  }

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: 24, background: "#ffffff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#111827", borderBottom: "1px solid #f3f4f6", paddingBottom: 12 }}>
        New Lead Addition
      </h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Inquiry Date <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="date" required value={form.inquiryDate} onChange={(e) => setForm({ ...form, inquiryDate: e.target.value })} style={inputStyle} />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Contact Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} style={inputStyle} placeholder="Full Name" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Company Name</label>
            <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} style={inputStyle} placeholder="Organization / Business" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Country</label>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputStyle} placeholder="Country" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} placeholder="City" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+91..." />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="name@company.com" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Currency</label>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={inputStyle} placeholder="USD, EUR, INR..." />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Preferred Language</label>
            <input value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })} style={inputStyle} placeholder="English, Hindi..." />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Credit Limit</label>
            <input type="number" min={0} value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} style={inputStyle} placeholder="Amount" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Payment Terms</label>
            <input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} style={inputStyle} placeholder="e.g. 30 Days Advance" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Product Category</label>
            <input value={form.productCategory} onChange={(e) => setForm({ ...form, productCategory: e.target.value })} style={inputStyle} placeholder="e.g. Wooden Crafts" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Lead Source</label>
            <select value={form.leadSource} onChange={(e) => setForm({ ...form, leadSource: e.target.value })} style={inputStyle}>
              <option value="website">Website</option>
              <option value="trade_fair">Trade Fair</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Lead Category</label>
            <select value={form.leadCategory} onChange={(e) => setForm({ ...form, leadCategory: e.target.value })} style={inputStyle}>
              <option value="domestic">Domestic</option>
              <option value="export">Export</option>
              <option value="hotel_restaurant_project">Hotel / Restaurant / Project</option>
              <option value="buyer_agent">Buyer Agent</option>
              <option value="repeat_customer">Repeat Customer</option>
            </select>
          </div>

          {form.leadSource === "trade_fair" && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Trade Fair Name</label>
              <input value={form.tradeFairName} onChange={(e) => setForm({ ...form, tradeFairName: e.target.value })} style={inputStyle} placeholder="e.g. Canton Fair 2026" />
            </div>
          )}

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Assigned Merchant</label>
            <select style={inputStyle} value={form.assignedMerchantId} onChange={(e) => setForm({ ...form, assignedMerchantId: e.target.value })}>
              <option value="">-- Unassigned --</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Forecast Amount</label>
            <input type="number" min={0} value={form.forecastAmount} onChange={(e) => setForm({ ...form, forecastAmount: e.target.value })} style={inputStyle} placeholder="Expected revenue" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Win Probability (%)</label>
            <input type="number" min={0} max={100} value={form.winProbability} onChange={(e) => setForm({ ...form, winProbability: e.target.value })} style={inputStyle} placeholder="0-100" />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Expected Close Date</label>
            <input type="date" value={form.expectedCloseDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} style={inputStyle} />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Next Follow-up Date</label>
            <input type="date" value={form.nextFollowUpDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ gridColumn: "span 2", ...fieldGroupStyle }}>
            <label style={labelStyle}>Multiple Addresses</label>
            {addresses.map((addr, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={addr}
                  onChange={(e) => {
                    const newAddrs = [...addresses];
                    newAddrs[idx] = e.target.value;
                    setAddresses(newAddrs);
                  }}
                  style={inputStyle}
                  placeholder={`Address Line ${idx + 1}`}
                />
                {addresses.length > 1 && (
                  <button type="button" onClick={() => setAddresses(addresses.filter((_, i) => i !== idx))} style={{ padding: "0 12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", cursor: "pointer", borderRadius: 6, fontSize: 14 }}>✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setAddresses([...addresses, ""])} style={{ alignSelf: "flex-start", padding: "6px 12px", background: "#f3f4f6", border: "1px solid #d1d5db", color: "#374151", cursor: "pointer", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>+ Add Address Line</button>
          </div>

          <div style={{ gridColumn: "span 2", ...fieldGroupStyle }}>
            <label style={labelStyle}>Notes / Inquiry Details</label>
            <textarea value={form.inquiryDetails} onChange={(e) => setForm({ ...form, inquiryDetails: e.target.value })} rows={4} style={{ ...inputStyle, minHeight: 80 }} placeholder="Enter detailed inquiry requirement or client background notes..." />
          </div>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: 14, marginTop: 12 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
          <button type="button" onClick={() => navigate("/admin/crm/leads")} style={{ padding: "10px 18px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
          <button type="submit" style={{ padding: "10px 24px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>Save & Create Lead</button>
        </div>
      </form>
    </div>
  );
}
