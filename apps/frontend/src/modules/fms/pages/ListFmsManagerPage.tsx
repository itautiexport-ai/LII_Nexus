import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fmsApi, FmsManager } from "../api/fmsApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { axiosInstance } from "../../../services/api/axiosInstance";
import "./Fms.css";

export function ListFmsManagerPage() {
  const navigate = useNavigate();
  const [fmsList, setFmsList] = useState<FmsManager[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  const fetchFmsList = async () => {
    setLoading(true);
    try {
      const allManagers = await fmsApi.getAll();
      
      if (user && !user.roles.includes("System Admin")) {
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
        <div className="fms-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="fms-title" style={{ margin: 0 }}>FMS MANAGERS</h2>
          <button 
            className="fms-btn-primary" 
            onClick={() => navigate("/admin/fms")}
            style={{ background: "#ffc107", color: "#333", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            BACK TO FMS HUB
          </button>
        </div>
        
        <div className="fms-card-content" style={{ padding: 0 }}>
          <div className="fms-table-container">
            <table className="fms-table">
              <thead>
                <tr>
                  <th className="fms-th">Name</th>
                  <th className="fms-th">Created At</th>
                  <th className="fms-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="fms-empty">Loading...</td>
                  </tr>
                ) : fmsList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="fms-empty">No FMS Managers found.</td>
                  </tr>
                ) : (
                  fmsList.map((fms) => (
                    <tr key={fms.id} className="fms-tr">
                      <td className="fms-td">{fms.name}</td>
                      <td className="fms-td">{new Date(fms.createdAt).toLocaleDateString()}</td>
                      <td className="fms-td">
                        <div style={{ display: "flex", gap: "8px" }}>

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
                          <button
                            type="button"
                            style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 12px", fontSize: "0.85rem", borderRadius: "4px", cursor: "pointer", width: "auto" }}
                            onClick={() => handleDelete(fms.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
