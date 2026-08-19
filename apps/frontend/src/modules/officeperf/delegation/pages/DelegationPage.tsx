import { FormEvent, useEffect, useState, useRef } from "react";
import { delegationApi, DelegatedTaskRecord, DelegationPriority } from "../api/delegationApi";
import { factoryApi, DirectReport } from "../../../factory/api/factoryApi";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";
import { employeesApi } from "../../../admin/organization/employees/api/employeesApi";

type DisplayTask = DelegatedTaskRecord & { displayStatus: string };

const priorityColors: Record<DelegationPriority, string> = { low: "#999", medium: "#4a90d9", high: "#e08e0b", urgent: "#c0392b" };
const statusColors: Record<string, string> = { pending: "#999", running: "#4a90d9", completed: "#1a7f37", delayed: "#c0392b" };

export default function DelegationPage() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.roles.includes("System Admin");
  const [tab, setTab] = useState<"received" | "delegated">("received");
  const [received, setReceived] = useState<DisplayTask[]>([]);
  const [delegated, setDelegated] = useState<DisplayTask[]>([]);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", dueDate: "", priority: "medium" as DelegationPriority, remarks: "" });
  const [error, setError] = useState<string | null>(null);
  const [escalateDrafts, setEscalateDrafts] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofTaskId, setProofTaskId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("newest");

  // Extension Review State
  const [showExtensionReview, setShowExtensionReview] = useState(false);
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [extensionUpdatedDate, setExtensionUpdatedDate] = useState("");
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<DisplayTask | null>(null);

  const [receivedPage, setReceivedPage] = useState(1);
  const [delegatedPage, setDelegatedPage] = useState(1);
  const pageSize = 20;

  async function load() {
    const [receivedRes, delegatedRes, reports, meRes] = await Promise.all([
      delegationApi.list({ pageSize: 500 }), // Increase limit to ensure we get all relevant tasks
      delegationApi.listIDelegated(),
      factoryApi.myDirectReports(),
      employeesApi.getMe().catch(() => null),
    ]);
    
    let rItems = receivedRes.items as DisplayTask[];
    let dItems = delegatedRes as DisplayTask[];
    
    if (user && !user.roles.includes("System Admin")) {
      const myEmployeeId = meRes?.id;
      if (myEmployeeId) {
        rItems = rItems.filter(t => t.assignedTo === myEmployeeId || t.assignedBy === myEmployeeId);
        dItems = dItems.filter(t => t.assignedBy === myEmployeeId || t.assignedTo === myEmployeeId);
      } else {
        rItems = rItems.filter(t => t.assignedToName?.toLowerCase() === user.fullName?.toLowerCase() || t.assignedByName?.toLowerCase() === user.fullName?.toLowerCase());
        dItems = dItems.filter(t => t.assignedByName?.toLowerCase() === user.fullName?.toLowerCase() || t.assignedToName?.toLowerCase() === user.fullName?.toLowerCase());
      }
    }
    
    setReceived(rItems);
    setDelegated(dItems);
    setDirectReports(reports);
  }

  useEffect(() => { 
    load(); 
    const interval = setInterval(load, 30000); // reduced frequency to 30s for better performance
    return () => clearInterval(interval);
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await delegationApi.create(form);
      setForm({ title: "", description: "", assignedTo: "", dueDate: "", priority: "medium", remarks: "" });
      setShowCreate(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to delegate task.");
    }
  }

  async function handleStatusChange(id: string, status: "running" | "completed") {
    await delegationApi.updateStatus(id, status);
    await load();
  }

  async function handleEscalate(id: string) {
    const escalateTo = escalateDrafts[id];
    if (!escalateTo) return;
    await delegationApi.escalate(id, escalateTo);
    await load();
  }

  async function handleWhatsAppReminder(id: string) {
    try {
      await delegationApi.sendWhatsAppReminder(id);
      alert("WhatsApp reminder queued successfully!");
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? "Failed to send WhatsApp reminder.");
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && proofTaskId) {
      try {
        const { fileUrl } = await delegationApi.uploadFile(file);
        await delegationApi.addFile(proofTaskId, "proof", file.name, fileUrl);
        await load();
      } catch (err) {
        console.error("Failed to add proof", err);
        alert("Failed to add proof");
      }
    }
    setProofTaskId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleAddProof(id: string) {
    setProofTaskId(id);
    fileInputRef.current?.click();
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected delegation(s)?`)) return;
    try {
      await Promise.all(selectedIds.map(id => delegationApi.remove(id)));
      setSelectedIds([]);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete some delegations");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await delegationApi.remove(id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  }

  function openExtensionReview(task: DisplayTask, status: "approved" | "rejected") {
    setSelectedTaskForReview(task);
    setReviewTaskId(task.id);
    setReviewStatus(status);
    setRejectionReason("");
    setExtensionUpdatedDate("");
    setShowExtensionReview(true);
  }

  async function handleExtensionReviewSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reviewTaskId) return;
    try {
      await delegationApi.respondToExtension(
        reviewTaskId, 
        reviewStatus, 
        reviewStatus === "rejected" ? rejectionReason : undefined,
        reviewStatus === "approved" && extensionUpdatedDate ? extensionUpdatedDate : undefined
      );
      setShowExtensionReview(false);
      await load();
    } catch (err) {
      console.error("Failed to respond to extension", err);
      alert("Failed to respond to extension");
    }
  }

  let list = tab === "received" ? received : delegated;

  const uniqueUsers = Array.from(new Set(list.map(t => t.assignedToName))).filter(Boolean);

  if (statusFilter) list = list.filter(t => t.displayStatus === statusFilter);
  if (priorityFilter) list = list.filter(t => t.priority === priorityFilter);
  if (userFilter) list = list.filter(t => t.assignedToName === userFilter || t.assignedByName === userFilter);
  if (dateFilter) list = list.filter(t => t.dueDate === dateFilter);

  // Sorting
  list.sort((a, b) => {
    if (sortFilter === "a-z") {
      return a.title.localeCompare(b.title);
    } else if (sortFilter === "z-a") {
      return b.title.localeCompare(a.title);
    }
    // Newest first (default)
    return new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime();
  });

  const totalItems = list.length;
  const currentPage = tab === "received" ? receivedPage : delegatedPage;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedList = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage: number) => {
    if (tab === "received") setReceivedPage(newPage);
    else setDelegatedPage(newPage);
  };

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*" 
        onChange={handleFileChange} 
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Delegation</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} style={{ color: "#c0392b", border: "1px solid #c0392b", background: "transparent", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 6, marginBottom: 16, maxWidth: 480 }}>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }} />
          <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }} />
          <select required value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }}>
            <option value="">— Assign to a direct report —</option>
            {directReports.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ padding: 6, flex: 1 }} />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as DelegationPriority })} style={{ padding: 6, flex: 1 }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <textarea placeholder="Remarks (optional)" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginBottom: 8 }} />
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button type="submit">Delegate</button>
        </form>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #ddd" }}>
        <button onClick={() => { setTab("received"); setSelectedIds([]); setUserFilter(""); setStatusFilter(""); setPriorityFilter(""); setReceivedPage(1); }} style={{ padding: "8px 16px", border: "none", background: "none", borderBottom: tab === "received" ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: tab === "received" ? 600 : 400 }}>Assigned to Me</button>
        <button onClick={() => { setTab("delegated"); setSelectedIds([]); setUserFilter(""); setStatusFilter(""); setPriorityFilter(""); setDelegatedPage(1); }} style={{ padding: "8px 16px", border: "none", background: "none", borderBottom: tab === "delegated" ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: tab === "delegated" ? 600 : 400 }}>Tasks I Delegated</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); handlePageChange(1); }} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc" }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
        </select>

        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); handlePageChange(1); }} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc" }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select value={userFilter} onChange={e => { setUserFilter(e.target.value); handlePageChange(1); }} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc" }}>
          <option value="">All Users</option>
          {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
        </select>

        <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); handlePageChange(1); }} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc" }} />

        <select value={sortFilter} onChange={e => { setSortFilter(e.target.value); handlePageChange(1); }} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc" }}>
          <option value="newest">Newest First</option>
          <option value="a-z">Alphabetical (A-Z)</option>
          <option value="z-a">Alphabetical (Z-A)</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left", borderBottom: "1px solid #eee" }}>
            {isAdmin && <th style={{ padding: 12, width: 40 }}><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? list.map(t => t.id) : [])} checked={list.length > 0 && selectedIds.length === list.length} /></th>}
            <th style={{ padding: 12 }}>Task Name</th>
            <th style={{ padding: 12 }}>Assign To</th>
            <th style={{ padding: 12 }}>Assign By</th>
            <th style={{ padding: 12 }}>Planned Date</th>
            <th style={{ padding: 12 }}>Priority</th>
            <th style={{ padding: 12 }}>Status</th>
            <th style={{ padding: 12 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedList.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
              {isAdmin && <td style={{ padding: 12 }}><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={(e) => { if (e.target.checked) setSelectedIds([...selectedIds, t.id]); else setSelectedIds(selectedIds.filter(id => id !== t.id)); }} /></td>}
              <td style={{ padding: 12, maxWidth: 200 }}>
                <div style={{ fontWeight: 600, color: "#111" }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#666", whiteSpace: "pre-wrap" }}>{t.description}</div>
                {t.remarks && <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>Remarks: {t.remarks}</div>}
              </td>
              <td style={{ padding: 12 }}>{t.assignedToName}</td>
              <td style={{ padding: 12 }}>{t.assignedByName}</td>
              <td style={{ padding: 12, color: new Date(t.dueDate) < new Date(new Date().toDateString()) && t.displayStatus !== "completed" ? "crimson" : "inherit" }}>{t.dueDate}</td>
              <td style={{ padding: 12 }}><span style={{ color: "white", background: priorityColors[t.priority], padding: "2px 6px", borderRadius: 4, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>{t.priority}</span></td>
              <td style={{ padding: 12 }}>
                <div style={{ color: statusColors[t.displayStatus], fontWeight: 600, textTransform: "capitalize" }}>{t.displayStatus}</div>
                {t.displayStatus === "delayed" && <div style={{ fontSize: 11, color: "crimson", marginTop: 4, fontWeight: 600 }}>DELAYED</div>}
              </td>
              <td style={{ padding: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <select
                    value={t.displayStatus === "delayed" ? "running" : t.displayStatus}
                    onChange={(e) => handleStatusChange(t.id, e.target.value as any)}
                    disabled={t.displayStatus === "completed" || tab === "delegated"}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: `1px solid ${statusColors[t.displayStatus]}`,
                      color: statusColors[t.displayStatus],
                      fontWeight: 600,
                      fontSize: 12,
                      outline: "none",
                      background: `${statusColors[t.displayStatus]}15`, // Light transparent background
                      cursor: t.displayStatus === "completed" || tab === "delegated" ? "not-allowed" : "pointer",
                      width: "100%",
                      maxWidth: "140px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    <option value="pending">Start (Pending)</option>
                    <option value="running">In Progress</option>
                    <option value="completed">Complete</option>
                  </select>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {t.files?.map(f => (
                      <a key={f.id} href={f.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: f.kind === "proof" ? "#059669" : "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, background: "#f8fafc", padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                        {f.kind === "proof" ? "✅" : "📎"} <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: 100 }}>{f.fileName}</span>
                      </a>
                    ))}
                    {t.displayStatus !== "completed" && tab === "received" && (
                      <button 
                        onClick={() => { setProofTaskId(t.id); fileInputRef.current?.click(); }} 
                        style={{ background: "#fff", border: "1px dashed #94a3b8", padding: "4px 8px", fontSize: 11, cursor: "pointer", color: "#475569", borderRadius: 4, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, justifyContent: "center", transition: "all 0.2s" }}
                        onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"}
                        onMouseOut={e => e.currentTarget.style.background = "#fff"}
                      >
                        <span style={{ fontSize: 12 }}>+</span> Add Attachments
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
                  {tab === "received" && t.displayStatus !== "completed" && (
                    <div style={{ display: "flex", gap: 0, borderRadius: 4, overflow: "hidden", border: "1px solid #cbd5e1", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                      <select value={escalateDrafts[t.id] ?? ""} onChange={(e) => setEscalateDrafts({ ...escalateDrafts, [t.id]: e.target.value })} style={{ padding: "2px 6px", border: "none", borderRight: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 11, outline: "none", color: "#334155" }}>
                        <option value="">Escalate to...</option>
                        {directReports.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                      </select>
                      <button onClick={() => handleEscalate(t.id)} style={{ padding: "2px 8px", background: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#2563eb" }} onMouseOver={e => e.currentTarget.style.background = "#eff6ff"} onMouseOut={e => e.currentTarget.style.background = "#fff"}>
                        Go
                      </button>
                    </div>
                  )}
                  {tab === "delegated" && t.displayStatus !== "completed" && (
                    <button onClick={() => handleWhatsAppReminder(t.id)} title="Send WhatsApp Reminder" style={{ padding: "4px", background: "#d1fae5", border: "1px solid #34d399", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#059669"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                  )}
                  {t.extensionStatus === "pending" && (
                    <button onClick={() => openExtensionReview(t, "approved")} style={{ padding: "4px 8px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#b45309", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Review Extension</button>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(t.id)} title="Delete" style={{ padding: "4px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  )}
                </div>
              </div>
              </td>
            </tr>
          ))}
          {paginatedList.length === 0 && <tr><td colSpan={8} style={{ padding: 16, textAlign: "center", color: "#777" }}>Nothing here.</td></tr>}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "8px 16px", background: "#f9fafb", border: "1px solid #eee", borderRadius: 6 }}>
          <div style={{ fontSize: 14, color: "#666" }}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} tasks
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ padding: "6px 12px", border: "1px solid #ccc", background: currentPage === 1 ? "#eee" : "#fff", borderRadius: 4, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Page {currentPage} of {totalPages}</span>
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ padding: "6px 12px", border: "1px solid #ccc", background: currentPage === totalPages ? "#eee" : "#fff", borderRadius: 4, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showExtensionReview && selectedTaskForReview && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: "400px", maxWidth: "90%" }}>
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>
              {reviewStatus === "approved" ? "Approve Extension" : "Reject Extension"}
            </h2>
            <div style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#444" }}>
              <p><strong>Task:</strong> {selectedTaskForReview.title}</p>
              <p><strong>Reason:</strong> {selectedTaskForReview.extensionReason}</p>
              <p><strong>Proposed Date:</strong> {selectedTaskForReview.extensionRequestedDate}</p>
            </div>
            <form onSubmit={handleExtensionReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviewStatus === "rejected" && (
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Rejection Reason</label>
                  <textarea 
                    required
                    rows={4}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
                    placeholder="Provide a reason for rejection..."
                  />
                </div>
              )}
              {reviewStatus === "approved" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p style={{ fontSize: "0.9rem", color: "#065f46", background: "#d1fae5", padding: "0.5rem", borderRadius: "4px", margin: 0 }}>
                    Leave the date below blank to approve the requested date ({selectedTaskForReview.extensionRequestedDate}), or select a new date to override it.
                  </p>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold", fontSize: "0.9rem" }}>New Due Date (Optional)</label>
                    <input 
                      type="date" 
                      value={extensionUpdatedDate}
                      onChange={e => setExtensionUpdatedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
                    />
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setShowExtensionReview(false)}
                  style={{ padding: "0.5rem 1rem", background: "#f3f4f6", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: "0.5rem 1rem", background: reviewStatus === "approved" ? "#10b981" : "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Confirm {reviewStatus === "approved" ? "Approval" : "Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
