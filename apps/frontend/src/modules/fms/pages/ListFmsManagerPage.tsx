import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fmsApi, FmsManager } from "../api/fmsApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { useCanDelete, useIsAdminOrManagement } from "../../auth/hooks/usePermissions";
import { axiosInstance } from "../../../services/api/axiosInstance";
import "./Fms.css";

export function ListFmsManagerPage() {
  const navigate = useNavigate();
  const [fmsList, setFmsList] = useState<FmsManager[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const canDelete = useCanDelete();
  const isAdminOrManagement = useIsAdminOrManagement();

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<"card" | "table">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "card" : "table"
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchFmsList = async () => {
    setLoading(true);
    try {
      const allManagers = await fmsApi.getAll();
      
      if (user && !isAdminOrManagement) {
        const empRes = await axiosInstance.get("/employees/me");
        const myEmployeeId = empRes.data?.data?.id;
        
        if (!myEmployeeId) {
          setFmsList([]);
        } else {
          const filteredManagers = [];
          for (const mgr of allManagers) {
            const steps = await fmsApi.getSteps(mgr.id);
            const isRelevant = steps.some(s => {
              return s.doerEmployeeIds?.includes(myEmployeeId);
            });
            if (isRelevant) {
              filteredManagers.push(mgr);
            }
          }
          setFmsList(filteredManagers);
        }
      } else {
        setFmsList(allManagers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFmsList();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FMS Manager? This will also delete all its steps.")) return;
    try {
      await fmsApi.delete(id);
      fetchFmsList();
    } catch (err) {
      console.error(err);
      alert("Failed to delete FMS Manager");
    }
  };

  const handleEditName = async (fms: FmsManager) => {
    const newName = prompt(`Enter new name for FMS '${fms.name}':`, fms.name);
    if (!newName || newName === fms.name) return;
    
    try {
      await fmsApi.update(fms.id, {
        name: newName,
        sopVideoLink: fms.sopVideoLink || "",
        description: fms.description || "Updated FMS",
        formFields: fms.formFields || []
      });
      fetchFmsList();
    } catch (err) {
      console.error(err);
      alert("Failed to update FMS Manager name");
    }
  };

  const handleStartInstance = async (id: string, name: string) => {
    const referenceTitle = prompt(`Enter Reference/Order ID to start FMS '${name}':`);
    if (!referenceTitle) return;
    
    try {
      await fmsApi.startInstance(id, referenceTitle);
      alert(`Successfully started FMS instance for ${referenceTitle}`);
    } catch (err) {
      console.error(err);
      alert("Failed to start FMS instance");
    }
  };

  return (
    <div className="fms-container">
      <div className="fms-card">
        <div className="fms-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 className="fms-title" style={{ margin: 0, fontSize: isMobile ? "20px" : "24px" }}>FMS MANAGERS</h2>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Total: {fmsList.length}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <button
                onClick={() => setViewMode("card")}
                style={{
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: viewMode === "card" ? 600 : 500,
                  background: viewMode === "card" ? "#ffffff" : "transparent",
                  color: viewMode === "card" ? "#0f172a" : "#64748b",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxShadow: viewMode === "card" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                📱 Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                style={{
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: viewMode === "table" ? 600 : 500,
                  background: viewMode === "table" ? "#ffffff" : "transparent",
                  color: viewMode === "table" ? "#0f172a" : "#64748b",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                📊 Table
              </button>
            </div>

            <button 
              className="fms-btn-primary" 
              onClick={() => navigate("/admin/fms")}
              style={{ background: "#ffc107", color: "#333", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
            >
              Back to Hub
            </button>
          </div>
        </div>
        
        <div className="fms-card-content" style={{ padding: isMobile ? "12px" : 0 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Loading...</div>
          ) : fmsList.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>No FMS Managers found.</div>
          ) : isMobile && viewMode === "card" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {fmsList.map((fms) => (
                <div
                  key={fms.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a", lineHeight: "1.3" }}>
                      {fms.name}
                    </h4>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      Created: {new Date(fms.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartInstance(fms.id, fms.name)}
                    style={{
                      background: "#16a34a",
                      color: "#fff",
                      border: "none",
                      padding: "10px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    ▶ Start FMS Instance
                  </button>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/fms/${fms.id}/steps`)}
                      style={{
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        padding: "8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      ⚙️ Manage Steps
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/fms/${fms.id}/grid`)}
                      style={{
                        background: "#0891b2",
                        color: "#fff",
                        border: "none",
                        padding: "8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      📊 Grid View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditName(fms)}
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                        padding: "8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      ✏️ Rename
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(fms.id)}
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fca5a5",
                          padding: "8px",
                          borderRadius: "6px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: "13px"
                        }}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="fms-table-container" style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table className="fms-table" style={{ minWidth: "700px" }}>
                <thead>
                  <tr>
                    <th className="fms-th">Name</th>
                    <th className="fms-th">Created At</th>
                    <th className="fms-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fmsList.map((fms) => (
                    <tr key={fms.id} className="fms-tr">
                      <td className="fms-td">{fms.name}</td>
                      <td className="fms-td">{new Date(fms.createdAt).toLocaleDateString()}</td>
                      <td className="fms-td">
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="fms-btn-primary"
                            style={{ background: "#ffc107", color: "#333", padding: "4px 12px", fontSize: "0.85rem", width: "auto", border: "none" }}
                            onClick={() => handleEditName(fms)}
                          >
                            Edit Name
                          </button>
                          <button
                            type="button"
                            className="fms-btn-primary"
                            style={{ padding: "4px 12px", fontSize: "0.85rem", width: "auto" }}
                            onClick={() => navigate(`/admin/fms/${fms.id}/steps`)}
                          >
                            Manage Steps
                          </button>
                          <button
                            type="button"
                            className="fms-btn-primary"
                            style={{ background: "#17a2b8", padding: "4px 12px", fontSize: "0.85rem", width: "auto" }}
                            onClick={() => navigate(`/admin/fms/${fms.id}/grid`)}
                          >
                            Grid View
                          </button>
                          <button
                            type="button"
                            className="fms-btn-primary"
                            style={{ background: "#28a745", padding: "4px 12px", fontSize: "0.85rem", width: "auto" }}
                            onClick={() => handleStartInstance(fms.id, fms.name)}
                          >
                            Start FMS
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 12px", fontSize: "0.85rem", borderRadius: "4px", cursor: "pointer", width: "auto" }}
                              onClick={() => handleDelete(fms.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
