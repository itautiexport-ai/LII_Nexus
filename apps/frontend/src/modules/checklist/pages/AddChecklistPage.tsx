import React, { useState, useEffect } from "react";
import { standaloneChecklistApi } from "../api/checklistApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import "./Checklist.css";

const DAYS_OF_WEEK = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

export function AddChecklistPage() {
  const user = useAuthStore(s => s.user);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    taskName: "",
    assignBy: "",
    assignTo: "",
    plannedDate: "",
    priority: "Low" as "Low" | "Medium" | "High",
    makeAttachmentMandatory: false,
    makeNoteMandatory: false,
    mode: "Online",
    frequency: "Daily",
    whenRule: "",
    remindBeforeDays: 0,
    skipOnHolidays: false,
  });

  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1, 3, 5]); // default Mon, Wed, Fri
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(1);
  const [selectedQuarterMonth, setSelectedQuarterMonth] = useState<number>(1); // 1st, 2nd, or 3rd month of quarter
  const [selectedYearMonth, setSelectedYearMonth] = useState<number>(0); // 0 = Jan, 11 = Dec

  const MONTHS_OF_YEAR = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

    employeesApi.list().then(setEmployees).catch(console.error);
  }, [user]);

  // Calculate next planned date whenever frequency or days rules change
  useEffect(() => {
    const calculatedDate = calculateNextPlannedDate(
      formData.frequency,
      selectedDaysOfWeek,
      selectedDayOfMonth,
      selectedQuarterMonth,
      selectedYearMonth
    );
    const whenStr = buildWhenRuleString(
      formData.frequency,
      selectedDaysOfWeek,
      selectedDayOfMonth,
      selectedQuarterMonth,
      selectedYearMonth
    );
    setFormData(prev => ({
      ...prev,
      plannedDate: calculatedDate,
      whenRule: whenStr
    }));
  }, [formData.frequency, selectedDaysOfWeek, selectedDayOfMonth, selectedQuarterMonth, selectedYearMonth]);

  const buildWhenRuleString = (
    freq: string,
    daysWeek: number[],
    dayMonth: number,
    qMonth: number = 1,
    yMonth: number = 0
  ) => {
    if (freq === "Daily") return "Daily execution";
    if (freq === "Weekly" || freq === "Alternate") {
      const names = daysWeek.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label).filter(Boolean);
      return names.length > 0 ? `Every ${names.join(", ")}` : "Select days";
    }
    if (freq === "Monthly") {
      return `Day ${dayMonth} of every month`;
    }
    if (freq === "Quarterly") {
      const ord = qMonth === 1 ? "1st" : qMonth === 2 ? "2nd" : "3rd";
      return `Quarterly - ${ord} Month of Quarter, Day ${dayMonth}`;
    }
    if (freq === "Yearly") {
      return `Yearly - ${MONTHS_OF_YEAR[yMonth]} ${dayMonth}`;
    }
    return "";
  };

  const calculateNextPlannedDate = (
    freq: string,
    daysWeek: number[],
    dayMonth: number,
    qMonth: number = 1,
    yMonth: number = 0
  ): string => {
    const now = new Date();
    let target = new Date();
    target.setHours(9, 0, 0, 0); // Default to 9:00 AM

    if (freq === "Daily") {
      if (now.getHours() >= 18) {
        target.setDate(target.getDate() + 1);
      }
    } else if (freq === "Weekly" || freq === "Alternate") {
      if (daysWeek.length > 0) {
        let currentDay = now.getDay();
        let daysToAdd = 0;
        for (let i = 0; i < 7; i++) {
          const testDay = (currentDay + i) % 7;
          if (daysWeek.includes(testDay)) {
            daysToAdd = i;
            break;
          }
        }
        target.setDate(target.getDate() + daysToAdd);
      }
    } else if (freq === "Monthly") {
      target.setDate(dayMonth);
      if (target < now) {
        target.setMonth(target.getMonth() + 1);
      }
    } else if (freq === "Quarterly") {
      const currentMonth = now.getMonth();
      const currentQuarterStart = Math.floor(currentMonth / 3) * 3;
      let targetMonth = currentQuarterStart + (qMonth - 1);
      target = new Date(now.getFullYear(), targetMonth, dayMonth, 9, 0, 0);
      if (target < now) {
        target = new Date(now.getFullYear(), targetMonth + 3, dayMonth, 9, 0, 0);
      }
    } else if (freq === "Yearly") {
      target = new Date(now.getFullYear(), yMonth, dayMonth, 9, 0, 0);
      if (target < now) {
        target = new Date(now.getFullYear() + 1, yMonth, dayMonth, 9, 0, 0);
      }
    }

    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const date = String(target.getDate()).padStart(2, "0");
    const hours = String(target.getHours()).padStart(2, "0");
    const minutes = String(target.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${date}T${hours}:${minutes}`;
  };

  const toggleDayOfWeek = (val: number) => {
    setSelectedDaysOfWeek(prev => 
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val].sort()
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "remindBeforeDays") {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await standaloneChecklistApi.create({
        ...formData,
        plannedDate: new Date(formData.plannedDate).toISOString()
      });
      alert("Checklist created successfully!");
      setFormData({
        taskName: "",
        assignBy: "",
        assignTo: "",
        plannedDate: calculateNextPlannedDate("Daily", [1, 3, 5], 1),
        priority: "Low",
        makeAttachmentMandatory: false,
        makeNoteMandatory: false,
        mode: "Online",
        frequency: "Daily",
        whenRule: "Daily execution",
        remindBeforeDays: 0,
        skipOnHolidays: false,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create checklist");
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
          Only employees with the designation <strong>Admin</strong>, <strong>Admin Executive</strong>, or <strong>Director</strong> are allowed to add checklists.
        </p>
      </div>
    );
  }

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header">
          <h2 className="chk-title">ADD CHECKLIST</h2>
        </div>
        
        <div className="chk-card-content">
          <form onSubmit={handleSubmit}>
            <div className="chk-grid">
              
              <div className="chk-form-group">
                <label className="chk-label">Assign By <span className="chk-required">*</span></label>
                <select name="assignBy" required value={formData.assignBy} onChange={handleChange} className="chk-select">
                  <option value="">Select Employee</option>
                  {employees
                    .filter(e => {
                      const title = e.designationTitle?.trim().toLowerCase() || "";
                      return title === "admin" || title === "director" || title === "executive director";
                    })
                    .map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)
                  }
                </select>
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Task Name <span className="chk-required">*</span></label>
                <input type="text" name="taskName" required value={formData.taskName} onChange={handleChange} className="chk-input" placeholder="Enter task name" />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Assign to <span className="chk-required">*</span></label>
                <select name="assignTo" required value={formData.assignTo} onChange={handleChange} className="chk-select">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                </select>
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Frequency <span className="chk-required">*</span></label>
                <select name="frequency" required value={formData.frequency} onChange={handleChange} className="chk-select">
                  <option value="Daily">Daily</option>
                  <option value="Alternate">Alternate</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              {/* Dynamic Days / Month selection based on Frequency */}
              {(formData.frequency === "Weekly" || formData.frequency === "Alternate") && (
                <div className="chk-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="chk-label">Select Scheduled Days (e.g. Every Tue, Thu, Sat) <span className="chk-required">*</span></label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                    {DAYS_OF_WEEK.map(d => {
                      const isSelected = selectedDaysOfWeek.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(d.value)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 20,
                            border: isSelected ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                            background: isSelected ? "#eff6ff" : "#fff",
                            color: isSelected ? "#1d4ed8" : "#475569",
                            fontWeight: isSelected ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>Rule: {formData.whenRule}</span>
                </div>
              )}

              {formData.frequency === "Quarterly" && (
                <>
                  <div className="chk-form-group">
                    <label className="chk-label">Month of Quarter <span className="chk-required">*</span></label>
                    <select
                      value={selectedQuarterMonth}
                      onChange={(e) => setSelectedQuarterMonth(parseInt(e.target.value, 10))}
                      className="chk-select"
                    >
                      <option value={1}>1st Month of Quarter (Jan / Apr / Jul / Oct)</option>
                      <option value={2}>2nd Month of Quarter (Feb / May / Aug / Nov)</option>
                      <option value={3}>3rd Month of Quarter (Mar / Jun / Sep / Dec)</option>
                    </select>
                  </div>
                  <div className="chk-form-group">
                    <label className="chk-label">Day of Month <span className="chk-required">*</span></label>
                    <select
                      value={selectedDayOfMonth}
                      onChange={(e) => setSelectedDayOfMonth(parseInt(e.target.value, 10))}
                      className="chk-select"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>Day {day}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>Rule: {formData.whenRule}</span>
                  </div>
                </>
              )}

              {formData.frequency === "Yearly" && (
                <>
                  <div className="chk-form-group">
                    <label className="chk-label">Month of Year <span className="chk-required">*</span></label>
                    <select
                      value={selectedYearMonth}
                      onChange={(e) => setSelectedYearMonth(parseInt(e.target.value, 10))}
                      className="chk-select"
                    >
                      {MONTHS_OF_YEAR.map((mName, idx) => (
                        <option key={idx} value={idx}>{mName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="chk-form-group">
                    <label className="chk-label">Day of Month <span className="chk-required">*</span></label>
                    <select
                      value={selectedDayOfMonth}
                      onChange={(e) => setSelectedDayOfMonth(parseInt(e.target.value, 10))}
                      className="chk-select"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>Day {day}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>Rule: {formData.whenRule}</span>
                  </div>
                </>
              )}

              {formData.frequency === "Monthly" && (
                <div className="chk-form-group">
                  <label className="chk-label">Day of Month <span className="chk-required">*</span></label>
                  <select
                    value={selectedDayOfMonth}
                    onChange={(e) => setSelectedDayOfMonth(parseInt(e.target.value, 10))}
                    className="chk-select"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>Day {day}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>Rule: {formData.whenRule}</span>
                </div>
              )}

              <div className="chk-form-group">
                <label className="chk-label">Planned Date <span className="chk-required">*</span> (Auto-calculated)</label>
                <input type="datetime-local" name="plannedDate" required value={formData.plannedDate} onChange={handleChange} className="chk-input" />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Priority <span className="chk-required">*</span></label>
                <select name="priority" required value={formData.priority} onChange={handleChange} className="chk-select">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="chk-form-group" style={{ justifyContent: 'center' }}>
                <label className="chk-checkbox-group">
                  <input type="checkbox" name="makeAttachmentMandatory" checked={formData.makeAttachmentMandatory} onChange={handleChange} className="chk-checkbox" />
                  <span className="chk-checkbox-label">Make Attachment Mandatory When Work Done</span>
                </label>
              </div>

              <div className="chk-form-group" style={{ justifyContent: 'center' }}>
                <label className="chk-checkbox-group">
                  <input type="checkbox" name="makeNoteMandatory" checked={formData.makeNoteMandatory} onChange={handleChange} className="chk-checkbox" />
                  <span className="chk-checkbox-label">Make Note Mandatory When Work Done</span>
                </label>
              </div>
            </div>

            <hr className="chk-divider" />

            <div className="chk-grid">
              <div className="chk-form-group">
                <label className="chk-label">Mode <span className="chk-required">*</span></label>
                <select name="mode" required value={formData.mode} onChange={handleChange} className="chk-select">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Remind Before Days <span className="chk-required">*</span></label>
                <input type="number" name="remindBeforeDays" required min={0} value={formData.remindBeforeDays} onChange={handleChange} className="chk-input" />
              </div>

              <div className="chk-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="chk-checkbox-group">
                  <input type="checkbox" name="skipOnHolidays" checked={formData.skipOnHolidays} onChange={handleChange} className="chk-checkbox" />
                  <span className="chk-checkbox-label">Skip Checklist On Holidays</span>
                </label>
              </div>
            </div>

            <div className="chk-actions">
              <button type="submit" className="chk-btn-primary">Save Checklist</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

