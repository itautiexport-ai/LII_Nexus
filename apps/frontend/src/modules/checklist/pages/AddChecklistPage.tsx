import React, { useState, useEffect } from "react";
import { standaloneChecklistApi } from "../api/checklistApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { CustomSelect } from "../../../shared/components/CustomSelect";
import * as XLSX from "xlsx";
import "./Checklist.css";

export function AddChecklistPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [formData, setFormData] = useState({
    taskName: "",
    assignBy: "",
    assignTo: "",
    makeAttachmentMandatory: false,
    makeNoteMandatory: false,
    mode: "Online",
    frequency: "",
    remindBeforeDays: "", // used for schedule
    reminderDays: "", // actual reminder days
    skipOnHolidays: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    employeesApi.list().then(setEmployees).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (payload.reminderDays === "") {
        delete payload.reminderDays;
      } else {
        payload.reminderDays = parseInt(payload.reminderDays, 10);
      }

      await standaloneChecklistApi.create(payload);
      alert("Checklist created successfully!");
      setFormData({
        taskName: "",
        assignBy: "",
        assignTo: "",
        makeAttachmentMandatory: false,
        makeNoteMandatory: false,
        mode: "Online",
        frequency: "",
        remindBeforeDays: "",
        reminderDays: "",
        skipOnHolidays: false,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create checklist");
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
        let rowIndex = 2; // Assuming headers are row 1

        for (const rawRow of data as any[]) {
          // Normalize row keys to lowercase to handle header case mismatches (e.g. "TASK NAME" vs "Task Name")
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
          const remindRaw = row["schedule"]; // was remind before days
          const actualReminderRaw = row["reminder days"];
          const skipHolidaysRaw = row["skip on holidays"];

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
          const remindBeforeDays = remindRaw?.toString() || "";
          const reminderDays = actualReminderRaw ? parseInt(actualReminderRaw.toString(), 10) : undefined;

          const makeAttachmentMandatory = (attachmentReq?.toString().toLowerCase().trim() === "yes" || attachmentReq === true);
          const makeNoteMandatory = (noteReq?.toString().toLowerCase().trim() === "yes" || noteReq === true);
          const skipOnHolidays = (skipHolidaysRaw?.toString().toLowerCase().trim() === "yes" || skipHolidaysRaw === true);

          try {
            await standaloneChecklistApi.create({
              taskName,
              assignBy: assignByEmp.id,
              assignTo: assignToEmp.id,
              makeAttachmentMandatory,
              makeNoteMandatory,
              mode,
              frequency,
              remindBeforeDays,
              reminderDays,
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
            <a href="/formats/Checklist_Upload_Format.xlsx" download style={{ color: "#3B82F6", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Download Template</a>
          </div>
        </div>
        
        <div className="chk-card-content">
          <form onSubmit={handleSubmit}>
            <div className="chk-grid">
              
              <div className="chk-form-group">
                <label className="chk-label">Assign By <span className="chk-required">*</span></label>
                <CustomSelect 
                  name="assignBy" 
                  required 
                  value={formData.assignBy} 
                  onChange={handleChange as any} 
                  className="chk-select"
                  placeholder="Select Employee"
                  options={employees.map(e => ({ value: e.id, label: e.fullName }))}
                />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Task Name <span className="chk-required">*</span></label>
                <input type="text" name="taskName" required value={formData.taskName} onChange={handleChange} className="chk-input" placeholder="Enter task name" />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Assign to <span className="chk-required">*</span></label>
                <CustomSelect 
                  name="assignTo" 
                  required 
                  value={formData.assignTo} 
                  onChange={handleChange as any} 
                  className="chk-select"
                  placeholder="Select Employee"
                  options={employees.map(e => ({ value: e.id, label: e.fullName }))}
                />
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
                <label className="chk-label">Frequency <span className="chk-required">*</span></label>
                <select name="frequency" required value={formData.frequency} onChange={handleChange} className="chk-select">
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly(M)">Monthly(M)</option>
                  <option value="Quarterly(Q)">Quarterly(Q)</option>
                  <option value="Yearly(Y)">Yearly(Y)</option>
                  <option value="Between week(BW)">Between week(BW)</option>
                  <option value="Between month(BM)">Between month(BM)</option>
                  <option value="As Required">As Required</option>
                  <option value="Alternate">Alternate</option>
                </select>
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Schedule {formData.frequency !== "Daily" && <span className="chk-required">*</span>}</label>
                <input 
                  type="text" 
                  name="remindBeforeDays" 
                  required={formData.frequency !== "Daily"} 
                  disabled={formData.frequency === "Daily"}
                  value={formData.remindBeforeDays} 
                  onChange={handleChange} 
                  className="chk-input" 
                  placeholder={formData.frequency === "Daily" ? "Not applicable for Daily" : "e.g. 15/7, or Monday"} 
                />
              </div>

              {(formData.frequency === "Monthly(M)" || formData.frequency === "Quarterly(Q)" || formData.frequency === "Yearly(Y)" || formData.frequency === "Between month(BM)") && (
                <div className="chk-form-group">
                  <label className="chk-label">Reminder (Days Before)</label>
                  <input 
                    type="number" 
                    name="reminderDays" 
                    value={formData.reminderDays} 
                    onChange={handleChange} 
                    className="chk-input" 
                    placeholder="e.g. 5" 
                    min="1"
                  />
                </div>
              )}

              <div className="chk-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="chk-checkbox-group">
                  <input type="checkbox" name="skipOnHolidays" checked={formData.skipOnHolidays} onChange={handleChange} className="chk-checkbox" />
                  <span className="chk-checkbox-label">Skip Checklist On Holidays</span>
                </label>
              </div>
            </div>

            <div className="chk-actions">
              <button type="submit" disabled={loading} className="chk-btn-primary">
                {loading ? "Saving..." : "Save Checklist"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
