import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { factoryEntriesApi, FactoryEntryRecord } from "../api/factoryEntriesApi";
import PermissionGate from "../../../shared/guards/PermissionGate";
import { useHasPermission } from "../../auth/hooks/usePermissions";

const statusColors: Record<string, string> = { submitted: "#e08e0b", approved: "#1a7f37", rejected: "#c0392b" };

export default function FactoryEntriesPage() {
  const canApprove = useHasPermission("factoryentry.approve");
  const [view, setView] = useState<"reports" | "queue">(canApprove ? "queue" : "reports");
  const [entries, setEntries] = useState<FactoryEntryRecord[]>([]);
  const [rejectDrafts, setRejectDrafts] = useState<Record<string, string>>({});

  async function load() {
    const res = await factoryEntriesApi.list(view === "queue" ? { forWork: true, status: "submitted" } : {});
    setEntries(res.items);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the view toggle changes
  useEffect(() => { load(); }, [view]);

  async function handleApprove(id: string) {
    await factoryEntriesApi.approve(id);
    await load();
  }

  async function handleReject(id: string) {
    const reason = rejectDrafts[id];
    if (!reason) return;
    await factoryEntriesApi.reject(id, reason);
    await load();
  }

  async function handleAddPhoto(id: string) {
    const fileName = prompt("Photo file name:");
    if (!fileName) return;
    await factoryEntriesApi.addFile(id, "photo", fileName, `https://files.example.com/${encodeURIComponent(fileName)}`);
    await load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Factory Production Entries</h1>
        <Link to="/admin/factory-entries/new"><button>+ New Entry</button></Link>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #ddd" }}>
        <PermissionGate permission="factoryentry.approve">
          <button onClick={() => setView("queue")} style={{ padding: "8px 16px", border: "none", background: "none", borderBottom: view === "queue" ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: view === "queue" ? 600 : 400 }}>Pending Approval</button>
        </PermissionGate>
        <button onClick={() => setView("reports")} style={{ padding: "8px 16px", border: "none", background: "none", borderBottom: view === "reports" ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: view === "reports" ? 600 : 400 }}>Reports (Approved)</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Department</th>
              <th style={{ padding: 8 }}>SKU / Component</th>
              <th style={{ padding: 8 }}>Target</th>
              <th style={{ padding: 8 }}>Actual</th>
              <th style={{ padding: 8 }}>Delay</th>
              <th style={{ padding: 8 }}>Rejection</th>
              <th style={{ padding: 8 }}>Supervisor</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{e.entryDate}</td>
                <td style={{ padding: 8 }}>{e.departmentName}</td>
                <td style={{ padding: 8 }}>{e.skuCode ?? e.componentName}</td>
                <td style={{ padding: 8 }}>{e.targetQty ?? "—"}</td>
                <td style={{ padding: 8 }}>{e.actualQty ?? "—"}</td>
                <td style={{ padding: 8 }}>{e.delayMinutes}m</td>
                <td style={{ padding: 8 }}>{e.rejectionQty}</td>
                <td style={{ padding: 8 }}>{e.supervisorName}</td>
                <td style={{ padding: 8 }}><span style={{ color: statusColors[e.status], fontWeight: 600 }}>{e.status}</span></td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button onClick={() => handleAddPhoto(e.id)}>Photo</button>
                    {view === "queue" && e.status === "submitted" && (
                      <>
                        <button onClick={() => handleApprove(e.id)}>Approve</button>
                        <input placeholder="Reason" style={{ width: 90, padding: 4 }} value={rejectDrafts[e.id] ?? ""} onChange={(ev) => setRejectDrafts({ ...rejectDrafts, [e.id]: ev.target.value })} />
                        <button onClick={() => handleReject(e.id)}>Reject</button>
                      </>
                    )}
                  </div>
                  {e.rejectionReason && <div style={{ fontSize: 11, color: "#c0392b" }}>{e.rejectionReason}</div>}
                </td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={10} style={{ padding: 16, textAlign: "center", color: "#777" }}>No entries.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
