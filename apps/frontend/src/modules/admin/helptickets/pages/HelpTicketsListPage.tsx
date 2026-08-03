import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { helpTicketsApi, HelpTicket } from "../api/helpTicketsApi";

type ViewMode = "all" | "assigned-to-me" | "assigned-by-me";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Open: { bg: "#fef3c7", color: "#92400e" },
  "In Progress": { bg: "#dbeafe", color: "#1e40af" },
  Resolved: { bg: "#d1fae5", color: "#065f46" },
  Closed: { bg: "#f3f4f6", color: "#6b7280" },
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  High: { bg: "#fee2e2", color: "#991b1b" },
  Medium: { bg: "#fef9c3", color: "#854d0e" },
  Low: { bg: "#dcfce7", color: "#166534" },
};

export default function HelpTicketsListPage({ mode }: { mode?: ViewMode }) {
  const location = useLocation();
  const resolvedMode: ViewMode = mode ?? (
    location.pathname.includes("assigned-to-me") ? "assigned-to-me" :
    location.pathname.includes("assigned-by-me") ? "assigned-by-me" : "all"
  );

  const [tickets, setTickets] = useState<HelpTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, [resolvedMode]);

  async function loadTickets() {
    setLoading(true);
    try {
      let data: HelpTicket[] = [];
      if (resolvedMode === "all") data = await helpTicketsApi.listAll();
      else if (resolvedMode === "assigned-to-me") data = await helpTicketsApi.listAssignedToMe();
      else if (resolvedMode === "assigned-by-me") data = await helpTicketsApi.listAssignedByMe();
      setTickets(data);
    } catch (e) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id);
    try {
      await helpTicketsApi.updateStatus(id, status);
      await loadTickets();
    } finally {
      setUpdatingId(null);
    }
  }

  const titles: Record<ViewMode, string> = {
    all: "All Help Tickets",
    "assigned-to-me": "Assigned To Me",
    "assigned-by-me": "Assigned By Me",
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{titles[resolvedMode]}</h2>
        <Link to="/admin/help-tickets/new" style={styles.addBtn}>+ Add New Ticket</Link>
      </div>

      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : tickets.length === 0 ? (
        <div style={styles.empty}>
          <p>No tickets found.</p>
          <Link to="/admin/help-tickets/new" style={styles.addBtn}>Create First Ticket</Link>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Problem Solver</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Planned Date</th>
                <th style={styles.th}>Created By</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => {
                const sBadge = STATUS_COLORS[t.status] ?? { bg: "#f3f4f6", color: "#374151" };
                const pBadge = PRIORITY_COLORS[t.priority] ?? { bg: "#f3f4f6", color: "#374151" };
                return (
                  <tr key={t.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: "#111827" }}>{t.subject}</td>
                    <td style={styles.td}>{t.problemSolverName || t.problemSolverId}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: pBadge.bg, color: pBadge.color }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={styles.td}>{t.plannedDate || "—"}</td>
                    <td style={styles.td}>{t.createdByName || t.createdBy}</td>
                    <td style={styles.td}>
                      <select
                        value={t.status}
                        disabled={updatingId === t.id}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        style={{ ...styles.statusSelect, background: sBadge.bg, color: sBadge.color }}
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                        <option>Closed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "28px 24px",
    minHeight: "100vh",
    background: "#f0f2f5",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  addBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "9px 18px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },
  loading: {
    color: "#6b7280",
    fontSize: 14,
  },
  empty: {
    textAlign: "center" as const,
    padding: 60,
    background: "#fff",
    borderRadius: 8,
    color: "#6b7280",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 16,
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: 8,
    overflow: "auto",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  thead: {
    background: "#f8fafc",
    borderBottom: "2px solid #e5e7eb",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    fontWeight: 700,
    color: "#374151",
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap" as const,
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.1s",
  },
  td: {
    padding: "12px 16px",
    color: "#4b5563",
    verticalAlign: "middle" as const,
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  statusSelect: {
    border: "none",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
    fontFamily: "inherit",
  },
};
