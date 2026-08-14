import React, { useState, useEffect } from "react";
import { standaloneChecklistApi } from "../api/checklistApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import * as XLSX from "xlsx";
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
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [selectedMonths, setSelectedMonths] = useState<number[]>([2, 5, 8, 11]); // default for Quarterly: Mar, Jun, Sep, Dec (0-indexed)
  const [selectedYearMonth, setSelectedYearMonth] = useState<number>(0); // 0 = Jan, 11 = Dec

  const MONTHS_OF_YEAR = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    employeesApi.list().then(setEmployees).catch(console.error);
  }, []);

  // Calculate next planned date whenever frequency or days rules change
  useEffect(() => {
    const calculatedDate = calculateNextPlannedDate(
      formData.frequency,
      selectedDaysOfWeek,
      selectedDayOfMonth,
      selectedMonths,
      selectedYearMonth
    );
    const whenStr = buildWhenRuleString(
      formData.frequency,
      selectedDaysOfWeek,
      selectedDayOfMonth,
      selectedMonths,
      selectedYearMonth
    );
    setFormData(prev => ({
      ...prev,
      plannedDate: calculatedDate,
      whenRule: whenStr
    }));
  }, [formData.frequency, selectedDaysOfWeek, selectedDayOfMonth, selectedMonths, selectedYearMonth]);

  const buildWhenRuleString = (
    freq: string,
    daysWeek: number[],
    dayMonth: number,
    months: number[] = [],
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
    if (freq === "Quarterly" || freq === "Half-Yearly") {
      const formatted = months.map(m => {
        const dd = String(dayMonth).padStart(2, "0");
        const mm = String(m + 1).padStart(2, "0");
        return `${dd}/${mm}`;
      }).join("; ");
      return formatted;
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
    months: number[] = [],
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
    } else if (freq === "Quarterly" || freq === "Half-Yearly") {
      let bestTarget: Date | null = null;
      for (const m of months) {
        let candidate = new Date(now.getFullYear(), m, dayMonth, 9, 0, 0);
        if (candidate <= now) {
          candidate = new Date(now.getFullYear() + 1, m, dayMonth, 9, 0, 0);
        }
        if (!bestTarget || candidate < bestTarget) {
          bestTarget = candidate;
        }
      }
      if (bestTarget) {
        target = bestTarget;
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

  const toggleMonth = (val: number) => {
    setSelectedMonths(prev => 
      prev.includes(val) ? prev.filter(m => m !== val) : [...prev, val].sort((a, b) => a - b)
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        setLoading(true);
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];
        let rowIndex = 2;

        for (const rawRow of data as any[]) {
          const row: Record<string, any> = {};
          for (const key in rawRow) {
            row[key.toLowerCase().trim()] = rawRow[key];
          }

          const taskName = row["task name"];
          const assignToName = row["assign to"];
          const assignByName = row["assign by"];
          const attachmentReq = row["make attachment mandatory"];
          const noteReq = row["make note mandatory"];
          const modeRaw = row["mode"];
          const freqRaw = row["frequency"];
          const remindRaw = row["remind before days"];
          const skipHolidaysRaw = row["skip on holidays"];
          const plannedDateRaw = row["planned date"];
          const priorityRaw = row["priority"];
          const scheduleRuleRaw = row["schedule rule"] || row["when rule"] || "";

          if (!taskName || !assignToName || !assignByName) {
            failCount++;
            const missing = [];
            if (!taskName) missing.push("Task Name");
            if (!assignToName) missing.push("Assign To");
            if (!assignByName) missing.push("Assign By");
            errors.push(`Row ${rowIndex}: Missing required fields (${missing.join(", ")})`);
            rowIndex++;
            continue;
          }

          const assignToEmp = employees.find(emp => emp.fullName.toLowerCase() === assignToName.toString().toLowerCase().trim());
          const assignByEmp = employees.find(emp => emp.fullName.toLowerCase() === assignByName.toString().toLowerCase().trim());

          if (!assignToEmp) {
            failCount++;
            errors.push(`Row ${rowIndex}: Assign To employee '${assignToName}' not found`);
            rowIndex++;
            continue;
          }
          if (!assignByEmp) {
            failCount++;
            errors.push(`Row ${rowIndex}: Assign By employee '${assignByName}' not found`);
            rowIndex++;
            continue;
          }

          let mRaw = (modeRaw?.toString().toLowerCase().trim()) || "online";
          const mode = mRaw === "offline" ? "Offline" : mRaw === "hybrid" ? "Hybrid" : "Online";

          const frequency = (freqRaw?.toString().trim()) || "Daily";
          const remindBeforeDays = parseInt(remindRaw?.toString(), 10) || 0;

          let priority = (priorityRaw?.toString().trim()) || "Low";
          if (!["Low", "Medium", "High"].includes(priority)) priority = "Low";

          let plannedDateISO: string;
          if (plannedDateRaw) {
            let parsedDate: Date;
            if (typeof plannedDateRaw === 'number') {
              // Excel date serial number (days since Jan 1, 1900)
              // 25569 is the number of days between Jan 1, 1900 and Jan 1, 1970
              parsedDate = new Date(Math.round((plannedDateRaw - 25569) * 86400 * 1000));
            } else {
              parsedDate = new Date(plannedDateRaw);
            }
            plannedDateISO = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
          } else {
            let rowMonths: number[] = [];
            if (frequency === "Quarterly" || frequency === "Half-Yearly") {
              const rule = scheduleRuleRaw.toString().trim();
              const datePairs = rule.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
              for (const pair of datePairs) {
                const [dStr, mStr] = pair.split('/');
                const month = parseInt(mStr, 10) - 1;
                if (!isNaN(month)) rowMonths.push(month);
              }
            }
            plannedDateISO = calculateNextPlannedDate(frequency, selectedDaysOfWeek, selectedDayOfMonth, rowMonths);
            plannedDateISO = new Date(plannedDateISO).toISOString();
          }

          const makeAttachmentMandatory = (attachmentReq?.toString().toLowerCase().trim() === "yes" || attachmentReq === true);
          const makeNoteMandatory = (noteReq?.toString().toLowerCase().trim() === "yes" || noteReq === true);
          const skipOnHolidays = (skipHolidaysRaw?.toString().toLowerCase().trim() === "yes" || skipHolidaysRaw === true);

          try {
            await standaloneChecklistApi.create({
              taskName,
              assignBy: assignByEmp.id,
              assignTo: assignToEmp.id,
              plannedDate: plannedDateISO,
              priority: priority as "Low" | "Medium" | "High",
              makeAttachmentMandatory,
              makeNoteMandatory,
              mode,
              frequency,
              whenRule: scheduleRuleRaw.toString().trim(),
              remindBeforeDays,
              skipOnHolidays
            });
            successCount++;
          } catch (err: any) {
            failCount++;
            errors.push(`Row ${rowIndex}: API Error - ${err?.response?.data?.message || err.message}`);
          }
          rowIndex++;
        }

        if (errors.length > 0) {
          alert(`Bulk Upload Complete.\nSuccess: ${successCount}\nFailed/Skipped: ${failCount}\n\nErrors:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...and more' : ''}`);
        } else {
          alert(`Bulk Upload Complete.\nSuccess: ${successCount}\nFailed/Skipped: ${failCount}`);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file.");
      } finally {
        setLoading(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
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

  const handleDownloadTemplate = async () => {
    try {
      await standaloneChecklistApi.downloadBulkTemplate();
    } catch (err) {
      console.error("Failed to download template", err);
      alert("Failed to download template");
    }
  };

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="chk-title" style={{ margin: 0 }}>ADD CHECKLIST</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ background: "#10b981", color: "white", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 600, textTransform: "uppercase" }}>
              Upload Excel
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
            <button type="button" onClick={handleDownloadTemplate} style={{ background: "transparent", border: "none", color: "#3B82F6", fontSize: 14, textDecoration: "none", fontWeight: 500, cursor: "pointer" }}>Download Template</button>
          </div>
        </div>
        
        <div className="chk-card-content">
          <form onSubmit={handleSubmit}>
            <div className="chk-grid">
              
              <div className="chk-form-group">
                <label className="chk-label">Assign By <span className="chk-required">*</span></label>
                <select name="assignBy" required value={formData.assignBy} onChange={handleChange} className="chk-select">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
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
                  <option value="Half-Yearly">Half-Yearly</option>
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

              {(formData.frequency === "Quarterly" || formData.frequency === "Half-Yearly") && (
                <>
                  <div className="chk-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="chk-label">Select Months <span className="chk-required">*</span></label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                      {MONTHS_OF_YEAR.map((mName, idx) => {
                        const isSelected = selectedMonths.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleMonth(idx)}
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
                            {mName.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
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
              <button type="submit" disabled={loading} className="chk-btn-primary">{loading ? "Saving..." : "Save Checklist"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

