import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmsApi, FmsStep } from "../api/fmsApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { axiosInstance } from "../../../services/api/axiosInstance";
import "./Fms.css";

export function FmsGridViewPage() {
  const { fmsId } = useParams();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<FmsStep[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fmsName, setFmsName] = useState<string>("");
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);

  const user = useAuthStore((s) => s.user);
  const isSystemAdmin = user?.roles?.includes("System Admin") || false;

  const fetchData = async () => {
      try {
        let currentEmployeeId = null;
        if (user && !isSystemAdmin) {
          const empRes = await axiosInstance.get("/employees/me");
          currentEmployeeId = empRes.data?.data?.id;
          setMyEmployeeId(currentEmployeeId);
        }

        const [stepsRes, fmsListRes, instancesRes] = await Promise.all([
          fmsApi.getSteps(fmsId as string),
          fmsApi.getAll(),
          fmsApi.getInstances(fmsId as string)
        ]);
        
        let empRes: any[] = [];
        try {
          empRes = await employeesApi.listForDropdown();
        } catch (e) {
          console.warn("Failed to load employees list (possibly lack of permissions)");
        }

        setSteps(stepsRes);
        setEmployees(empRes);
        setInstances(instancesRes);
        const fms = fmsListRes.find((f) => f.id === fmsId);
        if (fms) setFmsName(fms.name);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (fmsId) {
      fetchData();
    }
  }, [fmsId]);

  const handleDelete = async (instanceId: string) => {
    if (!window.confirm("Are you sure you want to delete this instance? This action cannot be undone.")) return;
    try {
      await fmsApi.deleteInstance(instanceId);
      // Refresh list
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete instance");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedInstances.length} selected instances? This action cannot be undone.`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedInstances.map(id => fmsApi.deleteInstance(id)));
      setSelectedInstances([]);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete some instances.");
      setLoading(false);
    }
  };

  const handleCompleteTask = async (instanceStepId: string, stepName: string, status: string) => {
    if (!window.confirm(`Are you sure you want to change the status of '${stepName}' to ${status}?`)) return;
    try {
      await fmsApi.completeTask(instanceStepId, { status });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  if (loading) return <div>Loading...</div>;

  const visibleSteps = steps;

  return (
    <div className="fms-container" style={{ maxWidth: "1400px", padding: "32px" }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
        border: "1px solid #f1f5f9",
        overflow: "hidden"
      }}>
        {/* Sleek Header */}
        <div style={{
          padding: "24px 32px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: "1.25rem", 
              fontWeight: 600, 
              letterSpacing: "0.025em",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span style={{ 
                background: "rgba(255,255,255,0.1)", 
                padding: "6px 10px", 
                borderRadius: "6px",
                fontSize: "0.85rem"
              }}>
                GRID VIEW
              </span>
              {fmsName}
            </h2>
            <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>Track and manage all instances for this process</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {isSystemAdmin && selectedInstances.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="fms-btn-primary"
                style={{ 
                  background: "#dc2626", 
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                DELETE SELECTED ({selectedInstances.length})
              </button>
            )}
            <button 
              onClick={() => navigate("/admin/fms/list")}
              className="fms-btn-primary"
            style={{ 
              background: "#ffc107", 
              color: "#333",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            BACK TO LIST
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div style={{ overflowX: "auto" }}>
          {steps.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#64748b" }}>
              <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>No steps configured for this FMS.</p>
              <p style={{ fontSize: "0.9rem" }}>Please add steps to the FMS Manager first.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: "1800px" }}>
              <thead>
                <tr>
                  {isSystemAdmin && (
                    <th rowSpan={2} style={{...headerStyle, width: "40px", textAlign: "center"}}>
                      <input 
                        type="checkbox" 
                        checked={instances.length > 0 && selectedInstances.length === instances.length}
                        onChange={(e) => setSelectedInstances(e.target.checked ? instances.map(i => i.id) : [])}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                  )}
                  <th rowSpan={2} style={headerStyle}>Reference ID</th>
                  <th rowSpan={2} style={headerStyle}>Alias Name</th>
                  <th rowSpan={2} style={headerStyle}>Created By</th>
                  <th rowSpan={2} style={headerStyle}>Date</th>
                  <th rowSpan={2} style={{...headerStyle, textAlign: "center"}}>Overall Status</th>
                  {isSystemAdmin && <th rowSpan={2} style={{...headerStyle, textAlign: "center"}}>Actions</th>}
                  {visibleSteps.map((step) => {
                    const originalIndex = steps.findIndex(s => s.id === step.id);
                    return (
                    <th key={step.id} colSpan={4} data-no-filter="true" style={{
                      ...headerStyle,
                      textAlign: "center",
                      borderBottom: "1px solid #e2e8f0"
                    }}>
                      <div style={{ 
                        fontSize: "0.7rem", 
                        textTransform: "uppercase", 
                        letterSpacing: "0.05em",
                        color: "#3b82f6", 
                        fontWeight: 700,
                        marginBottom: "4px"
                      }}>
                        Step {originalIndex + 1}
                      </div>
                      <div 
                        title={step.stepName}
                        style={{ 
                          fontSize: "0.75rem",
                          color: "#334155",
                          fontWeight: 600,
                          whiteSpace: "normal",
                          maxWidth: "280px",
                          margin: "0 auto",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                      >
                        {step.stepName}
                      </div>
                    </th>
                    );
                  })}
                </tr>
                <tr>
                  {visibleSteps.map((step) => (
                    <React.Fragment key={`sub-${step.id}`}>
                      <th style={subHeaderStyle} data-no-filter="true">Doer</th>
                      <th style={subHeaderStyle} data-no-filter="true">Plan Date</th>
                      <th style={subHeaderStyle} data-no-filter="true">Delay</th>
                      <th style={subHeaderStyle} data-no-filter="true">Status</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instances.length === 0 ? (
                  <tr>
                    <td colSpan={5 + steps.length * 4 + (isSystemAdmin ? 2 : 0)} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                      No forms submitted yet.
                    </td>
                  </tr>
                ) : (
                  instances.map((instance) => {
                    // Calculate Plan Dates
                    const planDates: Record<string, Date> = {};
                    let baseDate = new Date(instance.createdAt);
                    
                    for (const step of steps) {
                      const newDate = new Date(baseDate.getTime());
                      const timeline = step.timelineHours || 0;
                      if (step.timelineUnit === "days") {
                        newDate.setDate(newDate.getDate() + timeline);
                      } else {
                        newDate.setHours(newDate.getHours() + timeline);
                      }
                      planDates[step.id] = newDate;

                      if (step.isSequential) {
                        const stepData = instance.steps.find((s: any) => s.stepName === step.stepName);
                        if (stepData && stepData.status === 'Completed' && stepData.completedAt) {
                          baseDate = new Date(stepData.completedAt);
                        } else {
                          baseDate = planDates[step.id];
                        }
                      }
                    }

                    return (
                      <tr key={instance.id} style={{ transition: "background-color 0.2s ease" }} className="grid-row-hover">
                        {isSystemAdmin && (
                          <td style={{...cellStyle, textAlign: "center"}}>
                            <input 
                              type="checkbox" 
                              checked={selectedInstances.includes(instance.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedInstances([...selectedInstances, instance.id]);
                                else setSelectedInstances(selectedInstances.filter(id => id !== instance.id));
                              }}
                              style={{ cursor: "pointer" }}
                            />
                          </td>
                        )}
                        <td style={{...cellStyle, minWidth: "120px"}}>
                          <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8rem" }}>{instance.referenceTitle}</span>
                        </td>
                        <td style={{...cellStyle, minWidth: "120px"}}>
                          <span style={{ color: "#334155", fontSize: "0.8rem" }}>{instance.formData?.aliasName || "-"}</span>
                        </td>
                        <td style={{...cellStyle, minWidth: "140px"}}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ 
                              width: "24px", height: "24px", 
                              borderRadius: "50%", background: "#e2e8f0", 
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.7rem", fontWeight: "bold", color: "#64748b"
                            }}>
                              {(instance.creatorName || "S")[0].toUpperCase()}
                            </div>
                            <span style={{ color: "#334155", fontSize: "0.8rem", fontWeight: 500 }}>{instance.creatorName}</span>
                          </div>
                        </td>
                        <td style={{ ...cellStyle, color: "#64748b", fontSize: "0.75rem", minWidth: "120px" }}>
                          {new Date(instance.createdAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td style={{ ...cellStyle, textAlign: "center", minWidth: "110px" }}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.025em",
                            backgroundColor: instance.status === 'Completed' ? '#dcfce7' : '#fef9c3',
                            color: instance.status === 'Completed' ? '#166534' : '#854d0e',
                            border: `1px solid ${instance.status === 'Completed' ? '#bbf7d0' : '#fef08a'}`
                          }}>
                            {instance.status}
                          </span>
                        </td>
                        {isSystemAdmin && (
                          <td style={{ ...cellStyle, textAlign: "center" }}>
                            <button 
                              onClick={() => handleDelete(instance.id)}
                              style={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "1px solid #fca5a5",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                        {visibleSteps.map((step) => {
                          const stepData = instance.steps.find((s: any) => s.stepName === step.stepName);
                          const isConfigured = !!stepData;
                          
                          // Resolve Doer Names
                          let doerNames = "Unassigned";
                          const isCreatorStep = !step.doerEmployeeIds || step.doerEmployeeIds.length === 0;
                          
                          if (isCreatorStep && instance.creatorName) {
                            doerNames = instance.creatorName;
                          } else if (step.doerEmployeeIds && step.doerEmployeeIds.length > 0) {
                            doerNames = step.doerEmployeeIds.map(id => {
                              const emp = employees.find(e => e.id === id);
                              return emp ? emp.fullName : id;
                            }).join(", ");
                          }

                          // Plan Date
                          const planDate = planDates[step.id];
                          const formattedPlanDate = planDate.toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          });

                          // Status styling
                          let bgColor = "transparent";
                          let statusColor = "#64748b";
                          let dotColor = "#94a3b8";
                          let statusText = isConfigured ? stepData.status : "Pending";
                          let delayText = "-";
                          let isDelayed = false;

                          if (isConfigured) {
                            if (stepData.status === 'Completed') {
                              statusColor = "#166534";
                              dotColor = "#22c55e";
                              bgColor = "#f0fdf4";
                            } else if (stepData.status === 'Pending') {
                              statusColor = "#1e40af";
                              dotColor = "#3b82f6";
                            } else if (stepData.status === 'In Progress') {
                              statusColor = "#c2410c";
                              dotColor = "#f97316";
                              bgColor = "#fff7ed";
                            } else if (stepData.status === 'Skipped') {
                              statusColor = "#475569";
                              dotColor = "#94a3b8";
                            }

                            // Calculate Delay
                            if (stepData.status !== 'Skipped') {
                              const compareDate = (stepData.status === 'Completed' && stepData.completedAt) ? new Date(stepData.completedAt) : new Date();
                              const diffMs = compareDate.getTime() - planDate.getTime();
                              if (diffMs <= 0) {
                                delayText = "On Time";
                              } else {
                                isDelayed = true;
                                const diffHours = diffMs / (1000 * 60 * 60);
                                if (diffHours < 24) {
                                  delayText = `${Math.round(diffHours)} hrs delay`;
                                } else {
                                  delayText = `${Math.round(diffHours / 24)} days delay`;
                                }
                              }
                            }
                          }

                          const isCreatorStepAgain = !step.doerEmployeeIds || step.doerEmployeeIds.length === 0;
                          let isDoer = step.doerEmployeeIds?.includes(myEmployeeId || "") || (isCreatorStepAgain && instance.creatorId === myEmployeeId);
                          
                          let isBlocked = false;
                          if (step.isSequential) {
                            const previousSteps = instance.steps.filter((s: any) => s.sequenceOrder < step.sequenceOrder);
                            isBlocked = previousSteps.some((s: any) => s.status === 'Pending' || s.status === 'In Progress');
                          }

                          if (isBlocked) {
                            isDoer = false;
                          }

                          const isPendingDoer = isDoer && statusText === 'Pending';

                          return (
                            <React.Fragment key={step.id}>
                              <td style={{ ...cellStyle, background: bgColor, fontSize: "0.75rem", color: "#334155", minWidth: "110px", fontWeight: 500 }}>
                                {doerNames}
                              </td>
                              <td style={{ ...cellStyle, background: bgColor, fontSize: "0.75rem", color: "#334155", minWidth: "110px" }}>
                                {formattedPlanDate}
                              </td>
                              <td style={{ ...cellStyle, background: bgColor, fontSize: "0.75rem", fontWeight: isDelayed ? 600 : 500, color: isDelayed ? "#dc2626" : "#16a34a", minWidth: "90px" }}>
                                {delayText}
                              </td>
                              <td style={{ ...cellStyle, background: bgColor, minWidth: "130px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <div 
                                    style={{ 
                                      display: "inline-flex", 
                                      alignItems: "center", 
                                      gap: "6px",
                                      background: statusText === 'Completed' ? '#dcfce7' : statusText === 'In Progress' ? '#ffedd5' : statusText === 'Pending' ? '#dbeafe' : '#f1f5f9',
                                      padding: "3px 6px",
                                      borderRadius: "4px",
                                      width: "fit-content",
                                      border: isDoer ? "1px solid #cbd5e1" : "none",
                                      boxShadow: isDoer ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                                    }}
                                  >
                                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dotColor }}></span>
                                    {isDoer ? (
                                      <select
                                        value={statusText}
                                        onChange={(e) => {
                                          if (stepData?.id) {
                                            handleCompleteTask(stepData.id, step.stepName, e.target.value);
                                          }
                                        }}
                                        style={{
                                          fontWeight: 600, 
                                          fontSize: "0.7rem", 
                                          color: statusColor,
                                          background: "transparent",
                                          border: "none",
                                          outline: "none",
                                          cursor: "pointer",
                                          padding: 0
                                        }}
                                      >
                                        <option value="Pending" disabled>Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Yes</option>
                                        <option value="Skipped">Not Applicable</option>
                                      </select>
                                    ) : (
                                      <span style={{ fontWeight: 600, fontSize: "0.7rem", color: statusColor }}>
                                        {statusText === 'Skipped' ? 'Not Applicable' : statusText}
                                      </span>
                                    )}
                                  </div>
                                  {isConfigured && stepData.completedByName && (
                                    <div style={{ fontSize: "0.65rem", color: "#64748b", paddingLeft: "4px", fontWeight: 500 }}>
                                      by {stepData.completedByName}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  color: "#475569",
  fontSize: "0.75rem",
  fontWeight: 600,
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  borderRight: "1px solid #f1f5f9",
  whiteSpace: "nowrap"
};

const subHeaderStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  color: "#64748b",
  fontSize: "0.7rem",
  fontWeight: 600,
  background: "#f1f5f9",
  borderBottom: "1px solid #e2e8f0",
  borderRight: "1px solid #e2e8f0",
  whiteSpace: "nowrap"
};

const cellStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #f1f5f9",
  borderRight: "1px solid #f1f5f9",
};
