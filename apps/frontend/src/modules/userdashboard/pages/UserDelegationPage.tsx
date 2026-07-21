import React, { useEffect, useState, useRef } from "react";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { delegationApi, DelegatedTaskRecord } from "../../officeperf/delegation/api/delegationApi";
import "./UserDashboardPage.css";

interface DisplayDelegation extends DelegatedTaskRecord {
  displayStatus?: string;
}

export function UserDelegationPage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [delegations, setDelegations] = useState<DisplayDelegation[]>([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofTaskId, setProofTaskId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const empRes = await axiosInstance.get("/employees/me");
        const myEmployeeId = empRes.data?.data?.id;
        
        if (!myEmployeeId) {
          setLoading(false);
          return;
        }
        setEmployeeId(myEmployeeId);

        const delRes = await delegationApi.list({});
        const myDelegations = (delRes.items as DisplayDelegation[]).filter(d => (d as any).assignedTo === myEmployeeId);
        setDelegations(myDelegations);

      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleStatusChange(id: string, status: "running" | "completed") {
    try {
      await delegationApi.updateStatus(id, status);
      setDelegations(prev => prev.map(d => d.id === id ? { ...d, baseStatus: status, displayStatus: status } : d));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  }

  function handleRemarksChange(id: string, text: string) {
    setDelegations(prev => prev.map(d => d.id === id ? { ...d, remarks: text } : d));
  }

  async function handleRemarksBlur(id: string, text: string) {
    try {
      await delegationApi.update(id, { remarks: text });
    } catch (err) {
      console.error("Failed to update remarks", err);
      alert("Failed to update remarks");
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && proofTaskId) {
      const fileUrl = `https://files.example.com/${encodeURIComponent(file.name)}`;
      try {
        await delegationApi.addFile(proofTaskId, "proof", file.name, fileUrl);
        const delRes = await delegationApi.list({});
        const myDelegations = (delRes.items as DisplayDelegation[]).filter(d => (d as any).assignedTo === employeeId);
        setDelegations(myDelegations);
      } catch (err) {
        console.error("Failed to add proof", err);
        alert("Failed to add proof");
      }
    }
    setProofTaskId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleAddProof(id: string) {
    setProofTaskId(id);
    fileInputRef.current?.click();
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  if (!employeeId) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>My Delegated Tasks</h2>
        <p>Your user account is not linked to an Employee record.</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*" 
        onChange={handleFileChange} 
      />
      <h1 className="user-dashboard-title">My Delegated Tasks</h1>
      
      <section className="user-dashboard-section">
        {delegations.length === 0 ? (
          <p>No delegated tasks assigned to you.</p>
        ) : (
          <table className="user-dashboard-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Assigned By</th>
                <th>Planned Date</th>
                <th>Priority</th>
                <th>Remarks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {delegations.map(d => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{d.assignedByName}</td>
                  <td>{new Date(d.dueDate).toLocaleDateString()}</td>
                  <td><span className={`status-pill ${d.priority}`}>{d.priority}</span></td>
                  <td>
                    <input 
                      type="text" 
                      className="remarks-input"
                      style={{ padding: '0.25rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                      placeholder="Add remarks..."
                      value={d.remarks || ""} 
                      onChange={(e) => handleRemarksChange(d.id, e.target.value)} 
                      onBlur={(e) => handleRemarksBlur(d.id, e.target.value)}
                    />
                  </td>
                  <td><span className={`status-pill ${d.baseStatus}`}>{d.displayStatus || d.baseStatus}</span></td>
                  <td>
                    {d.baseStatus !== "completed" && (
                      <select 
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "start") handleStatusChange(d.id, "running");
                          if (val === "proof") handleAddProof(d.id);
                          if (val === "complete") handleStatusChange(d.id, "completed");
                        }}
                        className="status-dropdown"
                        style={{ padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="">Select Action...</option>
                        {d.baseStatus === "pending" && <option value="start">Start</option>}
                        <option value="proof">Add Proof</option>
                        <option value="complete">Complete</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
