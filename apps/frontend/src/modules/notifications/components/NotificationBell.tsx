import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationApi, NotificationRecord } from "../api/notificationApi";

const priorityColors: Record<string, string> = { low: "#999", medium: "#4a90d9", high: "#e08e0b", urgent: "#c0392b" };

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  async function refreshCount() {
    try { setCount(await notificationApi.unreadCount()); } catch { /* not logged in yet or transient error - ignore */ }
  }

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open) {
      const res = await notificationApi.list({ pageSize: 8, isRead: false });
      setItems(res.items);
    }
  }

  async function handleItemClick(n: NotificationRecord) {
    await notificationApi.markRead(n.id);
    setOpen(false);
    await refreshCount();
    if (n.actionUrl) navigate(n.actionUrl);
    else navigate("/admin/notifications");
  }

  async function handleMarkAllRead() {
    await notificationApi.markAllRead();
    setItems([]);
    await refreshCount();
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button onClick={handleOpen} style={{ position: "relative", background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
        🔔
        {count > 0 && (
          <span style={{ position: "absolute", top: -6, right: -6, background: "#c0392b", color: "#fff", borderRadius: 10, fontSize: 11, padding: "1px 6px", fontWeight: 700 }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "110%", width: 340, background: "#fff", border: "1px solid #ddd", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid #eee" }}>
            <strong style={{ fontSize: 13 }}>Notifications</strong>
            <button onClick={handleMarkAllRead} style={{ fontSize: 12, background: "none", border: "none", color: "#4a90d9", cursor: "pointer" }}>Mark all read</button>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {items.map((n) => (
              <div key={n.id} onClick={() => handleItemClick(n)} style={{ padding: "10px 12px", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 13 }}>{n.title}</strong>
                  <span style={{ fontSize: 10, color: priorityColors[n.priority], fontWeight: 700, textTransform: "uppercase" }}>{n.priority}</span>
                </div>
                {n.description && <p style={{ fontSize: 12, color: "#777", margin: "4px 0 0" }}>{n.description}</p>}
                <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {items.length === 0 && <p style={{ padding: 16, fontSize: 13, color: "#999", textAlign: "center" }}>You're all caught up.</p>}
          </div>
          <div style={{ padding: 10, textAlign: "center", borderTop: "1px solid #eee" }}>
            <button onClick={() => { setOpen(false); navigate("/admin/notifications"); }} style={{ fontSize: 12, background: "none", border: "none", color: "#4a90d9", cursor: "pointer" }}>
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
