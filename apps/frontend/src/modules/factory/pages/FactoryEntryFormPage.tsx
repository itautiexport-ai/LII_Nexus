import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { factoryEntriesApi } from "../api/factoryEntriesApi";
import { departmentsApi, DepartmentRecord, DepartmentDropdownRecord } from "../../admin/organization/departments/api/departmentsApi";
import { shiftsApi, ShiftRecord } from "../../admin/factory/shifts/api/shiftsApi";
import { contractorsApi, ContractorRecord } from "../../admin/factory/contractors/api/contractorsApi";
import { axiosInstance } from "../../../services/api/axiosInstance";

function today() { return new Date().toISOString().slice(0, 10); }

const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: 12, fontSize: 16, marginBottom: 12, boxSizing: "border-box", border: "1px solid #ccc", borderRadius: 6 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#444" };

export default function FactoryEntryFormPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentDropdownRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [contractors, setContractors] = useState<ContractorRecord[]>([]);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);

  const [form, setForm] = useState({
    entryDate: today(), shiftId: "", factoryDepartmentId: "", orderReference: "",
    skuCode: "", componentName: "",
    targetQty: "", actualQty: "", targetCbm: "", actualCbm: "", targetLabourHours: "", actualLabourHours: "",
    delayMinutes: "0", delayReason: "", rejectionQty: "0", reworkQty: "0", contractorId: "", remarks: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      departmentsApi.listForDropdown(),
      shiftsApi.list(),
      contractorsApi.list(),
      axiosInstance.get("/employees/me"),
    ]).then(([deps, shiftList, contractorList, meRes]) => {
      setDepartments(deps);
      setShifts(shiftList);
      setContractors(contractorList);
      setMyEmployeeId(meRes.data.data?.id ?? null);
      if (deps[0]) setForm((f) => ({ ...f, factoryDepartmentId: deps[0].id }));
      const generalShift = shiftList.find((sh) => sh.name.toLowerCase() === "general");
      if (generalShift) setForm((f) => ({ ...f, shiftId: generalShift.id }));
      else if (shiftList[0]) setForm((f) => ({ ...f, shiftId: shiftList[0].id }));
    });
  }, []);

  const selectedDept = departments.find((d) => d.id === form.factoryDepartmentId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!myEmployeeId) {
      setError("Your login isn't linked to an Employee Master record, so you can't submit a production entry.");
      return;
    }
    if (!selectedDept) return;

    try {
      await factoryEntriesApi.create({
        entryDate: form.entryDate,
        shiftId: form.shiftId,
        factoryDepartmentId: form.factoryDepartmentId,
        orderReference: form.orderReference || undefined,
        productionMethod: "MANUAL", // Defaulting as this field is deprecated but required by API payload for now
        skuCode: form.skuCode,
        componentName: form.componentName,
        targetQty: form.targetQty ? Number(form.targetQty) : undefined,
        actualQty: form.actualQty ? Number(form.actualQty) : undefined,
        targetCbm: form.targetCbm ? Number(form.targetCbm) : undefined,
        actualCbm: form.actualCbm ? Number(form.actualCbm) : undefined,
        targetLabourHours: form.targetLabourHours ? Number(form.targetLabourHours) : undefined,
        actualLabourHours: form.actualLabourHours ? Number(form.actualLabourHours) : undefined,
        delayMinutes: Number(form.delayMinutes) || 0,
        delayReason: form.delayReason || undefined,
        rejectionQty: Number(form.rejectionQty) || 0,
        reworkQty: Number(form.reworkQty) || 0,
        supervisorId: myEmployeeId,
        contractorId: form.contractorId || undefined,
        remarks: form.remarks || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate("/admin/factory-entries"), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to submit production entry.");
    }
  }

  if (success) {
    return <div style={{ maxWidth: 480, margin: "40px auto", textAlign: "center" }}>
      <p style={{ fontSize: 18, color: "#1a7f37" }}>✓ Entry submitted for approval.</p>
    </div>;
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Daily Production Entry</h1>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Date</label>
        <input type="date" required value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} style={inputStyle} />

        <label style={labelStyle}>Shift</label>
        <select required value={form.shiftId} onChange={(e) => setForm({ ...form, shiftId: e.target.value })} style={inputStyle}>
          {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label style={labelStyle}>Department</label>
        <select required value={form.factoryDepartmentId} onChange={(e) => setForm({ ...form, factoryDepartmentId: e.target.value })} style={inputStyle}>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <label style={labelStyle}>Order Reference</label>
        <input value={form.orderReference} onChange={(e) => setForm({ ...form, orderReference: e.target.value })} style={inputStyle} placeholder="e.g. SO-2201" />

        <label style={labelStyle}>SKU</label>
        <input value={form.skuCode} onChange={(e) => setForm({ ...form, skuCode: e.target.value })} style={inputStyle} placeholder="SKU code" />

        <label style={labelStyle}>Component</label>
        <input value={form.componentName} onChange={(e) => setForm({ ...form, componentName: e.target.value })} style={inputStyle} placeholder="Component name" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Target Qty</label><input type="number" value={form.targetQty} onChange={(e) => setForm({ ...form, targetQty: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Actual Qty</label><input type="number" value={form.actualQty} onChange={(e) => setForm({ ...form, actualQty: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Target CBM</label><input type="number" step="0.001" value={form.targetCbm} onChange={(e) => setForm({ ...form, targetCbm: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Actual CBM</label><input type="number" step="0.001" value={form.actualCbm} onChange={(e) => setForm({ ...form, actualCbm: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Target Labour (hrs)</label><input type="number" step="0.5" value={form.targetLabourHours} onChange={(e) => setForm({ ...form, targetLabourHours: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Actual Labour (hrs)</label><input type="number" step="0.5" value={form.actualLabourHours} onChange={(e) => setForm({ ...form, actualLabourHours: e.target.value })} style={inputStyle} /></div>
        </div>

        <label style={labelStyle}>Delay (minutes)</label>
        <input type="number" value={form.delayMinutes} onChange={(e) => setForm({ ...form, delayMinutes: e.target.value })} style={inputStyle} />
        <label style={labelStyle}>Delay Reason</label>
        <input value={form.delayReason} onChange={(e) => setForm({ ...form, delayReason: e.target.value })} style={inputStyle} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Rejection Qty</label><input type="number" value={form.rejectionQty} onChange={(e) => setForm({ ...form, rejectionQty: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Rework Qty</label><input type="number" value={form.reworkQty} onChange={(e) => setForm({ ...form, reworkQty: e.target.value })} style={inputStyle} /></div>
        </div>

        <label style={labelStyle}>Contractor / Team</label>
        <select value={form.contractorId} onChange={(e) => setForm({ ...form, contractorId: e.target.value })} style={inputStyle}>
          <option value="">— None —</option>
          {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label style={labelStyle}>Remarks</label>
        <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={3} style={inputStyle} />

        {error && <p style={{ color: "crimson", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button type="submit" style={{ width: "100%", padding: 14, fontSize: 16, fontWeight: 600 }}>Submit for Approval</button>
      </form>
    </div>
  );
}
