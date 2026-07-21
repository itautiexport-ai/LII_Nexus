import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmApi, LeadRecord } from "../api/crmApi";
import { merchantsApi, MerchantRecord } from "../../admin/masterdata/api/merchantsApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const statusColors: Record<string, string> = { active: "#4a4a4a", won: "#1a7f37", lost: "#c0392b", dead: "#999", dormant: "#b8860b" };
const priorityColors: Record<string, string> = { low: "#999", medium: "#4a90d9", high: "#e08e0b", urgent: "#c0392b" };

export default function LeadsListPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<LeadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [leadCategory, setLeadCategory] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [transferLeadId, setTransferLeadId] = useState<string | null>(null);
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const pageSize = 15;

  async function load() {
    const res = await crmApi.list({
      page: String(page), pageSize: String(pageSize), search: search || undefined,
      status: status || undefined, leadSource: leadSource || undefined, leadCategory: leadCategory || undefined,
      overdueOnly: overdueOnly || undefined,
    });
    setItems(res.items);
    setTotal(res.totalItems);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs on filter/page changes only, `load` itself is stable
  useEffect(() => { load(); }, [page, search, status, leadSource, leadCategory, overdueOnly]);

  useEffect(() => {
    merchantsApi.list().then(setMerchants).catch(console.error);
  }, []);

  async function handleTransfer() {
    if (!transferLeadId) return;
    try {
      await crmApi.assign(transferLeadId, selectedMerchantId || null);
      setTransferLeadId(null);
      setSelectedMerchantId("");
      await load();
    } catch (err: any) {
      alert("Failed to transfer lead.");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMessage(null);
    try {
      const result = await crmApi.importExcel(file);
      setImportMessage(`Imported ${result.imported} lead(s) successfully.`);
      await load();
    } catch (err: any) {
      const details = err?.response?.data?.error?.details;
      setImportMessage(err?.response?.data?.error?.message + (details ? `: ${details.join("; ")}` : ""));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>, leadId: string) {
    e.stopPropagation();
    try {
      await crmApi.update(leadId, { status: e.target.value });
      await load();
    } catch (err: any) {
      alert("Failed to update status.");
    }
  }

  return (
    <div style={{ background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 20, color: "#222" }}>CRM — Leads</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <PermissionGate permission="crm.lead.export">
            <button onClick={() => crmApi.exportExcel()}>Export to Excel</button>
          </PermissionGate>

        </div>
      </div>

      {importMessage && <p style={{ fontSize: 13, color: importMessage.includes("Imported") ? "#1a7f37" : "#c0392b", marginBottom: 12 }}>{importMessage}</p>}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="Search name, company, code, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ padding: 6, minWidth: 240, border: "1px solid #ccc", borderRadius: 4 }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ padding: 6, border: "1px solid #ccc", borderRadius: 4 }}>
          <option value="">All statuses</option>
          <option value="active">Active</option><option value="won">Won</option><option value="lost">Lost</option><option value="dead">Dead</option><option value="dormant">Dormant</option>
        </select>
        <select value={leadSource} onChange={(e) => { setLeadSource(e.target.value); setPage(1); }} style={{ padding: 6, border: "1px solid #ccc", borderRadius: 4 }}>
          <option value="">All sources</option>
          <option value="trade_fair">Trade Fair</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option>
          <option value="website">Website</option><option value="referral">Referral</option><option value="other">Other</option>
        </select>
        <select value={leadCategory} onChange={(e) => { setLeadCategory(e.target.value); setPage(1); }} style={{ padding: 6, border: "1px solid #ccc", borderRadius: 4 }}>
          <option value="">All categories</option>
          <option value="export">Export</option><option value="domestic">Domestic</option>
          <option value="hotel_restaurant_project">Hotel/Restaurant/Project</option>
          <option value="buyer_agent">Buyer Agent</option><option value="repeat_customer">Repeat Customer</option>
        </select>
        <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }} /> Overdue only
        </label>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e0e0e0", borderRadius: 6 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#f7f7f8", borderBottom: "1px solid #e0e0e0" }}>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Lead ID / Date</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Customer Name</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Company</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Country / City</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Contact Info</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Source / Category</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Financials</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Stage & Merchant</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Next Follow-up</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Priority</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Notes</th>
              <th style={{ padding: 10, fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((lead) => (
              <tr key={lead.id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}>
                <td style={{ padding: 10, fontSize: 13, fontFamily: "monospace" }}>{lead.leadCode}<br /><span style={{ color: "#888", fontSize: 11 }}>{lead.inquiryDate}</span></td>
                <td style={{ padding: 10, fontSize: 13, whiteSpace: "nowrap" }}>
                  <strong>{lead.contactName}</strong>
                  {lead.contactPersons && <div style={{ color: "#666", fontSize: 11 }}>Persons: {lead.contactPersons}</div>}
                </td>
                <td style={{ padding: 10, fontSize: 13 }}>{lead.companyName ?? "—"}</td>
                <td style={{ padding: 10, fontSize: 12, color: "#666" }}>
                  {lead.country ?? "—"} {lead.city && `/ ${lead.city}`}
                  {lead.multipleAddresses && <div style={{ fontSize: 10, color: "#888" }}>{lead.multipleAddresses}</div>}
                </td>
                <td style={{ padding: 10, fontSize: 12, color: "#555" }}>
                  <div>{lead.phone ?? "No Phone"}</div>
                  <div>{lead.email ?? "No Email"}</div>
                  {lead.preferredLanguage && <div>Lang: {lead.preferredLanguage}</div>}
                </td>
                <td style={{ padding: 10, fontSize: 12, color: "#666" }}>{lead.leadSource.replace(/_/g, " ")}<br />{lead.leadCategory.replace(/_/g, " ")}</td>
                <td style={{ padding: 10, fontSize: 12, color: "#555" }}>
                  {lead.currency && <span style={{ fontWeight: 600 }}>{lead.currency} </span>}
                  Forecast: {lead.weightedForecast !== null ? lead.weightedForecast.toLocaleString() : "—"}
                  {(lead.creditLimit !== null || lead.paymentTerms) && (
                    <div style={{ fontSize: 11, color: "#888" }}>
                      Credit: {lead.creditLimit ?? "—"} | Terms: {lead.paymentTerms ?? "—"}
                    </div>
                  )}
                </td>
                <td style={{ padding: 10, fontSize: 12 }}>
                  <div>{lead.salesStage.replace(/_/g, " ")}</div>
                  <div style={{ color: "#888", fontSize: 11 }}>{lead.merchantName ?? "Unassigned"}</div>
                  {['active', 'dormant'].includes(lead.status) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setTransferLeadId(lead.id); setSelectedMerchantId(lead.assignedMerchantId || ""); }}
                      style={{ marginTop: 4, padding: "2px 6px", fontSize: 10, borderRadius: 3, border: "1px solid #ccc", background: "#f0f0f0", cursor: "pointer" }}
                    >
                      Transfer
                    </button>
                  )}
                </td>
                <td style={{ padding: 10, fontSize: 13, color: lead.delayDays > 0 ? "#c0392b" : undefined }}>
                  {lead.nextFollowUpDate ?? "—"}{lead.delayDays > 0 && ` (${lead.delayDays}d late)`}
                </td>
                <td style={{ padding: 10 }}><span style={{ color: priorityColors[lead.priority], fontWeight: 600, fontSize: 12, textTransform: "capitalize" }}>{lead.priority}</span></td>
                <td style={{ padding: 10, fontSize: 11, color: "#666", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.inquiryDetails ?? ""}>
                  {lead.inquiryDetails ?? "—"}
                </td>
                <td style={{ padding: 10 }}>
                  <select 
                    value={lead.status} 
                    onClick={(e) => e.stopPropagation()} 
                    onChange={(e) => handleStatusChange(e, lead.id)}
                    style={{ padding: 4, borderRadius: 4, border: `1px solid ${statusColors[lead.status]}`, color: statusColors[lead.status], fontWeight: 600, fontSize: 12, textTransform: "capitalize", background: "transparent" }}
                  >
                    <option value="active">Active</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="dead">Dead</option>
                    <option value="dormant">Dormant</option>
                  </select>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={12} style={{ padding: 20, textAlign: "center", color: "#999" }}>No leads found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 13, color: "#777" }}>{total} total leads</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span style={{ fontSize: 13, padding: "4px 8px" }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      {transferLeadId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setTransferLeadId(null)}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 300 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Transfer Lead</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>Select Merchant</label>
              <select 
                value={selectedMerchantId} 
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              >
                <option value="">-- Unassigned --</option>
                {merchants.map(merchant => (
                  <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setTransferLeadId(null)} style={{ padding: "6px 12px", border: "1px solid #ccc", background: "#fff", borderRadius: 4, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleTransfer} style={{ padding: "6px 12px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
