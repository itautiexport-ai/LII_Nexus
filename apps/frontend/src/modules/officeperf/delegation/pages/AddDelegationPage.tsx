import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";
import { delegationApi, DelegationPriority } from "../api/delegationApi";
import { employeesApi } from "../../../admin/organization/employees/api/employeesApi";
import { CustomSelect } from "../../../../shared/components/CustomSelect";
import * as XLSX from "xlsx";

export default function AddDelegationPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<DelegationPriority>("low");
  const [sendAppNotification, setSendAppNotification] = useState(true);
  const [sendWhatsappNotification, setSendWhatsappNotification] = useState(true);
  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    employeesApi.listForDropdown().then(res => setEmployees(res));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo || !dueDate) {
      alert("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      await delegationApi.create({
        title,
        assignedBy: assignedBy || undefined,
        assignedTo,
        dueDate,
        priority,
        sendAppNotification,
        sendWhatsappNotification
      });
      navigate("/admin/delegation/list"); // Redirect to list page
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to create delegation.");
    } finally {
      setLoading(false);
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
        const errorMessages: string[] = [];
        let rowIndex = 1; // 1 for header

        for (const row of data as any[]) {
          rowIndex++;
          const title = row["Task Name"];
          const assignToName = row["Assign To"];
          const assignByName = row["Assign By"];
          const dueDateRaw = row["Planned Date"];
          const priorityRaw = row["Priority"];
          const appNotifRaw = row["Send App Notification"];
          const waNotifRaw = row["Send WhatsApp Notification"];

          if (!title || !assignToName || !dueDateRaw) {
            failCount++;
            errorMessages.push(`Row ${rowIndex}: Missing Task Name, Assign To, or Planned Date.`);
            continue;
          }

          const assignToEmp = employees.find(emp => emp.fullName.toLowerCase() === assignToName.toString().toLowerCase());
          const assignByEmp = assignByName ? employees.find(emp => emp.fullName.toLowerCase() === assignByName.toString().toLowerCase()) : null;

          if (!assignToEmp) {
            failCount++;
            errorMessages.push(`Row ${rowIndex}: Employee '${assignToName}' not found in the system.`);
            continue;
          }

          let dueDateStr = dueDateRaw;
          if (typeof dueDateRaw === 'number') {
            const date = new Date(Math.round((dueDateRaw - 25569) * 86400 * 1000));
            dueDateStr = date.toISOString().split('T')[0];
          } else {
            dueDateStr = new Date(dueDateRaw).toISOString().split('T')[0];
          }

          const prio = (priorityRaw?.toString().toLowerCase()) || "low";
          const sendAppNotif = (appNotifRaw?.toString().toLowerCase() === "yes" || appNotifRaw === true);
          const sendWaNotif = (waNotifRaw?.toString().toLowerCase() === "yes" || waNotifRaw === true);

          try {
            await delegationApi.create({
              title,
              assignedBy: assignByEmp?.id || user?.id || "",
              assignedTo: assignToEmp.id,
              dueDate: dueDateStr,
              priority: prio as DelegationPriority,
              sendAppNotification: sendAppNotif,
              sendWhatsappNotification: sendWaNotif
            });
            successCount++;
          } catch (err: any) {
            failCount++;
            errorMessages.push(`Row ${rowIndex}: ${err.response?.data?.error?.message || err.message || "API Error"}`);
          }
        }

        const errorDetails = errorMessages.length > 0 ? `\n\nErrors:\n${errorMessages.join("\n")}` : "";
        alert(`Bulk Upload Complete.\nSuccess: ${successCount}\nFailed/Skipped: ${failCount}${errorDetails}`);
        navigate("/admin/delegation/list");
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
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1F2937", textTransform: "uppercase" }}>Add Delegation</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ background: "#10b981", color: "white", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 600, textTransform: "uppercase" }}>
            Upload Excel
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
          <a href="/formats/Delegation_Upload_Format.xlsx" download style={{ color: "#3B82F6", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Download Template</a>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Assign By <span style={{color: "red"}}>*</span></label>
              <CustomSelect
                value={assignedBy}
                onChange={e => setAssignedBy(e.target.value)}
                options={employees.map(emp => ({ value: emp.id, label: emp.fullName }))}
                placeholder="Select One"
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Task Name <span style={{color: "red"}}>*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Assign to <span style={{color: "red"}}>*</span></label>
              <CustomSelect
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                options={employees.map(emp => ({ value: emp.id, label: emp.fullName }))}
                placeholder="Select One"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Planned Date <span style={{color: "red"}}>*</span></label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Priority <span style={{color: "red"}}>*</span></label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as DelegationPriority)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 4, boxSizing: "border-box" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              <input 
                type="checkbox" 
                checked={sendAppNotification} 
                onChange={(e) => setSendAppNotification(e.target.checked)} 
              />
              Send App Notification (User ID)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              <input 
                type="checkbox" 
                checked={sendWhatsappNotification} 
                onChange={(e) => setSendWhatsappNotification(e.target.checked)} 
              />
              Send WhatsApp Notification
            </label>
          </div>

          <div style={{ textAlign: "center", borderTop: "1px solid #E5E7EB", paddingTop: 24 }}>
            <div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#3B82F6",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "10px 48px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
