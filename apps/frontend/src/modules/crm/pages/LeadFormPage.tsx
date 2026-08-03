import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmApi } from "../api/crmApi";
import { merchantsApi, MerchantRecord } from "../../admin/masterdata/api/merchantsApi";

const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: 8, marginTop: 4, marginBottom: 12, border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#444" };

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
    <div style={{ maxWidth: 640, background: "#fff" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16, color: "#222" }}>New Lead</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={labelStyle}>Inquiry Date
            <input type="date" required value={form.inquiryDate} onChange={(e) => setForm({ ...form, inquiryDate: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Contact Name
            <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Company Name
            <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Country
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>City
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} />
          </label>
          <div style={{ ...labelStyle, display: "flex", flexDirection: "column" }}>
            <span>Multiple Addresses</span>
            {addresses.map((addr, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8 }}>
                <input 
                  value={addr} 
                  onChange={(e) => {
                    const newAddrs = [...addresses];
                    newAddrs[idx] = e.target.value;
                    setAddresses(newAddrs);
                  }} 
                  style={{ ...inputStyle, marginBottom: 4 }} 
                  placeholder={`Address ${idx + 1}`} 
                />
                {addresses.length > 1 && (
                  <button type="button" onClick={() => setAddresses(addresses.filter((_, i) => i !== idx))} style={{ padding: "8px 12px", height: "35px", marginTop: "4px", background: "#fee", border: "1px solid #fcc", color: "crimson", cursor: "pointer", borderRadius: 4 }}>✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setAddresses([...addresses, ""])} style={{ alignSelf: "flex-start", padding: "4px 8px", background: "#eee", border: "1px solid #ccc", cursor: "pointer", borderRadius: 4, marginBottom: 12 }}>+ Add Address</button>
          </div>
          <label style={labelStyle}>Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Currency
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={inputStyle} placeholder="USD, EUR, INR..." />
          </label>
          <label style={labelStyle}>Preferred Language
            <input value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Credit Limit
            <input type="number" min={0} value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Payment Terms
            <input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Product Category
            <input value={form.productCategory} onChange={(e) => setForm({ ...form, productCategory: e.target.value })} style={inputStyle} />
          </label>

          <label style={labelStyle}>Lead Source
            <select value={form.leadSource} onChange={(e) => setForm({ ...form, leadSource: e.target.value })} style={inputStyle}>
              <option value="trade_fair">Trade Fair</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option>
              <option value="website">Website</option><option value="referral">Referral</option><option value="other">Other</option>
            </select>
          </label>
          <label style={labelStyle}>Lead Category
            <select value={form.leadCategory} onChange={(e) => setForm({ ...form, leadCategory: e.target.value })} style={inputStyle}>
              <option value="export">Export</option><option value="domestic">Domestic</option>
              <option value="hotel_restaurant_project">Hotel / Restaurant / Project</option>
              <option value="buyer_agent">Buyer Agent</option><option value="repeat_customer">Repeat Customer</option>
            </select>
          </label>
          {form.leadSource === "trade_fair" && (
            <label style={labelStyle}>Trade Fair Name
              <input value={form.tradeFairName} onChange={(e) => setForm({ ...form, tradeFairName: e.target.value })} style={inputStyle} placeholder="e.g. Canton Fair 2026" />
            </label>
          )}
          <div>
            <label style={labelStyle}>Assigned Merchant</label>
            <select style={inputStyle} value={form.assignedMerchantId} onChange={(e) => setForm({ ...form, assignedMerchantId: e.target.value })}>
              <option value="">-- Unassigned --</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <label style={labelStyle}>Priority
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </label>
          <label style={labelStyle}>Forecast Amount
            <input type="number" min={0} value={form.forecastAmount} onChange={(e) => setForm({ ...form, forecastAmount: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Win Probability (%)
            <input type="number" min={0} max={100} value={form.winProbability} onChange={(e) => setForm({ ...form, winProbability: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Expected Close Date
            <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>Next Follow-up Date
            <input type="date" value={form.nextFollowUpDate} onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })} style={inputStyle} />
          </label>
        </div>
        <label style={labelStyle}>Notes (Inquiry Details)
          <textarea value={form.inquiryDetails} onChange={(e) => setForm({ ...form, inquiryDetails: e.target.value })} rows={3} style={inputStyle} />
        </label>
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        <button type="submit" style={{ padding: "10px 20px", background: "#333", color: "#fff", border: "none", borderRadius: 4 }}>Create Lead</button>
      </form>
    </div>
  );
}
