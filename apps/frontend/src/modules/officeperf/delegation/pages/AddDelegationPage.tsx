import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";
import { delegationApi, DelegationPriority } from "../api/delegationApi";
import { employeesApi, EmployeeRecord } from "../../../admin/organization/employees/api/employeesApi";

export interface DelegationTaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: DelegationPriority;
}

export default function AddDelegationPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  const [assignedBy, setAssignedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [tasks, setTasks] = useState<DelegationTaskItem[]>([]);
  const [sendAppNotification, setSendAppNotification] = useState(true);
  const [sendWhatsappNotification, setSendWhatsappNotification] = useState(true);
  const [allEmployees, setAllEmployees] = useState<EmployeeRecord[]>([]);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const handleAddTask = () => {
    const newTask: DelegationTaskItem = {
      id: "task-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      title: "",
      dueDate: getTodayDate(),
      priority: "low",
    };
    setTasks(prev => [...prev, newTask]);
    setErrorMsg(null);
  };

  const handleRemoveTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleTaskChange = (id: string, field: keyof DelegationTaskItem, value: any) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          return { ...t, [field]: value };
        }
        return t;
      })
    );
  };

  useEffect(() => {
    // Check System Admin bypass
    const isSystemAdmin = user?.roles.includes("System Admin");
    if (isSystemAdmin) {
      setIsAllowed(true);
    } else {
      // Check designation permission
      employeesApi.getMe()
        .then((me) => {
          if (!me) {
            setIsAllowed(false);
            return;
          }
          const title = me.designationTitle?.trim().toLowerCase() || "";
          setIsAllowed(title === "admin" || title === "admin executive" || title === "director" || title === "executive director");
        })
        .catch(() => setIsAllowed(false));
    }

    employeesApi.list().then(res => setAllEmployees(res));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!assignedBy && !user?.id) {
      setErrorMsg("Please select who is assigning the tasks ('Assign By').");
      return;
    }

    if (!assignedTo) {
      setErrorMsg("Please select who the tasks are being assigned to ('Assign to').");
      return;
    }

    if (tasks.length === 0) {
      setErrorMsg("Please add at least one task using the '+ Add Task' button.");
      return;
    }

    // Validate all tasks
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.title.trim()) {
        setErrorMsg(`Task #${i + 1}: Please enter the Task Name.`);
        return;
      }
      if (!task.dueDate) {
        setErrorMsg(`Task #${i + 1}: Please select a Planned Date.`);
        return;
      }
    }

    setLoading(true);
    try {
      // Create all tasks in sequence to preserve natural order
      for (const t of tasks) {
        await delegationApi.create({
          title: t.title.trim(),
          assignedBy: assignedBy || user?.id,
          assignedTo,
          dueDate: t.dueDate,
          priority: t.priority,
          sendAppNotification,
          sendWhatsappNotification,
        });
      }
      navigate("/admin/delegation/list");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || "Failed to create delegations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isAllowed === null) {
    return <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Checking permissions...</div>;
  }

  if (isAllowed === false) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 12, textAlign: "center" }}>
        <h2 style={{ color: "#991b1b", marginTop: 0, fontSize: 20, fontWeight: 600 }}>Access Denied</h2>
        <p style={{ color: "#7f1d1d", margin: "10px 0 0 0" }}>
          Only employees with the designation <strong>Admin</strong>, <strong>Admin Executive</strong>, <strong>Director</strong>, or <strong>Executive Director</strong> are allowed to add delegations.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Add Delegation
        </h2>
        <Link to="/admin/delegation/list" style={{ color: "#3B82F6", fontSize: 14, textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
          View Delegations &rarr;
        </Link>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {errorMsg && (
          <div style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#B91C1C",
            padding: "12px 16px",
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              style={{ background: "transparent", border: "none", color: "#B91C1C", cursor: "pointer", fontWeight: "bold", fontSize: 14 }}
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Top Level: Assign By & Assign to */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Assign By <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={assignedBy}
                onChange={e => setAssignedBy(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                  boxSizing: "border-box",
                  fontSize: 14,
                  backgroundColor: "#fff",
                  outline: "none"
                }}
              >
                <option value="">Select One</option>
                {allEmployees
                  .filter(emp => {
                    const title = emp.designationTitle?.trim().toLowerCase() || "";
                    return title === "admin" || title === "director" || title === "executive director";
                  })
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))
                }
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Assign to <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                  boxSizing: "border-box",
                  fontSize: 14,
                  backgroundColor: "#fff",
                  outline: "none"
                }}
              >
                <option value="">Select One</option>
                {allEmployees
                  .filter(emp => {
                    const title = emp.designationTitle?.toLowerCase() || "";
                    return !title.includes("director") && !title.includes("admin");
                  })
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))
                }
              </select>
            </div>
          </div>

          {/* Section Divider & Header */}
          <div style={{
            borderTop: "1px solid #E5E7EB",
            paddingTop: 20,
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1F2937" }}>
                Tasks to Delegate
              </span>
              {tasks.length > 0 && (
                <span style={{
                  backgroundColor: "#EFF6FF",
                  color: "#2563EB",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 12,
                  border: "1px solid #BFDBFE"
                }}>
                  {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddTask}
              style={{
                backgroundColor: "#2563EB",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
                transition: "background-color 0.15s ease"
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Task
            </button>
          </div>

          {/* Empty State when no tasks added */}
          {tasks.length === 0 ? (
            <div
              onClick={handleAddTask}
              style={{
                border: "2px dashed #BFDBFE",
                borderRadius: 8,
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#F8FAFC",
                marginBottom: 24,
                transition: "all 0.2s ease"
              }}
            >
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 10,
                border: "1px solid #BFDBFE"
              }}>
                +
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1E40AF" }}>
                Click "+ Add Task" to add tasks
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                You can add multiple tasks (1st, 2nd, 3rd, 4th...) to delegate to this person.
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    padding: "16px 20px",
                    marginBottom: 14,
                    transition: "box-shadow 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        backgroundColor: "#3B82F6",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 4,
                        letterSpacing: "0.5px"
                      }}>
                        TASK #{index + 1}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#DC2626",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        borderRadius: 4
                      }}
                      title="Remove task"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Remove
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                        Task Name <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter task name..."
                        value={task.title}
                        onChange={(e) => handleTaskChange(task.id, "title", e.target.value)}
                        required
                        autoFocus={index === tasks.length - 1}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #D1D5DB",
                          borderRadius: 6,
                          boxSizing: "border-box",
                          fontSize: 14,
                          backgroundColor: "#fff",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                        Planned Date <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={task.dueDate}
                        min={getTodayDate()}
                        onChange={(e) => handleTaskChange(task.id, "dueDate", e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #D1D5DB",
                          borderRadius: 6,
                          boxSizing: "border-box",
                          fontSize: 14,
                          backgroundColor: "#fff",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                        Priority <span style={{ color: "red" }}>*</span>
                      </label>
                      <select
                        value={task.priority}
                        onChange={(e) => handleTaskChange(task.id, "priority", e.target.value as DelegationPriority)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #D1D5DB",
                          borderRadius: 6,
                          boxSizing: "border-box",
                          fontSize: 14,
                          backgroundColor: "#fff",
                          outline: "none"
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleAddTask}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    border: "1px dashed #3B82F6",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Another Task
                </button>
              </div>
            </div>
          )}

          {/* Notifications Checkboxes */}
          <div style={{ display: "flex", gap: 24, marginTop: 20, marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151" }}>
              <input
                type="checkbox"
                checked={sendAppNotification}
                onChange={(e) => setSendAppNotification(e.target.checked)}
              />
              Send App Notification (User ID)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151" }}>
              <input
                type="checkbox"
                checked={sendWhatsappNotification}
                onChange={(e) => setSendWhatsappNotification(e.target.checked)}
              />
              Send WhatsApp Notification
            </label>
          </div>

          {/* Form Actions */}
          <div style={{ textAlign: "center", borderTop: "1px solid #E5E7EB", paddingTop: 24 }}>
            <button
              type="submit"
              disabled={loading || tasks.length === 0}
              style={{
                backgroundColor: loading || tasks.length === 0 ? "#9CA3AF" : "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "10px 48px",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || tasks.length === 0 ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                transition: "background-color 0.2s"
              }}
            >
              {loading
                ? "Submitting..."
                : `Submit ${tasks.length > 0 ? `(${tasks.length} ${tasks.length === 1 ? "Task" : "Tasks"})` : ""}`
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
