import { useEffect, useState } from "react";
import { checklistApi, ChecklistInstanceRecord } from "../api/checklistApi";
import { standaloneChecklistApi, StandaloneChecklist } from "../../../checklist/api/checklistApi";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";

export default function MyChecklistPage() {
  const [instances, setInstances] = useState<ChecklistInstanceRecord[]>([]);
  const [standaloneList, setStandaloneList] = useState<StandaloneChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "pipeline">("active");

  const user = useAuthStore((state: any) => state.user);

  async function load() {
    try {
      const [officeChecklists, allStandalone, myEmployee] = await Promise.all([
        checklistApi.getMyChecklists().catch(() => []),
        standaloneChecklistApi.getAll().catch(() => []),
        import("../../../admin/organization/employees/api/employeesApi").then(m => m.employeesApi.getMe()).catch(() => null)
      ]);

      setInstances(officeChecklists || []);

      // Filter standalone checklists assigned to current user
      if (user) {
        const filtered = (allStandalone || []).filter((c: any) =>
          c.assignTo === user.id ||
          c.assignee_name === user.fullName ||
          c.assignBy === user.id ||
          c.assignedBy === user.id ||
          (myEmployee && (c.assignTo === myEmployee.id || c.assignedBy === myEmployee.id || c.assignBy === myEmployee.id))
        );
        setStandaloneList(filtered);
      } else {
        setStandaloneList(allStandalone || []);
      }
    } catch (err) {
      console.error("Failed to load checklists:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user]);

  async function handleToggle(instance: ChecklistInstanceRecord, itemId: string, checked: boolean) {
    const updated = await checklistApi.setItemChecked(instance.id, itemId, checked);
    setInstances((prev) => prev.map((i) => (i.id === instance.id ? updated : i)));
  }

  async function handleComplete(id: string) {
    if (confirm("Are you sure you want to complete this checklist?")) {
      try {
        await standaloneChecklistApi.complete(id);
        load();
      } catch (err) {
        console.error("Failed to complete", err);
        alert("Failed to complete checklist");
      }
    }
  }

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  // Categorize Standalone Checklists
  const activeStandalone = standaloneList.filter(c => {
    const pDate = new Date(c.plannedDate);
    return pDate <= now || isSameDay(pDate, now);
  });

  const pipelineStandalone = standaloneList.filter(c => {
    const pDate = new Date(c.plannedDate);
    // Strict pipeline rule: Only show if planned date is in the future AND within 7 days
    return pDate > now && !isSameDay(pDate, now) && pDate <= sevenDaysFromNow;
  });

  function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  if (loading) return <div style={{ padding: 24, color: "#64748b" }}>Loading checklists...</div>;

  return (
    <div style={{ maxWidth: 1600, width: "100%", margin: "0 auto", padding: "16px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
          My Checklists
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Manage your daily active checklists and track upcoming tasks in pipeline.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 12, borderBottom: "2px solid #e2e8f0", marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: activeTab === "active" ? 700 : 500,
            color: activeTab === "active" ? "#2563eb" : "#64748b",
            borderBottom: activeTab === "active" ? "3px solid #2563eb" : "3px solid transparent",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: -2,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          Active Checklists
          <span style={{
            background: activeTab === "active" ? "#dbeafe" : "#f1f5f9",
            color: activeTab === "active" ? "#1e40af" : "#475569",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700
          }}>
            {instances.length + activeStandalone.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pipeline")}
          style={{
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: activeTab === "pipeline" ? 700 : 500,
            color: activeTab === "pipeline" ? "#2563eb" : "#64748b",
            borderBottom: activeTab === "pipeline" ? "3px solid #2563eb" : "3px solid transparent",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: -2,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          Checklists in Pipeline (Next 7 Days)
          <span style={{
            background: activeTab === "pipeline" ? "#dbeafe" : "#f1f5f9",
            color: activeTab === "pipeline" ? "#1e40af" : "#475569",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700
          }}>
            {pipelineStandalone.length}
          </span>
        </button>
      </div>

      {/* ACTIVE TAB CONTENT */}
      {activeTab === "active" && (
        <div>
          {instances.length === 0 && activeStandalone.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>No active checklists due right now.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {/* Standalone Active Tasks */}
              {activeStandalone.map((item) => (
                <div key={item.id} style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>{item.taskName}</h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>By: {item.assigner_name || "Manager"}</p>
                    </div>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      background: item.priority === 'High' ? '#fee2e2' : item.priority === 'Medium' ? '#fef3c7' : '#f1f5f9',
                      color: item.priority === 'High' ? '#991b1b' : item.priority === 'Medium' ? '#92400e' : '#475569'
                    }}>
                      {item.priority} Priority
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div>📅 <strong>Planned:</strong> {new Date(item.plannedDate).toLocaleString()}</div>
                    <div>🔄 <strong>Frequency:</strong> {item.frequency}</div>
                    {item.whenRule && <div>📌 <strong>Schedule:</strong> {item.whenRule}</div>}
                  </div>

                  <div style={{ paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>● Active for Execution</span>
                    <button
                      onClick={() => handleComplete(item.id)}
                      style={{ background: "#10b981", color: "white", border: "none", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}

              {/* Office Performance Instances */}
              {instances.map((instance) => {
                const doneCount = instance.items.filter((i) => i.isChecked).length;
                return (
                  <div key={instance.id} style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <strong style={{ fontSize: 16, color: "#0f172a" }}>{instance.templateTitle}</strong>
                      <span style={{ fontSize: 11, textTransform: "uppercase", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                        {instance.frequency}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                      {instance.periodStart} – {instance.periodEnd} · <strong>{doneCount}/{instance.items.length}</strong> done
                    </p>
                    {instance.items.map((item) => (
                      <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8, cursor: "pointer", color: "#334155" }}>
                        <input type="checkbox" checked={item.isChecked} onChange={(e) => handleToggle(instance, item.id, e.target.checked)} />
                        <span style={{ textDecoration: item.isChecked ? "line-through" : "none" }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PIPELINE TAB CONTENT */}
      {activeTab === "pipeline" && (
        <div>
          {pipelineStandalone.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>No checklists in pipeline for the next 7 days.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {pipelineStandalone.map((item) => {
                const pDate = new Date(item.plannedDate);
                const diffTime = Math.abs(pDate.getTime() - now.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return (
                  <div key={item.id} style={{
                    background: "#fff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.05)"
                  }}>
                    <div style={{
                      background: "#eff6ff",
                      border: "1px solid #dbeafe",
                      color: "#1e40af",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}>
                      🔔 <span>Apka task pipeline me hai jo <strong>{pDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong> ko aane wala hai</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>{item.taskName}</h3>
                        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Assigned by: {item.assigner_name || "Manager"}</p>
                      </div>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#f1f5f9',
                        color: '#475569'
                      }}>
                        {item.priority} Priority
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div>🕒 <strong>Due In:</strong> {diffDays} day(s) ({pDate.toLocaleString()})</div>
                      <div>🔄 <strong>Frequency:</strong> {item.frequency}</div>
                      {item.whenRule && <div>📌 <strong>Schedule Rule:</strong> {item.whenRule}</div>}
                    </div>

                    <div style={{ paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>⏳ Pipeline Stage (Reflects on Due Date)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

