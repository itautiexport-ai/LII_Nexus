import { FormEvent, useEffect, useState, useRef, useMemo } from "react";
import { delegationApi, DelegatedTaskRecord, DelegationPriority } from "../api/delegationApi";
import { factoryApi, DirectReport } from "../../../factory/api/factoryApi";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";
import { useTableFreeze } from "../../../../shared/hooks/useTableFreeze";
import { TableFreezeButton } from "../../../../shared/components/TableFreezeButton";
import { TableFreezeModal } from "../../../../shared/components/TableFreezeModal";
import { axiosInstance } from "../../../../services/api/axiosInstance";

type DisplayTask = DelegatedTaskRecord & { displayStatus: string };

const priorityColors: Record<DelegationPriority, string> = { low: "#999", medium: "#4a90d9", high: "#e08e0b", urgent: "#c0392b" };
const statusColors: Record<string, string> = { pending: "#999", running: "#4a90d9", completed: "#1a7f37", delayed: "#c0392b" };

export default function DelegationPage() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.roles.includes("System Admin");
  const [tab, setTab] = useState<"received" | "delegated">("delegated");
  const [currentEmployee, setCurrentEmployee] = useState<any | null>(null);
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

  // Extension Review State
  const [showExtensionReview, setShowExtensionReview] = useState(false);
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<DisplayTask | null>(null);

  const [showRequestExtensionModal, setShowRequestExtensionModal] = useState(false);
  const [extensionTaskId, setExtensionTaskId] = useState<string | null>(null);
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionRequestedDate, setExtensionRequestedDate] = useState("");
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);

  const availableColumns = useMemo(() => [
    { key: "select", label: "Select Checkbox", width: 44 },
    { key: "title", label: "Task Title", width: 220 },
    { key: "from", label: "From", width: 140 },
    { key: "assignedDate", label: "Assigned Date", width: 120 },
    { key: "assignedTo", label: "Assigned To", width: 140 },
    { key: "plannedDate", label: "Planned Date", width: 120 },
    { key: "priority", label: "Priority", width: 100 },
    { key: "status", label: "Status", width: 120 },
    { key: "extension", label: "Extension", width: 230 },
    { key: "files", label: "Files", width: 120 },
    { key: "actions", label: "Actions", width: 160 },
  ], []);

  const {
    settings: freezeSettings,
    isModalOpen: isFreezeModalOpen,
    effectiveFreezeCount,
    openModal: openFreezeModal,
    closeModal: closeFreezeModal,
    saveSettings: saveFreezeSettings,
    resetSettings: resetFreezeSettings,
    isSaving: isFreezeSaving,
    getContainerStyle,
    getStickyHeaderStyle,
    getStickyCellStyle,
  } = useTableFreeze({
    tableKey: "delegation_list",
    availableColumns,
    defaultSettings: {
      freezeColumns: 0,
      freezeHeader: true,
      tableMaxHeight: "72vh",
    },
  });

  // Pagination & Filtering States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  const [filterAssignedTo, setFilterAssignedTo] = useState("");
  const [filterAssignedDate, setFilterAssignedDate] = useState("");
  const [filterPlannedDate, setFilterPlannedDate] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function load(targetPage = page, targetPageSize = pageSize) {
    try {
      const [empRes, allTasksRes, reports] = await Promise.all([
        axiosInstance.get("/employees/me").catch(() => null),
        delegationApi.list({
          page: targetPage,
          pageSize: targetPageSize,
          scope: isAdmin ? "all" : undefined,
        }),
        factoryApi.myDirectReports(),
      ]);

      const me = empRes?.data?.data;
      setCurrentEmployee(me || null);

      const myEmpId = me?.id;
      const myUserId = user?.id;
      const myName = (me?.fullName || user?.fullName || "").trim().toLowerCase();

      const items = (allTasksRes.items as DisplayTask[]) || [];
      setTotalItems(allTasksRes.totalItems ?? items.length);

      // 1. Assigned to Me: strictly tasks where assigned_to matches current user/employee
      const assignedToMeList = items.filter(t => {
        const toId = (t as any).assignedTo;
        const toName = (t.assignedToName || "").trim().toLowerCase();
        return (myEmpId && toId === myEmpId) || (myUserId && toId === myUserId) || (myName && toName === myName);
      });

      // 2. Tasks Assigned by Me:
      // For Admin: all tasks assigned by admin / management (not assigned to admin)
      // For non-admin: tasks where assigned_by matches current user/employee
      const assignedByMeList = items.filter(t => {
        const byId = (t as any).assignedBy;
        const byName = (t.assignedByName || "").trim().toLowerCase();
        const isSelfAssignedToMe = (myEmpId && (t as any).assignedTo === myEmpId) ||
                                   (myUserId && (t as any).assignedTo === myUserId) ||
                                   (myName && (t.assignedToName || "").trim().toLowerCase() === myName);

        if (isAdmin) {
          return !isSelfAssignedToMe || (myEmpId && byId === myEmpId) || (myUserId && byId === myUserId) || (myName && byName === myName);
        }

        return (myEmpId && byId === myEmpId) || (myUserId && byId === myUserId) || (myName && byName === myName);
      });

      setReceived(assignedToMeList);
      setDelegated(assignedByMeList);
      setDirectReports(reports);
    } catch (err) {
      console.error("Failed to load delegations:", err);
    }
  }

  useEffect(() => {
    load(page, pageSize);
    const interval = setInterval(() => load(page, pageSize), 15000);
    return () => clearInterval(interval);
  }, [page, pageSize, isAdmin]);

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
    load(validPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    load(1, newSize);
  };

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

  function openRequestExtension(taskId: string) {
    setExtensionTaskId(taskId);
    setExtensionReason("");
    setExtensionRequestedDate("");
    setShowRequestExtensionModal(true);
  }

  async function handleRequestExtensionSubmit(e: FormEvent) {
    e.preventDefault();
    if (!extensionTaskId || !extensionReason || !extensionRequestedDate) return;
    try {
      setIsSubmittingExtension(true);
      await delegationApi.requestExtension(extensionTaskId, extensionReason, extensionRequestedDate);
      setShowRequestExtensionModal(false);
      alert("Extension requested successfully. Sent for review to the assigner.");
      await load();
    } catch (err: any) {
      console.error("Failed to request extension", err);
      alert(err?.response?.data?.error?.message || err?.response?.data?.message || "Failed to request extension");
    } finally {
      setIsSubmittingExtension(false);
    }
  }

  function openExtensionReview(task: DisplayTask, status: "approved" | "rejected") {
    setSelectedTaskForReview(task);
    setReviewTaskId(task.id);
    setReviewStatus(status);
    setRejectionReason("");
    setShowExtensionReview(true);
  }

  async function handleExtensionReviewSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reviewTaskId) return;
    if (reviewStatus === "rejected" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejecting the extension.");
      return;
    }
    try {
      await delegationApi.respondToExtension(reviewTaskId, reviewStatus, reviewStatus === "rejected" ? rejectionReason.trim() : undefined);
      setShowExtensionReview(false);
      alert(`Extension ${reviewStatus === "approved" ? "approved" : "rejected"} successfully.`);
      await load();
    } catch (err: any) {
      console.error("Failed to respond to extension", err);
      alert(err?.response?.data?.error?.message || err?.response?.data?.message || "Failed to respond to extension");
    }
  }

  const list = tab === "received" ? received : delegated;

  const filteredList = useMemo(() => {
    return list.filter((t) => {
      if (filterAssignedTo && !t.assignedToName?.toLowerCase().includes(filterAssignedTo.toLowerCase().trim())) {
        return false;
      }
      if (filterPriority && t.priority !== filterPriority) {
        return false;
      }
      if (filterStatus && t.displayStatus !== filterStatus) {
        return false;
      }
      if (filterAssignedDate) {
        const tDate = t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "";
        if (tDate !== filterAssignedDate) return false;
      }
      if (filterPlannedDate) {
        const dDate = t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "";
        if (dDate !== filterPlannedDate) return false;
      }
      return true;
    });
  }, [list, filterAssignedTo, filterPriority, filterStatus, filterAssignedDate, filterPlannedDate]);

  const hasActiveFilters = Boolean(filterAssignedTo || filterPriority || filterStatus || filterAssignedDate || filterPlannedDate);

  const clearFilters = () => {
    setFilterAssignedTo("");
    setFilterPriority("");
    setFilterStatus("");
    setFilterAssignedDate("");
    setFilterPlannedDate("");
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

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

      {/* Metrics Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Delegated</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{totalItems || list.length}</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending / Due Tasks</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>
            {list.filter(t => t.displayStatus === "pending" || t.displayStatus === "running").length}
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed Tasks</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginTop: 4 }}>
            {list.filter(t => t.displayStatus === "completed").length}
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Historical Delayed</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444", marginTop: 4 }}>
            {list.filter(t => t.displayStatus === "delayed").length}
          </div>
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
            <input required type="date" value={form.dueDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ padding: 6, flex: 1 }} />
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #ddd" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setTab("received"); setSelectedIds([]); }}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              borderBottom: tab === "received" ? "2px solid #4a90d9" : "2px solid transparent",
              fontWeight: tab === "received" ? 600 : 400,
              cursor: "pointer"
            }}
          >
            Assigned to Me ({received.length})
          </button>
          <button
            onClick={() => { setTab("delegated"); setSelectedIds([]); }}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              borderBottom: tab === "delegated" ? "2px solid #4a90d9" : "2px solid transparent",
              fontWeight: tab === "delegated" ? 600 : 400,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            Tasks Assigned by Me ({delegated.length})
            {delegated.some(t => t.extensionStatus === "pending") && (
              <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 6px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                Pending Review
              </span>
            )}
          </button>
        </div>
        <div style={{ paddingBottom: 6 }}>
          <TableFreezeButton
            onClick={openFreezeModal}
            effectiveFreezeCount={effectiveFreezeCount}
            isHeaderFrozen={freezeSettings.freezeHeader}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 150, flex: "1 1 150px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Assigned To</label>
          <input
            type="text"
            placeholder="Search assignee..."
            value={filterAssignedTo}
            onChange={(e) => setFilterAssignedTo(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, outline: "none", background: "#fff" }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, outline: "none", background: "#fff" }}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Assigned Date</label>
          <input
            type="date"
            value={filterAssignedDate}
            onChange={(e) => setFilterAssignedDate(e.target.value)}
            style={{ padding: "5px 8px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Planned Date</label>
          <input
            type="date"
            value={filterPlannedDate}
            onChange={(e) => setFilterPlannedDate(e.target.value)}
            style={{ padding: "5px 8px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, outline: "none" }}
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{ alignSelf: "flex-end", padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      <div style={getContainerStyle()}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: "1350px" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={getStickyHeaderStyle(0, { customStyle: { padding: 8, width: 44, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>
                {isAdmin && (
                  <input
                    type="checkbox"
                    checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredList.map(t => t.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                )}
              </th>
              <th style={getStickyHeaderStyle(1, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Task Title</th>
              <th style={getStickyHeaderStyle(2, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>From</th>
              <th style={getStickyHeaderStyle(3, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Assigned Date</th>
              <th style={getStickyHeaderStyle(4, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Assigned To</th>
              <th style={getStickyHeaderStyle(5, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Planned Date</th>
              <th style={getStickyHeaderStyle(6, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Priority</th>
              <th style={getStickyHeaderStyle(7, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Status</th>
              <th style={getStickyHeaderStyle(8, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Extension</th>
              <th style={getStickyHeaderStyle(9, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Files</th>
              <th style={getStickyHeaderStyle(10, { customStyle: { padding: 8, background: "#f8fafc", borderBottom: "1px solid #ddd" } })}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((t) => (
              <tr key={t.id}>
                <td style={getStickyCellStyle(0, { customStyle: { padding: 8, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>
                  {isAdmin && (
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
                  )}
                </td>
                <td style={getStickyCellStyle(1, { customStyle: { padding: 8, fontWeight: 600, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>{t.title}</td>
                <td style={getStickyCellStyle(2, { customStyle: { padding: 8, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>{t.assignedByName}</td>
                <td style={getStickyCellStyle(3, { customStyle: { padding: 8, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</td>
                <td style={getStickyCellStyle(4, { customStyle: { padding: 8, color: "#2563eb", fontWeight: 500, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>{t.assignedToName}</td>
                <td style={getStickyCellStyle(5, { customStyle: { padding: 8, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>{t.dueDate}</td>
                <td style={getStickyCellStyle(6, { customStyle: { padding: 8, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}><span style={{ color: priorityColors[t.priority], fontWeight: 600, textTransform: "capitalize" }}>{t.priority}</span></td>
                <td style={getStickyCellStyle(7, { customStyle: { padding: 8, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>
                  <span style={{ color: statusColors[t.displayStatus], fontWeight: 600, textTransform: "capitalize" }}>{t.displayStatus}</span>
                </td>
                {/* Dedicated Extension Column */}
                <td style={getStickyCellStyle(8, { customStyle: { padding: "8px 10px", borderBottom: "1px solid #eee", backgroundColor: "#ffffff", verticalAlign: "middle" } })}>
                  {(() => {
                    const myEmpId = currentEmployee?.id;
                    const myUserId = user?.id;
                    const myFullName = (currentEmployee?.fullName || user?.fullName || "").trim().toLowerCase();
                    const taskAssignedBy = (t as any).assignedBy;
                    const taskAssignedByName = (t.assignedByName || "").trim().toLowerCase();
                    const isAssigner = (myEmpId && taskAssignedBy === myEmpId) ||
                                       (myUserId && taskAssignedBy === myUserId) ||
                                       (myFullName && taskAssignedByName === myFullName);
                    const canReview = isAssigner || isAdmin;

                    if (t.extensionStatus === "pending") {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", padding: "6px 8px", borderRadius: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", display: "flex", alignItems: "center", gap: 4 }}>
                              ⏳ Pending Review
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#78350f" }}>
                              New: {t.extensionRequestedDate ? new Date(t.extensionRequestedDate).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          {t.extensionReason && (
                            <div style={{ fontSize: 11, color: "#451a03", background: "#fef3c7", padding: "4px 6px", borderRadius: 4, wordBreak: "break-word" }}>
                              <strong>Reason:</strong> {t.extensionReason}
                            </div>
                          )}
                          {canReview ? (
                            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                              <button
                                onClick={() => openExtensionReview(t, "approved")}
                                title="Accept Extension"
                                style={{
                                  flex: 1,
                                  padding: "5px 8px",
                                  background: "#10b981",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 4
                                }}
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={() => openExtensionReview(t, "rejected")}
                                title="Reject Extension (Reason Required)"
                                style={{
                                  flex: 1,
                                  padding: "5px 8px",
                                  background: "#ef4444",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 4
                                }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          ) : (
                            <div style={{ fontSize: 10, color: "#92400e", fontStyle: "italic", textAlign: "center" }}>
                              Awaiting Delegator Review
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (t.extensionStatus === "approved") {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "4px 8px", borderRadius: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46", display: "flex", alignItems: "center", gap: 4 }}>
                            ✓ Extension Approved
                          </span>
                          {t.extensionRequestedDate && (
                            <span style={{ fontSize: 10, color: "#047857" }}>
                              Extended: {new Date(t.extensionRequestedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      );
                    }

                    if (t.extensionStatus === "rejected") {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#fef2f2", border: "1px solid #fecaca", padding: "4px 8px", borderRadius: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", display: "flex", alignItems: "center", gap: 4 }}>
                            ✕ Extension Rejected
                          </span>
                          {t.extensionRejectionReason && (
                            <span style={{ fontSize: 10, color: "#991b1b", wordBreak: "break-word" }}>
                              <strong>Reason:</strong> {t.extensionRejectionReason}
                            </span>
                          )}
                        </div>
                      );
                    }

                    const isAssignee = (myEmpId && (t as any).assignedTo === myEmpId) ||
                                       (myUserId && (t as any).assignedTo === myUserId) ||
                                       (myFullName && (t.assignedToName || "").trim().toLowerCase() === myFullName);

                    return (
                      <div>
                        {isAssignee && t.displayStatus !== "completed" ? (
                          <button
                            onClick={() => openRequestExtension(t.id)}
                            title="Request Extension"
                            style={{
                              padding: "3px 8px",
                              background: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fde68a",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            ⏱ Request Ext.
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td style={getStickyCellStyle(9, { customStyle: { padding: 8, fontSize: 12, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>
                  {t.files.length > 0
                    ? t.files.map((f, i) => (
                        <span key={f.id}>
                          <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>{f.fileName}</a>
                          {i < t.files.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : "—"}
                </td>
                <td style={getStickyCellStyle(10, { customStyle: { padding: 8, borderBottom: "1px solid #eee", backgroundColor: "#ffffff" } })}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {tab === "received" && t.displayStatus !== "completed" && (
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "start") handleStatusChange(t.id, "running");
                          if (val === "proof") handleAddProof(t.id);
                          if (val === "complete") handleStatusChange(t.id, "completed");
                          if (val === "extension") openRequestExtension(t.id);
                        }}
                        style={{ padding: 4 }}
                      >
                        <option value="">Select Action...</option>
                        {t.displayStatus === "pending" && <option value="start">Start</option>}
                        <option value="proof">Add Proof</option>
                        <option value="complete">Complete</option>
                        {t.extensionStatus !== "pending" && <option value="extension">Request Extension</option>}
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
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Delete task"
                        style={{ padding: "3px 10px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  {hasActiveFilters ? "No delegated tasks found matching the filter criteria." : "Nothing here."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "8px 4px", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b", fontSize: 13 }}>
          <span>
            Showing {totalItems > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalItems)} of {totalItems} total historical tasks
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => handlePageChange(1)}
            disabled={page <= 1}
            style={{
              padding: "5px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              background: page <= 1 ? "#f1f5f9" : "#fff",
              color: page <= 1 ? "#94a3b8" : "#1e293b",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 500
            }}
          >
            « First
          </button>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            style={{
              padding: "5px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              background: page <= 1 ? "#f1f5f9" : "#fff",
              color: page <= 1 ? "#94a3b8" : "#1e293b",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 500
            }}
          >
            ‹ Prev
          </button>
          <span style={{ fontSize: 13, color: "#334155", padding: "0 6px" }}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            style={{
              padding: "5px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              background: page >= totalPages ? "#f1f5f9" : "#fff",
              color: page >= totalPages ? "#94a3b8" : "#1e293b",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Next ›
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={page >= totalPages}
            style={{
              padding: "5px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              background: page >= totalPages ? "#f1f5f9" : "#fff",
              color: page >= totalPages ? "#94a3b8" : "#1e293b",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Last »
          </button>
        </div>
      </div>

      {/* Request Extension Modal */}
      {showRequestExtensionModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: "420px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Request Extension</h2>
            <form onSubmit={handleRequestExtensionSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "14px" }}>Reason for Extension <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea
                  required
                  rows={4}
                  value={extensionReason}
                  onChange={e => setExtensionReason(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                  placeholder="Explain why you need an extension..."
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "14px" }}>Proposed New Due Date <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="date"
                  required
                  value={extensionRequestedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setExtensionRequestedDate(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowRequestExtensionModal(false)}
                  disabled={isSubmittingExtension}
                  style={{ padding: "0.5rem 1rem", background: "#f3f4f6", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExtension}
                  style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                >
                  {isSubmittingExtension ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Extension Modal */}
      {showExtensionReview && selectedTaskForReview && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: "430px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "1rem", color: reviewStatus === "approved" ? "#065f46" : "#b91c1c" }}>
              {reviewStatus === "approved" ? "Approve Extension Request" : "Reject Extension Request"}
            </h2>
            <div style={{ marginBottom: "1.25rem", fontSize: "0.9rem", color: "#334155", background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 6px 0" }}><strong>Task:</strong> {selectedTaskForReview.title}</p>
              <p style={{ margin: "0 0 6px 0" }}><strong>Requested By:</strong> {selectedTaskForReview.assignedToName}</p>
              <p style={{ margin: "0 0 6px 0" }}><strong>Proposed New Date:</strong> {selectedTaskForReview.extensionRequestedDate ? new Date(selectedTaskForReview.extensionRequestedDate).toLocaleDateString() : "—"}</p>
              <p style={{ margin: 0 }}><strong>Reason for Extension:</strong> {selectedTaskForReview.extensionReason || "—"}</p>
            </div>
            <form onSubmit={handleExtensionReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviewStatus === "rejected" && (
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "14px", color: "#1e293b" }}>
                    Reason for Rejection <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }}
                    placeholder="Provide a reason for rejecting the extension request..."
                  />
                </div>
              )}
              {reviewStatus === "approved" && (
                <div style={{ fontSize: "0.9rem", color: "#065f46", background: "#d1fae5", padding: "10px", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
                  Approving this extension will automatically update the planned due date to <strong>{selectedTaskForReview.extensionRequestedDate ? new Date(selectedTaskForReview.extensionRequestedDate).toLocaleDateString() : ""}</strong>.
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowExtensionReview(false)}
                  style={{ padding: "0.5rem 1rem", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.5rem 1.25rem", background: reviewStatus === "approved" ? "#10b981" : "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                >
                  Confirm {reviewStatus === "approved" ? "Approval" : "Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Freeze Panes Modal */}
      <TableFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={closeFreezeModal}
        settings={freezeSettings}
        availableColumns={availableColumns}
        onSave={saveFreezeSettings}
        onReset={resetFreezeSettings}
        isSaving={isFreezeSaving}
      />
    </div>
  );
}
