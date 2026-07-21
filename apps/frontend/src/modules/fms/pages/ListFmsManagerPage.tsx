import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fmsApi, FmsManager } from "../api/fmsApi";
import "./Fms.css";

export function ListFmsManagerPage() {
  const navigate = useNavigate();
  const [fmsList, setFmsList] = useState<FmsManager[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFmsList = () => {
    setLoading(true);
    fmsApi.getAll()
      .then(setFmsList)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFmsList();
  }, []);

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

  return (
    <div className="fms-container">
      <div className="fms-card">
        <div className="fms-card-header">
          <h2 className="fms-title">FMS MANAGERS</h2>
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
                            style={{ padding: "4px 12px", fontSize: "0.85rem", width: "auto" }}
                            onClick={() => navigate(`/admin/fms/${fms.id}/steps`)}
                          >
                            Manage Steps
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
