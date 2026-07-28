import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fmsApi, FmsManager } from "../api/fmsApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { axiosInstance } from "../../../services/api/axiosInstance";
import "./Fms.css";

export function FmsManagerPage() {
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
                            style={{ background: "#17a2b8", padding: "4px 12px", fontSize: "0.85rem", width: "auto" }}
                            onClick={() => navigate(`/admin/fms/${fms.id}/grid`)}
                          >
                            Grid View
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
