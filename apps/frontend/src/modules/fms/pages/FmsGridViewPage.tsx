import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmsApi, FmsStep } from "../api/fmsApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { useTableFreeze } from "../../../shared/hooks/useTableFreeze";
import { TableFreezeButton } from "../../../shared/components/TableFreezeButton";
import { TableFreezeModal } from "../../../shared/components/TableFreezeModal";
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

  const availableColumns = useMemo(() => [
    ...(isSystemAdmin ? [{ key: "checkbox", label: "Selection Checkbox", width: 44 }] : []),
    { key: "refId", label: "Reference ID", width: 140 },
    { key: "aliasName", label: "Alias Name", width: 160 },
    { key: "createdBy", label: "Created By", width: 140 },
    { key: "date", label: "Date", width: 120 },
    { key: "status", label: "Overall Status", width: 120 },
    ...(isSystemAdmin ? [{ key: "actions", label: "Actions", width: 90 }] : []),
  ], [isSystemAdmin]);

  const {
    settings: freezeSettings,
    isModalOpen: isFreezeModalOpen,
    effectiveFreezeCount,
    openModal: openFreezeModal,
    closeModal: closeFreezeModal,
    saveSettings: saveFreezeSettings,
    resetSettings: resetFreezeSettings,
    isSaving: isFreezeSaving,
    getContainerStyle,
    getStickyHeaderStyle,
    getStickyCellStyle,
  } = useTableFreeze({
    tableKey: "fms_grid",
    availableColumns,
    defaultSettings: {
      freezeColumns: 0,
      freezeHeader: true,
      tableMaxHeight: "72vh",
    },
  });

  const fetchData = async () => {
    try {
      let currentEmployeeId = null;
      if (user) {
        try {
          const empRes = await axiosInstance.get("/employees/me");
          currentEmployeeId = empRes.data?.data?.id;
          setMyEmployeeId(currentEmployeeId);
        } catch (e) {
          console.warn("Could not fetch current employee profile");
        }
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
    const displayStatus = status === 'Skipped' ? 'Not Applicable' : status;
    if (!window.confirm(`Are you sure you want to change the status of '${stepName}' to ${displayStatus}?`)) return;
    try {
      await fmsApi.completeTask(instanceStepId, { status });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update status");
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
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <TableFreezeButton
              onClick={openFreezeModal}
              effectiveFreezeCount={effectiveFreezeCount}
              isHeaderFrozen={freezeSettings.freezeHeader}
            />
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
        <div style={getContainerStyle()}>
          {steps.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#64748b" }}>
              <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>No steps configured for this FMS.</p>
              <p style={{ fontSize: "0.9rem" }}>Please add steps to the FMS Manager first.</p>
            </div>
          ) : (
            <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
              <thead>
                {/* Row 1: Step Group Super-Headers & Category Indicators */}
                <tr>
                  {isSystemAdmin && (
                    <th style={getStickyHeaderStyle(0, { topOffset: 0, customStyle: { ...metaTopHeaderStyle, textAlign: "center" } })}></th>
                  )}
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 1 : 0, { topOffset: 0, customStyle: metaTopHeaderStyle })}>INFO</th>
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 2 : 1, { topOffset: 0, customStyle: metaTopHeaderStyle })}>DETAILS</th>
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 3 : 2, { topOffset: 0, customStyle: metaTopHeaderStyle })}>CREATOR</th>
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 4 : 3, { topOffset: 0, customStyle: metaTopHeaderStyle })}>DATE</th>
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 5 : 4, { topOffset: 0, customStyle: { ...metaTopHeaderStyle, textAlign: "center" } })}>STATUS</th>
                  {isSystemAdmin && (
                    <th style={getStickyHeaderStyle(6, { topOffset: 0, customStyle: { ...metaTopHeaderStyle, textAlign: "center" } })}>ACTION</th>
                  )}
                  {visibleSteps.map((step, sIdx) => {
                    const originalIndex = steps.findIndex(s => s.id === step.id);
                    return (
                      <th
                        key={step.id}
                        colSpan={5}
                        data-no-filter="true"
                        style={getStickyHeaderStyle(undefined, {
                          topOffset: 0,
                          customStyle: stepGroupHeaderStyle,
                        })}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          <span style={{
                            background: "#dbeafe",
                            color: "#1d4ed8",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.05em"
                          }}>
                            STEP {originalIndex !== -1 ? originalIndex + 1 : sIdx + 1}
                          </span>
                          <span
                            title={step.stepName}
                            style={{
                              fontSize: "0.75rem",
                              color: "#0f172a",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "400px"
                            }}
                          >
                            {step.stepName}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* Row 2: Field Subheaders */}
                <tr>
                  {isSystemAdmin && (
                    <th style={getStickyHeaderStyle(0, { topOffset: "38px", customStyle: { ...headerStyle, textAlign: "center" } })}>
                      <input 
                        type="checkbox" 
                        checked={instances.length > 0 && selectedInstances.length === instances.length}
                        onChange={(e) => setSelectedInstances(e.target.checked ? instances.map(i => i.id) : [])}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                  )}
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 1 : 0, { topOffset: "38px", customStyle: headerStyle })}>Reference ID</th>
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 2 : 1, { topOffset: "38px", customStyle: headerStyle })}>Alias Name</th>
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 3 : 2, { topOffset: "38px", customStyle: headerStyle })}>Created By</th>
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 4 : 3, { topOffset: "38px", customStyle: headerStyle })}>Date</th>
                  <th style={getStickyHeaderStyle(isSystemAdmin ? 5 : 4, { topOffset: "38px", customStyle: { ...headerStyle, textAlign: "center" } })}>Overall Status</th>
                  {isSystemAdmin && <th style={getStickyHeaderStyle(6, { topOffset: "38px", customStyle: { ...headerStyle, textAlign: "center" } })}>Actions</th>}
                  {visibleSteps.map((step) => (
                    <React.Fragment key={`sub-${step.id}`}>
                      <th style={getStickyHeaderStyle(undefined, { topOffset: "38px", customStyle: { ...subHeaderStyle, width: "150px", minWidth: "150px", maxWidth: "150px" } })} data-no-filter="true">Doer</th>
                      <th style={getStickyHeaderStyle(undefined, { topOffset: "38px", customStyle: { ...subHeaderStyle, width: "155px", minWidth: "155px", maxWidth: "155px" } })} data-no-filter="true">Plan Date</th>
                      <th style={getStickyHeaderStyle(undefined, { topOffset: "38px", customStyle: { ...subHeaderStyle, width: "155px", minWidth: "155px", maxWidth: "155px" } })} data-no-filter="true">Actual Date</th>
                      <th style={getStickyHeaderStyle(undefined, { topOffset: "38px", customStyle: { ...subHeaderStyle, width: "100px", minWidth: "100px", maxWidth: "100px" } })} data-no-filter="true">Delay</th>
                      <th style={getStickyHeaderStyle(undefined, { topOffset: "38px", customStyle: { ...subHeaderStyle, width: "135px", minWidth: "135px", maxWidth: "135px" } })} data-no-filter="true">Status</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instances.length === 0 ? (
                  <tr>
                    <td colSpan={5 + steps.length * 5 + (isSystemAdmin ? 2 : 0)} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                      No forms submitted yet.
                    </td>
                  </tr>
                ) : (
                  instances.map((instance) => {
                    // Calculate Plan Dates dynamically:
                    // If a predecessor step is completed, its Actual Date (completedAt) is used as the base
                    // for subsequent steps, ensuring that succeeding steps get their full allotted timeline.
                    const planDates: Record<string, Date> = {};
                    const instanceCreatedDate = new Date(instance.createdAt);

                    // Map step instance data for fast lookup by fmsStepId, stepName, or instance step id
                    const stepInstanceDataMap = new Map<string, any>();
                    if (instance.steps) {
                      for (const s of instance.steps) {
                        if (s.fmsStepId) stepInstanceDataMap.set(s.fmsStepId, s);
                        if (s.stepName) stepInstanceDataMap.set(s.stepName, s);
                        if (s.id) stepInstanceDataMap.set(s.id, s);
                      }
                    }

                    // Helper to get effective completion date of a prerequisite step:
                    // If completed/skipped with a completedAt date, use that Actual Date.
                    // Otherwise, use the step's calculated planDate.
                    const getPrerequisiteEffectiveDate = (prereqStepId: string): Date | null => {
                      const sData = stepInstanceDataMap.get(prereqStepId);
                      if (sData && (sData.status === 'Completed' || sData.status === 'Skipped') && sData.completedAt) {
                        return new Date(sData.completedAt);
                      }
                      if (planDates[prereqStepId]) {
                        return planDates[prereqStepId];
                      }
                      return null;
                    };

                    for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
                      const step = steps[stepIdx];
                      let startDate: Date;

                      // Parse explicit dependencies (dependsOnStepIds)
                      let explicitDeps: string[] = [];
                      if (Array.isArray(step.dependsOnStepIds)) {
                        explicitDeps = step.dependsOnStepIds.filter(Boolean);
                      } else if (typeof step.dependsOnStepIds === 'string') {
                        try {
                          explicitDeps = JSON.parse(step.dependsOnStepIds).filter(Boolean);
                        } catch (e) {
                          explicitDeps = [];
                        }
                      }

                      if (explicitDeps.length > 0) {
                        // Calculate start date as the latest effective date among all prerequisites
                        let maxPrereqTime = 0;
                        let hasFoundPrereq = false;
                        for (const depId of explicitDeps) {
                          const prereqDate = getPrerequisiteEffectiveDate(depId);
                          if (prereqDate) {
                            hasFoundPrereq = true;
                            if (prereqDate.getTime() > maxPrereqTime) {
                              maxPrereqTime = prereqDate.getTime();
                            }
                          }
                        }
                        startDate = (hasFoundPrereq && maxPrereqTime > 0)
                          ? new Date(maxPrereqTime)
                          : new Date(instanceCreatedDate.getTime());
                      } else if (step.isSequential) {
                        // Sequential step without explicit dependsOnStepIds depends on the previous step
                        if (stepIdx > 0) {
                          const prevStep = steps[stepIdx - 1];
                          const prevEffectiveDate = getPrerequisiteEffectiveDate(prevStep.id);
                          startDate = prevEffectiveDate
                            ? new Date(prevEffectiveDate.getTime())
                            : new Date(instanceCreatedDate.getTime());
                        } else {
                          startDate = new Date(instanceCreatedDate.getTime());
                        }
                      } else {
                        // Parallel / Initial step starts at instance creation
                        startDate = new Date(instanceCreatedDate.getTime());
                      }

                      // Plan Date = startDate + timeline
                      const calculatedPlanDate = new Date(startDate.getTime());
                      const timeline = step.timelineHours || 0;
                      if (step.timelineUnit === "days") {
                        calculatedPlanDate.setDate(calculatedPlanDate.getDate() + timeline);
                      } else {
                        calculatedPlanDate.setHours(calculatedPlanDate.getHours() + timeline);
                      }
                      planDates[step.id] = calculatedPlanDate;
                    }

                    return (
                      <tr key={instance.id} style={{ transition: "background-color 0.2s ease" }} className="grid-row-hover">
                        {isSystemAdmin && (
                          <td style={getStickyCellStyle(0, { customStyle: { ...cellStyle, textAlign: "center", width: "44px" } })}>
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
                        <td style={getStickyCellStyle(isSystemAdmin ? 1 : 0, { customStyle: { ...cellStyle, minWidth: "140px" } })}>
                          <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8rem" }}>{instance.referenceTitle}</span>
                        </td>
                        <td style={getStickyCellStyle(isSystemAdmin ? 2 : 1, { customStyle: { ...cellStyle, minWidth: "160px" } })}>
                          <span style={{ color: "#334155", fontSize: "0.8rem" }}>{instance.formData?.aliasName || "-"}</span>
                        </td>
                        <td style={getStickyCellStyle(isSystemAdmin ? 3 : 2, { customStyle: { ...cellStyle, minWidth: "140px" } })}>
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
                        <td style={getStickyCellStyle(isSystemAdmin ? 4 : 3, { customStyle: { ...cellStyle, color: "#64748b", fontSize: "0.75rem", minWidth: "120px" } })}>
                          {new Date(instance.createdAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td style={getStickyCellStyle(isSystemAdmin ? 5 : 4, { customStyle: { ...cellStyle, textAlign: "center", minWidth: "120px" } })}>
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
                          <td style={getStickyCellStyle(6, { customStyle: { ...cellStyle, textAlign: "center", minWidth: "90px" } })}>
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
                          const stepData = instance.steps?.find((s: any) => 
                            (s.fmsStepId && s.fmsStepId === step.id) || 
                            (s.stepName && s.stepName.trim().toLowerCase() === step.stepName.trim().toLowerCase()) ||
                            (s.id && s.id === step.id)
                          );
                          const isConfigured = !!stepData;
                          
                          // Check if step was marked Not Applicable (Skipped)
                          const isStepNotApplicable = Boolean(
                            stepData && (
                              stepData.status === 'Skipped' || 
                              stepData.status === 'Not Applicable' ||
                              stepData.status === 'not_applicable' ||
                              stepData.inputData?.status === 'Skipped' ||
                              stepData.inputData?.status === 'Not Applicable'
                            )
                          );

                          const isCompleted = Boolean(
                            stepData && !isStepNotApplicable && (
                              stepData.status === 'Completed' ||
                              stepData.inputData?.status === 'Completed'
                            )
                          );
                          
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

                          // Actual Date
                          const formattedActualDate = isStepNotApplicable
                            ? "Not Applicable"
                            : (isCompleted && stepData?.completedAt)
                              ? new Date(stepData.completedAt).toLocaleString(undefined, {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })
                              : "—";

                          // Status styling
                          let bgColor = "transparent";
                          let statusColor = "#64748b";
                          let dotColor = "#94a3b8";
                          const statusText = isStepNotApplicable 
                            ? "Not Applicable" 
                            : isCompleted 
                              ? "Completed" 
                              : isConfigured 
                                ? stepData.status 
                                : "Pending";
                          let delayText = "-";
                          let isDelayed = false;

                          if (isStepNotApplicable) {
                            statusColor = "#475569";
                            dotColor = "#94a3b8";
                            bgColor = "#f8fafc";
                            delayText = "—";
                          } else if (isCompleted) {
                            statusColor = "#166534";
                            dotColor = "#22c55e";
                            bgColor = "#f0fdf4";

                            const compareDate = stepData?.completedAt ? new Date(stepData.completedAt) : new Date();
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
                          } else if (isConfigured) {
                            if (stepData.status === 'Pending') {
                              statusColor = "#1e40af";
                              dotColor = "#3b82f6";
                              delayText = "-";
                            } else if (stepData.status === 'Under Process') {
                              statusColor = "#c2410c";
                              dotColor = "#f97316";
                              bgColor = "#fff7ed";

                              const diffMs = Date.now() - planDate.getTime();
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
                          const instSteps = instance.steps || [];
                          let stepExplicitDeps: string[] = [];
                          if (Array.isArray(step.dependsOnStepIds)) {
                            stepExplicitDeps = step.dependsOnStepIds.filter(Boolean);
                          } else if (typeof step.dependsOnStepIds === 'string') {
                            try {
                              stepExplicitDeps = JSON.parse(step.dependsOnStepIds).filter(Boolean);
                            } catch (e) {
                              stepExplicitDeps = [];
                            }
                          }

                          if (stepExplicitDeps.length > 0) {
                            isBlocked = stepExplicitDeps.some(depId => {
                              const depData = instSteps.find((s: any) => (s.fmsStepId && s.fmsStepId === depId) || s.id === depId);
                              return !depData || (depData.status !== 'Completed' && depData.status !== 'Skipped');
                            });
                          } else if (step.isSequential) {
                            const previousSteps = instSteps.filter((s: any) => s.sequenceOrder < step.sequenceOrder);
                            isBlocked = previousSteps.some((s: any) => s.status === 'Pending' || s.status === 'Under Process');
                          }

                          if (isBlocked) {
                            isDoer = false;
                          }

                          const canEdit = (isSystemAdmin || isDoer) && !isBlocked;

                          return (
                            <React.Fragment key={step.id}>
                              <td title={doerNames} style={{ ...cellStyle, background: bgColor, fontSize: "0.75rem", color: isStepNotApplicable ? "#94a3b8" : "#334155", width: "150px", minWidth: "150px", maxWidth: "150px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {doerNames}
                              </td>
                              <td title={formattedPlanDate} style={{ ...cellStyle, background: bgColor, fontSize: "0.75rem", color: isStepNotApplicable ? "#94a3b8" : "#334155", width: "155px", minWidth: "155px", maxWidth: "155px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {formattedPlanDate}
                              </td>
                              <td title={formattedActualDate} style={{ ...cellStyle, background: bgColor, fontSize: "0.75rem", color: isStepNotApplicable ? "#64748b" : ((isCompleted && stepData?.completedAt) ? "#166534" : "#64748b"), width: "155px", minWidth: "155px", maxWidth: "155px", fontWeight: (isCompleted || isStepNotApplicable) ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {isStepNotApplicable ? (
                                  <span style={{ 
                                    color: "#475569", 
                                    fontWeight: 600, 
                                    fontSize: "0.7rem", 
                                    background: "#e2e8f0", 
                                    padding: "2px 6px", 
                                    borderRadius: "4px",
                                    display: "inline-block"
                                  }}>
                                    Not Applicable
                                  </span>
                                ) : (
                                  formattedActualDate
                                )}
                              </td>
                              <td title={delayText} style={{ ...cellStyle, background: bgColor, fontSize: "0.75rem", fontWeight: isDelayed ? 600 : 500, color: isStepNotApplicable ? "#94a3b8" : (isDelayed ? "#dc2626" : "#16a34a"), width: "100px", minWidth: "100px", maxWidth: "100px" }}>
                                {delayText}
                              </td>
                              <td style={{ ...cellStyle, background: bgColor, width: "135px", minWidth: "135px", maxWidth: "135px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <div 
                                    style={{ 
                                      display: "inline-flex", 
                                      alignItems: "center", 
                                      gap: "6px",
                                      background: isStepNotApplicable 
                                        ? '#f1f5f9' 
                                        : isCompleted 
                                          ? '#dcfce7' 
                                          : statusText === 'Under Process' 
                                            ? '#ffedd5' 
                                            : statusText === 'Pending' 
                                              ? '#dbeafe' 
                                              : '#f1f5f9',
                                      padding: "3px 6px",
                                      borderRadius: "4px",
                                      width: "fit-content",
                                      border: canEdit ? "1px solid #cbd5e1" : "none",
                                      boxShadow: canEdit ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                                    }}
                                  >
                                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dotColor }}></span>
                                    {canEdit ? (
                                      <select
                                        value={isStepNotApplicable ? 'Skipped' : statusText}
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
                                        <option value="Under Process">Under Process</option>
                                        <option value="Completed">Yes</option>
                                        <option value="Skipped">Not Applicable</option>
                                      </select>
                                    ) : (
                                      <span style={{ fontWeight: 600, fontSize: "0.7rem", color: statusColor, whiteSpace: "nowrap" }}>
                                        {isStepNotApplicable ? 'Not Applicable' : statusText}
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

      {/* Freeze Panes Modal */}
      <TableFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={closeFreezeModal}
        settings={freezeSettings}
        availableColumns={availableColumns}
        onSave={saveFreezeSettings}
        onReset={resetFreezeSettings}
        isSaving={isFreezeSaving}
      />
    </div>
  );
}

const metaTopHeaderStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  color: "#94a3b8",
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  background: "#f1f5f9",
  borderBottom: "1px solid #e2e8f0",
  borderRight: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
  height: "38px",
  boxSizing: "border-box",
};

const stepGroupHeaderStyle: React.CSSProperties = {
  padding: "8px 14px",
  textAlign: "center",
  background: "#f8fafc",
  borderBottom: "1px solid #cbd5e1",
  borderRight: "1px solid #cbd5e1",
  whiteSpace: "nowrap",
  height: "38px",
  boxSizing: "border-box",
};

const headerStyle: React.CSSProperties = {
  padding: "9px 12px",
  textAlign: "left",
  color: "#334155",
  fontSize: "0.75rem",
  fontWeight: 600,
  background: "#f8fafc",
  borderBottom: "2px solid #cbd5e1",
  borderRight: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
  height: "38px",
  boxSizing: "border-box",
};

const subHeaderStyle: React.CSSProperties = {
  padding: "9px 10px",
  textAlign: "left",
  color: "#475569",
  fontSize: "0.72rem",
  fontWeight: 600,
  background: "#f8fafc",
  borderBottom: "2px solid #cbd5e1",
  borderRight: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
  height: "38px",
  boxSizing: "border-box",
};

const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
  borderRight: "1px solid #f1f5f9",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
};
