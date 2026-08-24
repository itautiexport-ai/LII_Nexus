import React, { useEffect, useState } from "react";
import { fmsApi } from "../../fms/api/fmsApi";
import "./UserDashboardPage.css";

export function UserFmsPage() {
  const [fmsTasks, setFmsTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [inputData, setInputData] = useState<any>({});

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasks = await fmsApi.getMyTasks();
      setFmsTasks(tasks);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCompleteClick = (task: any) => {
    setSelectedTask(task);
    setInputData({});
    setIsModalOpen(true);
  };

  const submitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await fmsApi.completeTask(selectedTask.instanceStepId, inputData);
      setIsModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Failed to complete task");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  return (
    <div className="user-dashboard-container">
      <h1 className="user-dashboard-title">My FMS Tasks (Pending)</h1>
      
      <section className="user-dashboard-section">
        {fmsTasks.length === 0 ? (
          <p>No pending FMS tasks assigned to you.</p>
        ) : (
          <table className="user-dashboard-table">
            <thead>
              <tr>
                <th>Reference / Order</th>
                <th>Alias Name</th>
                <th>Step Name</th>
                <th>Timeline</th>
                <th>Assigned At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fmsTasks.map(t => (
                <tr key={t.instanceStepId}>
                  <td>{t.referenceTitle}</td>
                  <td>{t.formData?.aliasName || t.managerName}</td>
                  <td>{t.stepName}</td>
                  <td>{t.timelineHours} {t.timelineUnit}</td>
                  <td>{new Date(t.assignedAt).toLocaleString()}</td>
                  <td>
                    <button 
                      style={{ background: "#007bff", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                      onClick={() => handleCompleteClick(t)}
                    >
                      Execute Task
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen && selectedTask && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "8px", width: "400px", maxWidth: "90%" }}>
            <h2 style={{ marginTop: 0 }}>Complete Task</h2>
            <p><strong>Order:</strong> {selectedTask.referenceTitle}</p>
            <p><strong>Step:</strong> {selectedTask.stepName}</p>

            <form onSubmit={submitComplete}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>Was this step completed or is it Not Applicable? *</label>
                <select 
                  required 
                  value={inputData.status || ""}
                  onChange={(e) => setInputData({...inputData, status: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                  <option value="" disabled>Select option</option>
                  <option value="Completed">Yes</option>
                  <option value="Skipped">Not Applicable</option>
                </select>
              </div>
              
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>Comments (Optional)</label>
                <textarea 
                  value={inputData.comments || ""}
                  onChange={(e) => setInputData({...inputData, comments: e.target.value})}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Submit & Complete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
