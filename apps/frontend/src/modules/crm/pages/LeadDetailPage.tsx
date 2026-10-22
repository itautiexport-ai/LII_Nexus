import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { crmApi, LeadDetail } from "../api/crmApi";
import { merchantsApi, MerchantRecord } from "../../admin/masterdata/api/merchantsApi";
import PermissionGate from "../../../shared/guards/PermissionGate";
import { useCanTransferLead, useCanEditLead } from "../../auth/hooks/usePermissions";

const SALES_STAGES = [
  "new_inquiry", "discovery", "qualification", "product_shared", "quotation_sent", "negotiation",
  "sample_discussion", "sample_under_development", "order_expected", "order_won", "order_lost", "dead_dormant",
];

const inputStyle: React.CSSProperties = { padding: 6, border: "1px solid #ccc", borderRadius: 4 };

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canTransfer = useCanTransferLead();
  const canEdit = useCanEditLead();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [followupForm, setFollowupForm] = useState({ dueDate: "", remarks: "", nextAction: "" });

  async function load() {
    if (!id) return;
    const [leadData, merchantList] = await Promise.all([crmApi.getById(id), merchantsApi.list()]);
    setLead(leadData);
    setMerchants(merchantList);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the route param changes
  useEffect(() => { load(); }, [id]);

  async function handleFieldChange(field: string, value: unknown) {
    if (!id) return;
    setError(null);
    try {
      await crmApi.update(id, { [field]: value });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to update lead.");
    }
  }

  async function handleAssign(merchantId: string) {
    if (!id || !canTransfer) return;
    setError(null);
    try {
      await crmApi.assign(id, merchantId || null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to assign lead.");
    }
  }

  async function handleLogFollowup(e: FormEvent) {
    e.preventDefault();
    if (!id || !followupForm.dueDate) return;
    setError(null);
    try {
      await crmApi.logFollowup(id, followupForm.dueDate, followupForm.remarks || undefined, followupForm.nextAction || undefined);
      setFollowupForm({ dueDate: "", remarks: "", nextAction: "" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to log follow-up.");
    }
  }

  async function handleAddFile() {
    if (!id) return;
    const fileName = prompt("File name:");
    if (!fileName) return;
    await crmApi.addFile(id, fileName, `https://files.example.com/${encodeURIComponent(fileName)}`);
    await load();
  }

  async function handleDelete() {
    if (!id || !confirm("Delete this lead?")) return;
    await crmApi.remove(id);
    navigate("/admin/crm/leads");
  }

  if (!lead) return <p>Loading...</p>;

  // Parse additional contacts / visiting cards
  let extraContacts: { name: string; designation?: string; phone?: string; email?: string }[] = [];
  if (lead.contactPersons) {
    try {
      const parsed = JSON.parse(lead.contactPersons);
      if (Array.isArray(parsed)) {
        extraContacts = parsed;
      }
    } catch {
      const names = lead.contactPersons.split("|").map((n) => n.trim()).filter(Boolean);
      extraContacts = names.map((n) => ({ name: n, designation: "", phone: "", email: "" }));
    }
  }

  return (
    <div style={{ background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, color: "#222", margin: "0 0 4px 0" }}>
            {lead.contactName} <span style={{ fontFamily: "monospace", fontSize: 14, color: "#888" }}>({lead.leadCode})</span>
          </h1>
          <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
            {lead.companyName} · {lead.city}{lead.city && lead.country ? ", " : ""}{lead.country}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {canEdit && (
            <button
              type="button"
              onClick={() => navigate(`/admin/crm/leads/edit/${lead.id}`)}
              style={{
                backgroundColor: "#0284c7",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              ✏️ Edit Lead
            </button>
          )}
          <PermissionGate permission="crm.lead.delete">
            <button
              type="button"
              onClick={handleDelete}
              style={{
                color: "crimson",
                border: "1px solid #fca5a5",
                background: "#fff",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Delete Lead
            </button>
          </PermissionGate>
        </div>
      </div>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      {/* Visiting Cards & Contacts section */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 20, background: "#f8fafc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            📇 Visiting Cards & Contact Details ({1 + extraContacts.length})
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => navigate(`/admin/crm/leads/edit/${lead.id}`)}
              style={{
                background: "transparent",
                color: "#0284c7",
                border: "1px solid #0284c7",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ✏️ Manage Contacts
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {/* Contact 1 (Primary) */}
          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, padding: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 4 }}>
                Contact #1 (Primary)
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
              {lead.contactName || "—"}
            </div>
            {lead.phone && (
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>
                📞 <a href={`tel:${lead.phone}`} style={{ color: "#0284c7", textDecoration: "none" }}>{lead.phone}</a>
              </div>
            )}
            {lead.email && (
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>
                ✉️ <a href={`mailto:${lead.email}`} style={{ color: "#0284c7", textDecoration: "none" }}>{lead.email}</a>
              </div>
            )}
            {lead.preferredLanguage && (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                🌐 Language: <strong>{lead.preferredLanguage}</strong>
              </div>
            )}
          </div>

          {/* Additional Contacts / Visiting Cards */}
          {extraContacts.map((c, idx) => (
            <div key={idx} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, padding: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 4 }}>
                  Contact #{idx + 2} (Visiting Card)
                </span>
                {c.designation && (
                  <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>{c.designation}</span>
                )}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                {c.name || "—"}
              </div>
              {c.phone ? (
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>
                  📞 <a href={`tel:${c.phone}`} style={{ color: "#0284c7", textDecoration: "none" }}>{c.phone}</a>
                </div>
              ) : null}
              {c.email ? (
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>
                  ✉️ <a href={`mailto:${c.email}`} style={{ color: "#0284c7", textDecoration: "none" }}>{c.email}</a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Multiple addresses if present */}
      {lead.multipleAddresses && (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 20, background: "#f8fafc" }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "0 0 6px 0", textTransform: "uppercase" }}>
            📍 Registered / Additional Addresses
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#334155" }}>
            {lead.multipleAddresses.split(" | ").map((addr, idx) => (
              <li key={idx} style={{ marginBottom: 2 }}>{addr}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Pipeline</h3>
          <label style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Sales Stage
            <select value={lead.salesStage} onChange={(e) => handleFieldChange("salesStage", e.target.value)} style={{ ...inputStyle, display: "block", width: "100%", marginTop: 4 }}>
              {SALES_STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <p style={{ fontSize: 13 }}>Status: <strong style={{ textTransform: "capitalize" }}>{lead.status}</strong></p>
          <p style={{ fontSize: 13 }}>Priority: <strong style={{ textTransform: "capitalize" }}>{lead.priority}</strong></p>
        </div>

        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Forecast</h3>
          <p style={{ fontSize: 13 }}>Forecast Amount: <strong>{lead.forecastAmount ?? "—"}</strong></p>
          <p style={{ fontSize: 13 }}>Win Probability: <strong>{lead.winProbability !== null ? `${lead.winProbability}%` : "—"}</strong></p>
          <p style={{ fontSize: 13 }}>Weighted Forecast: <strong>{lead.weightedForecast ?? "—"}</strong> <span style={{ color: "#999", fontSize: 11 }}>(auto-computed)</span></p>
          <p style={{ fontSize: 13 }}>Expected Close: {lead.expectedCloseDate ?? "—"}</p>
        </div>

        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Ownership</h3>
          {canTransfer && (
            <label style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Assigned Merchant
              <select value={lead.assignedMerchantId ?? ""} onChange={(e) => handleAssign(e.target.value)} style={{ ...inputStyle, display: "block", width: "100%", marginTop: 4 }}>
                <option value="">— Unassigned —</option>
                {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          )}
          <p style={{ fontSize: 13 }}>Merchant: <strong>{lead.merchantName ?? "Unassigned"}</strong></p>
          <p style={{ fontSize: 13 }}>Created by: {lead.createdByName ?? "—"}</p>
          <p style={{ fontSize: 13 }}>Updated by: {lead.updatedByName ?? "—"}</p>
        </div>
      </div>

      <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16, marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Inquiry Details</h3>
        <p style={{ fontSize: 13 }}>{lead.inquiryDetails ?? "—"}</p>
        <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
          Source: {lead.leadSource.replace(/_/g, " ")}{lead.leadSource === 'trade_fair' && lead.tradeFairName ? ` (${lead.tradeFairName})` : ''} · Category: {lead.leadCategory.replace(/_/g, " ")} · Product: {lead.productCategory ?? "—"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Log a Follow-up</h3>
          <form onSubmit={handleLogFollowup}>
            <label style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Next Follow-up Due
              <input type="date" required value={followupForm.dueDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setFollowupForm({ ...followupForm, dueDate: e.target.value })} style={{ ...inputStyle, display: "block", width: "100%", marginTop: 4 }} />
            </label>
            <textarea placeholder="Remarks" value={followupForm.remarks} onChange={(e) => setFollowupForm({ ...followupForm, remarks: e.target.value })} rows={2} style={{ ...inputStyle, width: "100%", marginBottom: 8, boxSizing: "border-box" }} />
            <input placeholder="Next action" value={followupForm.nextAction} onChange={(e) => setFollowupForm({ ...followupForm, nextAction: e.target.value })} style={{ ...inputStyle, width: "100%", marginBottom: 8, boxSizing: "border-box" }} />
            <button type="submit">Log Follow-up</button>
          </form>

          <h4 style={{ fontSize: 12, color: "#888", marginTop: 16, marginBottom: 8 }}>History</h4>
          {lead.followups.map((f) => (
            <div key={f.id} style={{ fontSize: 12, padding: "6px 0", borderTop: "1px solid #f0f0f0" }}>
              <strong>{f.dueDate}</strong> {f.completedAt ? (f.onTime ? <span style={{ color: "#1a7f37" }}>✓ on time</span> : <span style={{ color: "#c0392b" }}>✗ late</span>) : <span style={{ color: "#999" }}>pending</span>}
              {f.remarks && <div style={{ color: "#666" }}>{f.remarks}</div>}
            </div>
          ))}
          {lead.followups.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>No follow-ups logged yet.</p>}
        </div>

        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ fontSize: 13, color: "#888" }}>Attachments</h3>
            <button onClick={handleAddFile}>+ Add</button>
          </div>
          {lead.files.map((f) => <div key={f.id} style={{ fontSize: 12, padding: "4px 0" }}>{f.fileName}</div>)}
          {lead.files.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>No attachments yet.</p>}
        </div>
      </div>
    </div>
  );
}
