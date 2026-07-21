import { FormEvent, useEffect, useState, useRef } from "react";
import { delegationApi, DelegatedTaskRecord, DelegationPriority } from "../api/delegationApi";
import { factoryApi, DirectReport } from "../../../factory/api/factoryApi";

type DisplayTask = DelegatedTaskRecord & { displayStatus: string };

const priorityColors: Record<DelegationPriority, string> = { low: "#999", medium: "#4a90d9", high: "#e08e0b", urgent: "#c0392b" };
const statusColors: Record<string, string> = { pending: "#999", running: "#4a90d9", completed: "#1a7f37", delayed: "#c0392b" };

export default function DelegationPage() {
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

  async function load() {
    const [receivedRes, delegatedRes, reports] = await Promise.all([
      delegationApi.list({}),
      delegationApi.listIDelegated(),
      factoryApi.myDirectReports(),
    ]);
    setReceived(receivedRes.items as DisplayTask[]);
    setDelegated(delegatedRes as DisplayTask[]);
    setDirectReports(reports);
  }
  useEffect(() => { 
    load(); 
    const interval = setInterval(load, 10000);
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
      const fileUrl = `https://files.example.com/${encodeURIComponent(file.name)}`;
      try {
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

  const list = tab === "received" ? received : delegated;

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
          {selectedIds.length > 0 && (
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
        <button onClick={() => { setTab("received"); setSelectedIds([]); }} style={{ padding: "8px 16px", border: "none", background: "none", borderBottom: tab === "received" ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: tab === "received" ? 600 : 400 }}>Assigned to Me</button>
        <button onClick={() => { setTab("delegated"); setSelectedIds([]); }} style={{ padding: "8px 16px", border: "none", background: "none", borderBottom: tab === "delegated" ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: tab === "delegated" ? 600 : 400 }}>Tasks I Delegated</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8, width: 30 }}>
                <input 
                  type="checkbox" 
                  checked={list.length > 0 && selectedIds.length === list.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(list.map(t => t.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </th>
            <th style={{ padding: 8 }}>Task Title</th>
            <th style={{ padding: 8 }}>From</th>
            <th style={{ padding: 8 }}>Assigned To</th>
            <th style={{ padding: 8 }}>Planned Date</th>
            <th style={{ padding: 8 }}>Priority</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Files</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, t.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== t.id));
                      }
                    }}
                  />
                </td>
              <td style={{ padding: 8, fontWeight: 600 }}>{t.title}</td>
              <td style={{ padding: 8 }}>{t.assignedByName}</td>
              <td style={{ padding: 8, color: "#2563eb", fontWeight: 500 }}>{t.assignedToName}</td>
              <td style={{ padding: 8 }}>{t.dueDate}</td>
              <td style={{ padding: 8 }}><span style={{ color: priorityColors[t.priority], fontWeight: 600, textTransform: "capitalize" }}>{t.priority}</span></td>
              <td style={{ padding: 8 }}><span style={{ color: statusColors[t.displayStatus], fontWeight: 600 }}>{t.displayStatus}</span></td>
              <td style={{ padding: 8, fontSize: 12 }}>{t.files.map((f) => f.fileName).join(", ") || "—"}</td>
              <td style={{ padding: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {tab === "received" && t.displayStatus !== "completed" && (
                    <select 
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "start") handleStatusChange(t.id, "running");
                        if (val === "proof") handleAddProof(t.id);
                        if (val === "complete") handleStatusChange(t.id, "completed");
                      }}
                      style={{ padding: 4 }}
                    >
                      <option value="">Select Action...</option>
                      {t.displayStatus === "pending" && <option value="start">Start</option>}
                      <option value="proof">Add Proof</option>
                      <option value="complete">Complete</option>
                    </select>
                  )}
                  {tab === "delegated" && t.displayStatus === "delayed" && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <select value={escalateDrafts[t.id] ?? ""} onChange={(e) => setEscalateDrafts({ ...escalateDrafts, [t.id]: e.target.value })} style={{ padding: 4 }}>
                        <option value="">Escalate to...</option>
                        {directReports.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                      </select>
                      <button onClick={() => handleEscalate(t.id)}>Escalate</button>
                    </div>
                  )}
                  {tab === "delegated" && t.displayStatus !== "completed" && (
                    <button
                      onClick={() => handleWhatsAppReminder(t.id)}
                      title="Send WhatsApp Reminder"
                      style={{ padding: "3px 10px", background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                    >
                      📱 WhatsApp
                    </button>
                  )}
                  {t.escalatedToName && <div style={{ fontSize: 11, color: "#c0392b" }}>Escalated to {t.escalatedToName}</div>}
                  <button
                    onClick={() => handleDelete(t.id)}
                    title="Delete task"
                    style={{ padding: "3px 10px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={8} style={{ padding: 16, textAlign: "center", color: "#777" }}>Nothing here.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
