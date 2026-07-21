import { useEffect, useState } from "react";
import { notificationApi, NotificationRecord } from "../api/notificationApi";

const priorityColors: Record<string, string> = { low: "#999", medium: "#4a90d9", high: "#e08e0b", urgent: "#c0392b" };
const statusColors: Record<string, string> = { pending: "#4a4a4a", actioned: "#1a7f37", dismissed: "#999" };

export default function NotificationCenterPage() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const pageSize = 20;

  async function load() {
    const res = await notificationApi.list({
      page, pageSize,
      module: moduleFilter || undefined,
      isRead: readFilter === "" ? undefined : readFilter === "true",
    });
    setItems(res.items);
    setTotal(res.totalItems);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs on filter/page changes only
  useEffect(() => { load(); }, [page, moduleFilter, readFilter]);

  async function handleMarkRead(id: string) {
    await notificationApi.markRead(id);
    await load();
  }

  async function handleDismiss(id: string) {
    await notificationApi.updateStatus(id, "dismissed");
    await load();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Notification Center</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }} style={{ padding: 6 }}>
          <option value="">All modules</option>
          <option value="office">Office</option><option value="factory">Factory</option><option value="crm">CRM</option>
          <option value="workflow">Workflow</option><option value="general">General</option>
        </select>
        <select value={readFilter} onChange={(e) => { setReadFilter(e.target.value); setPage(1); }} style={{ padding: 6 }}>
          <option value="">All</option>
          <option value="false">Unread only</option>
          <option value="true">Read only</option>
        </select>
      </div>

      {items.map((n) => (
        <div key={n.id} style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14, marginBottom: 8, background: n.isRead ? "#fff" : "#f7faff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong style={{ fontSize: 14 }}>{n.title}</strong>{" "}
              <span style={{ fontSize: 10, textTransform: "uppercase", color: "#999" }}>{n.module}</span>
              {n.escalationLevel > 1 && <span style={{ fontSize: 10, color: "#c0392b", fontWeight: 700, marginLeft: 6 }}>ESCALATED (L{n.escalationLevel})</span>}
              {n.description && <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>{n.description}</p>}
              <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>
                {new Date(n.createdAt).toLocaleString()}{n.dueDate && ` · Due ${n.dueDate}`}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={{ fontSize: 11, color: priorityColors[n.priority], fontWeight: 700, textTransform: "uppercase" }}>{n.priority}</span>
              <span style={{ fontSize: 11, color: statusColors[n.status], textTransform: "capitalize" }}>{n.status}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {!n.isRead && <button onClick={() => handleMarkRead(n.id)} style={{ fontSize: 11 }}>Mark Read</button>}
                {n.status === "pending" && <button onClick={() => handleDismiss(n.id)} style={{ fontSize: 11 }}>Dismiss</button>}
              </div>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p style={{ color: "#999", textAlign: "center", padding: 20 }}>No notifications.</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 13, color: "#777" }}>{total} total</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span style={{ fontSize: 13, padding: "4px 8px" }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
