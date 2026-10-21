import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { crmApi, LeadStatus, SalesStage } from "../api/crmApi";
import { merchantsApi, MerchantRecord } from "../../admin/masterdata/api/merchantsApi";
import { useCanTransferLead, useCanEditLead } from "../../auth/hooks/usePermissions";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

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

export interface ContactCard {
  name: string;
  designation: string;
  phone: string;
  email: string;
}

const SALES_STAGES: SalesStage[] = [
  "new_inquiry", "discovery", "qualification", "product_shared", "quotation_sent",
  "negotiation", "sample_discussion", "sample_under_development", "order_expected",
  "order_won", "order_lost", "dead_dormant",
];

export default function LeadFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const canTransfer = useCanTransferLead();
  const canEdit = useCanEditLead();

  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [leadCode, setLeadCode] = useState<string>("");

  const [form, setForm] = useState({
    inquiryDate: new Date().toISOString().slice(0, 10),
    contactName: "",
    companyName: "",
    country: "",
    city: "",
    phone: "",
    email: "",
    leadSource: "website",
    tradeFairName: "",
    leadCategory: "domestic",
    currency: "",
    preferredLanguage: "",
    creditLimit: "",
    paymentTerms: "",
    productCategory: "",
    inquiryDetails: "",
    assignedMerchantId: "",
    forecastAmount: "",
    winProbability: "",
    expectedCloseDate: "",
    nextFollowUpDate: "",
    priority: "medium",
    status: "active" as LeadStatus,
    salesStage: "new_inquiry" as SalesStage,
  });

  const [addresses, setAddresses] = useState<string[]>([""]);
  const [contacts, setContacts] = useState<ContactCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load merchants
  useEffect(() => {
    merchantsApi.list().then(setMerchants).catch(console.error);
  }, []);

  // Load existing lead for edit
  useEffect(() => {
    if (isEdit && id) {
      if (user && !canEdit) {
        return; // Handled by access restricted render block
      }

      setLoading(true);
      crmApi.getById(id)
        .then((lead) => {
          setLeadCode(lead.leadCode || "");
          setForm({
            inquiryDate: lead.inquiryDate ? lead.inquiryDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            contactName: lead.contactName || "",
            companyName: lead.companyName || "",
            country: lead.country || "",
            city: lead.city || "",
            phone: lead.phone || "",
            email: lead.email || "",
            leadSource: lead.leadSource || "website",
            tradeFairName: lead.tradeFairName || "",
            leadCategory: lead.leadCategory || "domestic",
            currency: lead.currency || "",
            preferredLanguage: lead.preferredLanguage || "",
            creditLimit: lead.creditLimit !== null && lead.creditLimit !== undefined ? String(lead.creditLimit) : "",
            paymentTerms: lead.paymentTerms || "",
            productCategory: lead.productCategory || "",
            inquiryDetails: lead.inquiryDetails || "",
            assignedMerchantId: lead.assignedMerchantId || "",
            forecastAmount: lead.forecastAmount !== null && lead.forecastAmount !== undefined ? String(lead.forecastAmount) : "",
            winProbability: lead.winProbability !== null && lead.winProbability !== undefined ? String(lead.winProbability) : "",
            expectedCloseDate: lead.expectedCloseDate ? lead.expectedCloseDate.slice(0, 10) : "",
            nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.slice(0, 10) : "",
            priority: lead.priority || "medium",
            status: lead.status || "active",
            salesStage: lead.salesStage || "new_inquiry",
          });

          // Parse multiple addresses
          if (lead.multipleAddresses) {
            const addrs = lead.multipleAddresses.split(" | ").map((a) => a.trim()).filter(Boolean);
            setAddresses(addrs.length > 0 ? addrs : [""]);
          }

          // Parse multiple contacts / visiting cards
          if (lead.contactPersons) {
            try {
              const parsed = JSON.parse(lead.contactPersons);
              if (Array.isArray(parsed)) {
                setContacts(
                  parsed.map((c) => ({
                    name: c.name || "",
                    designation: c.designation || "",
                    phone: c.phone || "",
                    email: c.email || "",
                  }))
                );
              }
            } catch {
              // Plain string fallback
              const names = lead.contactPersons.split("|").map((n) => n.trim()).filter(Boolean);
              setContacts(names.map((n) => ({ name: n, designation: "", phone: "", email: "" })));
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load lead details for edit:", err);
          setError("Failed to load lead details.");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, canEdit, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Filter valid contacts
    const validContacts = contacts.filter((c) => c.name.trim() !== "");
    const serializedContacts = validContacts.length > 0 ? JSON.stringify(validContacts) : undefined;

    const payload: any = {
      ...form,
      companyName: form.companyName || undefined,
      country: form.country || undefined,
      city: form.city || undefined,
      multipleAddresses: addresses.filter((a) => a.trim() !== "").join(" | ") || undefined,
      contactPersons: serializedContacts,
      phone: form.phone || undefined,
      email: form.email || undefined,
      tradeFairName: form.leadSource === "trade_fair" ? (form.tradeFairName || undefined) : undefined,
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
    };

    try {
      if (isEdit && id) {
        payload.salesStage = form.salesStage;
        payload.status = form.status;
        const updated = await crmApi.update(id, payload);
        alert(`Lead ${updated.leadCode || leadCode} updated successfully.`);
        navigate(`/admin/crm/leads/${id}`);
      } else {
        const lead = await crmApi.create(payload);
        navigate(`/admin/crm/leads/${lead.id}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? `Failed to ${isEdit ? "update" : "create"} lead.`);
    }
  }

  if (isEdit && user && !canEdit) {
    return (
      <div style={{ maxWidth: 640, margin: "60px auto", padding: 32, background: "#fff", borderRadius: 12, border: "1px solid #fecaca", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ color: "#991b1b", fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>Access Restricted</h2>
        <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 24px 0" }}>
          Editing leads is strictly restricted to Admin and Management accounts only.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/crm/leads")}
          style={{ background: "#0284c7", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
        >
          ← Return to Leads List
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading lead details for editing...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: 28, background: "#ffffff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
      {/* Form Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: "1px solid #f3f4f6", paddingBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#111827" }}>
            {isEdit ? `✏️ Edit Lead Details: ${leadCode || "Lead"}` : "New Lead Addition"}
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            {isEdit
              ? "Update buyer inquiries, multiple visiting cards/contacts, stage, and commercial details."
              : "Enter new inquiry information, buyer contact cards, and initial sales forecast."}
          </p>
        </div>
        {isEdit && (
          <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
            Management Edit Mode
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Inquiry Date */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Inquiry Date <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="date" required value={form.inquiryDate} onChange={(e) => setForm({ ...form, inquiryDate: e.target.value })} style={inputStyle} />
          </div>

          {/* Company Name */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Company / Buyer Organization Name</label>
            <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} style={inputStyle} placeholder="e.g. Nordic Living AB" />
          </div>

          {/* Section: Contact Details / Visiting Cards */}
          <div style={{ gridColumn: "span 2", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  👤 Contact Details & Visiting Cards
                </span>
                <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>
                  Add primary contact and any additional visiting cards collected (Contact 1, Contact 2, Contact 3...)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setContacts([...contacts, { name: "", designation: "", phone: "", email: "" }])}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>📇</span> + Add Visiting Card (Contact 2, 3...)
              </button>
            </div>

            {/* Primary Contact (Contact 1) */}
            <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 4 }}>
                  Contact #1 (Primary Contact / Visiting Card 1)
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Primary Contact Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} style={inputStyle} placeholder="Full Name" />
                </div>
                <div>
                  <label style={labelStyle}>Phone / Mobile</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+1 555-0123" />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="name@company.com" />
                </div>
                <div>
                  <label style={labelStyle}>Preferred Language</label>
                  <input value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })} style={inputStyle} placeholder="English, German..." />
                </div>
              </div>
            </div>

            {/* Additional Contacts / Visiting Cards (Contact 2, Contact 3, etc.) */}
            {contacts.map((contact, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: 4 }}>
                    Contact #{idx + 2} (Visiting Card #{idx + 2})
                  </span>
                  <button
                    type="button"
                    onClick={() => setContacts(contacts.filter((_, i) => i !== idx))}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    ✕ Remove Card
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Contact Person Name</label>
                    <input
                      value={contact.name}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].name = e.target.value;
                        setContacts(updated);
                      }}
                      style={inputStyle}
                      placeholder="e.g. Sarah Jenkins"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Designation / Role</label>
                    <input
                      value={contact.designation}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].designation = e.target.value;
                        setContacts(updated);
                      }}
                      style={inputStyle}
                      placeholder="e.g. Sourcing Director, Buyer, Designer"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone / Mobile</label>
                    <input
                      value={contact.phone}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].phone = e.target.value;
                        setContacts(updated);
                      }}
                      style={inputStyle}
                      placeholder="+1 555-..."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].email = e.target.value;
                        setContacts(updated);
                      }}
                      style={inputStyle}
                      placeholder="sarah@company.com"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Country */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Country</label>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputStyle} placeholder="Country" />
          </div>

          {/* City */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} placeholder="City" />
          </div>

          {/* Lead Source */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Lead Source</label>
            <select value={form.leadSource} onChange={(e) => setForm({ ...form, leadSource: e.target.value })} style={inputStyle}>
              <option value="website">Website</option>
              <option value="trade_fair">🎪 Trade Fair</option>
              <option value="whatsapp">📱 WhatsApp</option>
              <option value="email">✉️ Email Inquiry</option>
              <option value="referral">👥 Referral</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Lead Category */}
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

          {/* Trade Fair Name if Source == trade_fair */}
          {form.leadSource === "trade_fair" && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Trade Fair Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input value={form.tradeFairName} onChange={(e) => setForm({ ...form, tradeFairName: e.target.value })} style={inputStyle} placeholder="e.g. IHGF Delhi Fair, Canton Fair 2026" />
            </div>
          )}

          {/* Currency */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Currency</label>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={inputStyle} placeholder="USD, EUR, INR..." />
          </div>

          {/* Product Category */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Product Category</label>
            <input value={form.productCategory} onChange={(e) => setForm({ ...form, productCategory: e.target.value })} style={inputStyle} placeholder="e.g. Wooden Crafts, Metal Furniture" />
          </div>

          {/* Credit Limit */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Credit Limit</label>
            <input type="number" min={0} value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} style={inputStyle} placeholder="Amount" />
          </div>

          {/* Payment Terms */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Payment Terms</label>
            <input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} style={inputStyle} placeholder="e.g. 30 Days Advance, LC" />
          </div>

          {/* Assigned Merchant (Restricted to Admin and Management only) */}
          {canTransfer && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Assigned Merchant</label>
              <select style={inputStyle} value={form.assignedMerchantId} onChange={(e) => setForm({ ...form, assignedMerchantId: e.target.value })}>
                <option value="">-- Unassigned --</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Priority */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Forecast Amount */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Forecast Amount</label>
            <input type="number" min={0} value={form.forecastAmount} onChange={(e) => setForm({ ...form, forecastAmount: e.target.value })} style={inputStyle} placeholder="Expected revenue" />
          </div>

          {/* Win Probability */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Win Probability (%)</label>
            <input type="number" min={0} max={100} value={form.winProbability} onChange={(e) => setForm({ ...form, winProbability: e.target.value })} style={inputStyle} placeholder="0-100" />
          </div>

          {/* Expected Close Date */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Expected Close Date</label>
            <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} style={inputStyle} />
          </div>

          {/* Next Follow-up Date */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Next Follow-up Date</label>
            <input type="date" value={form.nextFollowUpDate} onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })} style={inputStyle} />
          </div>

          {/* Status and Stage (Editable especially in Edit Mode) */}
          {isEdit && (
            <>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Sales Stage</label>
                <select value={form.salesStage} onChange={(e) => setForm({ ...form, salesStage: e.target.value as SalesStage })} style={inputStyle}>
                  {SALES_STAGES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Lead Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })} style={inputStyle}>
                  <option value="active">Active Pipeline</option>
                  <option value="won">🏆 Won</option>
                  <option value="lost">Lost</option>
                  <option value="dead">Dead</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>
            </>
          )}

          {/* Multiple Addresses */}
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

          {/* Notes / Inquiry Details */}
          <div style={{ gridColumn: "span 2", ...fieldGroupStyle }}>
            <label style={labelStyle}>Notes / Inquiry Details</label>
            <textarea value={form.inquiryDetails} onChange={(e) => setForm({ ...form, inquiryDetails: e.target.value })} rows={4} style={{ ...inputStyle, minHeight: 80 }} placeholder="Enter detailed inquiry requirement or client background notes..." />
          </div>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: 14, marginTop: 12 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
          <button type="button" onClick={() => navigate(isEdit ? `/admin/crm/leads/${id}` : "/admin/crm/leads")} style={{ padding: "10px 18px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
          <button type="submit" style={{ padding: "10px 24px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>
            {isEdit ? "💾 Update & Save Lead" : "Save & Create Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
