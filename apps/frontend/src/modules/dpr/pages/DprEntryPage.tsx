import React, { FormEvent, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { dprApi, DprEntryRecord, DprItemRecord } from "../api/dprApi";
import { departmentsApi, DepartmentRecord } from "../../admin/organization/departments/api/departmentsApi";
import { masterDataApi, WoodType, Hod } from "../../admin/masterdata/api/masterDataApi";
import { shiftsApi, ShiftRecord } from "../../admin/factory/shifts/api/shiftsApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { axiosInstance } from "../../../services/api/axiosInstance";
import Tesseract from 'tesseract.js';
import * as XLSX from "xlsx";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

const UOM_OPTIONS = ["Pcs", "Sqft", "Nos", "Kg", "Mtr", "CBM", "CFT"];

export default function DprEntryPage() {
  const navigate = useNavigate();

  // Masters
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([]);
  const [hods, setHods] = useState<Hod[]>([]);
  const [todayEntries, setTodayEntries] = useState<DprEntryRecord[]>([]);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [header, setHeader] = useState({
    entryDate: getTodayString(),
    shiftId: "",
    factoryDepartmentId: "",
    supervisorId: "",
    hodId: "",
    totalTarget: 0,
    uom: "Pcs",
    totalAchievement: 0,
    totalRework: 0,
  });

  const [items, setItems] = useState<DprItemRecord[]>([
    { aliasName: "", productCode: "", woodType: "", orderQty: 0, okQty: 0, reworkQty: 0, uom: "Pcs", qtyAsPerUom: null }
  ]);

  const [manpower, setManpower] = useState({
    totalOperator: 0,
    totalHelper: 0,
    totalContractor: 0,
    manpowerDepartmentId: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Load masters & today's entries
  const loadData = async () => {
    try {
      const [deps, shiftList, empList, meRes, entriesRes, woodTypesRes, hodsRes] = await Promise.all([
        departmentsApi.list(),
        shiftsApi.list(),
        employeesApi.listForDropdown(),
        axiosInstance.get("/employees/me"),
        dprApi.list({ entryDate: getTodayString() }),
        masterDataApi.getWoodTypes(),
        masterDataApi.getHods(),
      ]);

      setDepartments(deps);
      setShifts(shiftList);
      setEmployees(empList.filter((e: any) => e.status === "active"));
      setWoodTypes(woodTypesRes.filter((w: any) => w.status === "active"));
      setHods(hodsRes);
      setTodayEntries(entriesRes.items);

      const resolvedEmployeeId = meRes.data.data?.id ?? null;
      setMyEmployeeId(resolvedEmployeeId);

      const generalShift = shiftList.find((s) => s.name.toLowerCase() === "general");
      const defaultShiftId = generalShift ? generalShift.id : (shiftList[0]?.id ?? "");

      setHeader((h) => ({
        ...h,
        factoryDepartmentId: "",
        shiftId: defaultShiftId,
        supervisorId: "",
      }));
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Failed to load departments, shifts, or employee data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update today entries when date changes
  useEffect(() => {
    dprApi.list({ entryDate: header.entryDate }).then((res) => {
      setTodayEntries(res.items);
    }).catch((err) => {
      console.error(err);
    });
  }, [header.entryDate]);

  // Auto-calculate totals from items
  useEffect(() => {
    const autoAchieve = items.reduce((sum, item) => sum + (Number(item.qtyAsPerUom) || 0), 0);
    const autoRework = items.reduce((sum, item) => sum + (Number(item.reworkQty) || 0), 0);
    setHeader(h => ({ ...h, totalAchievement: autoAchieve, totalRework: autoRework }));
  }, [items]);

  // Add Item Row
  const addItemRow = () => {
    setItems([
      ...items,
      { aliasName: "", productCode: "", woodType: "", orderQty: 0, okQty: 0, reworkQty: 0, uom: header.uom, qtyAsPerUom: null }
    ]);
  };

  // Remove Item Row
  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Update Item Row Field
  const updateItemRow = (index: number, field: keyof DprItemRecord, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      // Simple heuristic parsing logic
      // Assume lines look like: "Wardrobe A-Type ITM001 Teak 100 90 Pcs 90 10"
      // This is a naive parser. We split by newlines, extract words/numbers.
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const extractedItems: DprItemRecord[] = [];

      lines.forEach(line => {
        // Attempt to extract numbers
        const numbers = line.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length >= 2) { // Probably a row with quantities
          const nums = numbers.map(Number);
          // Just take the first few numbers as Order, OK, Rework
          const orderQty = nums[0] || 0;
          const okQty = nums[1] || 0;
          const reworkQty = nums.length > 2 ? nums[2] : 0;
          
          // Try to guess Product Code (word with both letters and numbers)
          const words = line.split(/\s+/);
          const productCode = words.find(w => /[a-zA-Z]/.test(w) && /[0-9]/.test(w)) || "";
          
          // Use the rest of the text for alias name roughly
          const textOnlyWords = words.filter(w => !/\d/.test(w));
          const aliasName = textOnlyWords.slice(0, 3).join(" ") || "Scanned Item";

          extractedItems.push({
            aliasName,
            productCode,
            woodType: "", // Hard to reliably extract, leave blank for manual fill
            orderQty,
            okQty,
            reworkQty,
            uom: header.uom,
            qtyAsPerUom: okQty
          });
        }
      });

      if (extractedItems.length > 0) {
        // Replace empty first row if it's the only one, else append
        if (items.length === 1 && !items[0].aliasName && !items[0].productCode && items[0].orderQty === 0) {
          setItems(extractedItems);
        } else {
          setItems([...items, ...extractedItems]);
        }
        setSuccess(`Successfully extracted ${extractedItems.length} rows from image. Please verify the data.`);
      } else {
        setError("Could not find recognizable production data in the image. Please enter manually.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to scan image. Please try again.");
    } finally {
      setIsScanning(false);
      if (scanInputRef.current) scanInputRef.current.value = "";
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!header.factoryDepartmentId || !header.shiftId || !header.supervisorId || !header.hodId) {
      setError("Please fill all required header fields (Department, Shift, Supervisor, HOD Name).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        entryDate: header.entryDate,
        shiftId: header.shiftId,
        factoryDepartmentId: header.factoryDepartmentId,
        supervisorId: header.supervisorId,
        hodId: header.hodId || null,
        totalTarget: Number(header.totalTarget) || 0,
        uom: header.uom,
        totalAchievement: Number(header.totalAchievement) || 0,
        totalRework: Number(header.totalRework) || 0,
        totalOperator: Number(manpower.totalOperator) || 0,
        totalHelper: Number(manpower.totalHelper) || 0,
        totalContractor: Number(manpower.totalContractor) || 0,
        manpowerDepartmentId: manpower.manpowerDepartmentId || null,
        items: items.map(item => ({
          ...item,
          orderQty: Number(item.orderQty) || 0,
          okQty: Number(item.okQty) || 0,
          reworkQty: Number(item.reworkQty) || 0,
          qtyAsPerUom: item.qtyAsPerUom ? Number(item.qtyAsPerUom) : null,
        }))
      };

      await dprApi.create(payload);
      setSuccess("DPR Entry saved successfully!");
      
      // Reset all form details for new entry
      setItems([{
        aliasName: "",
        productCode: "",
        woodType: "",
        orderQty: 0,
        okQty: 0,
        reworkQty: 0,
        uom: header.uom,
        qtyAsPerUom: null,
      }]);

      setManpower({
        totalOperator: 0,
        totalHelper: 0,
        totalContractor: 0,
        manpowerDepartmentId: "",
      });

      setHeader(h => ({
        ...h,
        factoryDepartmentId: "",
        shiftId: "",
        supervisorId: "",
        hodId: "",
        totalTarget: 0,
        totalAchievement: 0,
        totalRework: 0,
      }));

      const newEntriesRes = await dprApi.list({ entryDate: header.entryDate });
      setTodayEntries(newEntriesRes.items);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save DPR Entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this DPR entry?")) return;
    try {
      await dprApi.remove(id);
      const entriesRes = await dprApi.list({ entryDate: header.entryDate });
      setTodayEntries(entriesRes.items);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? "Failed to delete DPR entry.");
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Alias Name": "Wardrobe A-Type",
        "Product Code": "ITM001",
        "Order Quantity": 100,
        "OK Quantity": 90,
        "Re-work Quantity": 10
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "DPR_Item_Template.xlsx");
  };

  return (
    <div style={containerStyle}>
      <style>{PAGE_STYLES}</style>

      {/* Top Banner/Header */}
      <div className="dpr-header">
        <div>
          <h1 className="dpr-title">New DPR Entry</h1>
          <p className="dpr-subtitle">Fill daily production data for your shift</p>
        </div>
        <div>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setImageFile(e.target.files[0]);
              }
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button 
              type="button" 
              onClick={downloadTemplate}
              style={{
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s"
              }}
            >
              📄 Download Template
            </button>
            {imageFile && (
              <span style={{ fontSize: "13px", color: "#6b7280" }}>{imageFile.name}</span>
            )}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: "#1a7f37",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s"
              }}
            >
              📷 {imageFile ? "Change Image" : "Upload Image"}
            </button>
            {imageFile && (
              <button 
                type="button" 
                onClick={() => setImageFile(null)}
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ✕ Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="animate-fade">
            {/* Header Information Section */}
            <div className="dpr-card">
              <div className="card-header">
                <span className="card-icon">📋</span> Header Information
              </div>
              <div className="dpr-grid">
                <div>
                  <label className="dpr-label">DEPARTMENT *</label>
                  <select
                    className="dpr-select"
                    value={header.factoryDepartmentId}
                    onChange={(e) => setHeader({ ...header, factoryDepartmentId: e.target.value })}
                    required
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="dpr-label">SHIFT *</label>
                  <select
                    className="dpr-select"
                    value={header.shiftId}
                    onChange={(e) => setHeader({ ...header, shiftId: e.target.value })}
                    required
                  >
                    <option value="">Select Shift...</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="dpr-label">SUPERVISOR NAME *</label>
                  <select
                    className="dpr-select"
                    value={header.supervisorId}
                    onChange={(e) => setHeader({ ...header, supervisorId: e.target.value })}
                    required
                  >
                    <option value="">Select Supervisor...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="dpr-label">HOD NAME *</label>
                  <select
                    className="dpr-select"
                    value={header.hodId}
                    onChange={(e) => setHeader({ ...header, hodId: e.target.value })}
                    required
                  >
                    <option value="">Select HOD...</option>
                    {hods.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="dpr-label">DATE *</label>
                  <input
                    type="date"
                    className="dpr-input"
                    value={header.entryDate}
                    onChange={(e) => setHeader({ ...header, entryDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="dpr-label">TOTAL TARGET</label>
                  <input
                    type="number"
                    className="dpr-input"
                    value={header.totalTarget}
                    onChange={(e) => setHeader({ ...header, totalTarget: Number(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="dpr-label">UOM (UNIT OF MEASURE)</label>
                  <select
                    className="dpr-select"
                    value={header.uom}
                    onChange={(e) => setHeader({ ...header, uom: e.target.value })}
                  >
                    {UOM_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="dpr-label">TOTAL ACHIEVEMENT</label>
                  <input
                    type="number"
                    className="dpr-input dpr-input-disabled"
                    value={header.totalAchievement}
                    disabled
                  />
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Auto-calculated from items below</div>
                </div>

                <div>
                  <label className="dpr-label">TOTAL RE-WORK</label>
                  <input
                    type="number"
                    className="dpr-input dpr-input-disabled"
                    value={header.totalRework}
                    disabled
                  />
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Auto-calculated from items below</div>
                </div>
              </div>
            </div>

            {/* Item-wise Production Details Section */}
            <div className="dpr-card">
              <div className="card-header-flex">
                <div className="card-header">
                  <span className="card-icon">📦</span> Item-wise Production Details
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    ref={scanInputRef}
                    onChange={handleScanImage}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="dpr-add-btn"
                    onClick={() => scanInputRef.current?.click()}
                    disabled={isScanning}
                    style={{ backgroundColor: isScanning ? "#6b7280" : "#2563eb" }}
                  >
                    {isScanning ? "Scanning..." : "📸 Scan with Camera"}
                  </button>
                  <button
                    type="button"
                    className="dpr-add-btn"
                    onClick={addItemRow}
                  >
                    + Add Item Row
                  </button>
                </div>
              </div>

              <div className="item-rows-container">
                {items.map((item, index) => (
                  <div className="item-row" key={index}>
                    <div className="item-row-header">
                      <span className="item-row-number">{index + 1}</span> Item / Product Row
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="item-delete-btn"
                          onClick={() => removeItemRow(index)}
                        >
                          ✕ Delete Row
                        </button>
                      )}
                    </div>
                    <div className="item-row-grid">
                      <div>
                        <label className="dpr-label">ALIAS NAME</label>
                        <input
                          type="text"
                          className="dpr-input"
                          placeholder="e.g. Wardrobe A-Type"
                          value={item.aliasName || ""}
                          onChange={(e) => updateItemRow(index, "aliasName", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="dpr-label">PRODUCT CODE</label>
                        <input
                          type="text"
                          className="dpr-input"
                          placeholder="e.g. ITM001"
                          value={item.productCode || ""}
                          onChange={(e) => updateItemRow(index, "productCode", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="dpr-label">WOOD TYPE</label>
                        <select
                          className="dpr-select"
                          value={item.woodType || ""}
                          onChange={(e) => updateItemRow(index, "woodType", e.target.value || null)}
                        >
                          <option value="">— Select Wood —</option>
                          {woodTypes.map(wt => (
                            <option key={wt.id} value={wt.name}>{wt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="dpr-label">ORDER QUANTITY</label>
                        <input
                          type="number"
                          className="dpr-input"
                          value={item.orderQty}
                          onChange={(e) => updateItemRow(index, "orderQty", Number(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="dpr-label">OK QUANTITY</label>
                        <input
                          type="number"
                          className="dpr-input"
                          value={item.okQty}
                          onChange={(e) => updateItemRow(index, "okQty", Number(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="dpr-label">UOM</label>
                        <select
                          className="dpr-select"
                          value={item.uom}
                          onChange={(e) => updateItemRow(index, "uom", e.target.value)}
                        >
                          {UOM_OPTIONS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="dpr-label">QTY AS PER UOM</label>
                        <input
                          type="number"
                          className="dpr-input"
                          placeholder="Auto / Enter"
                          value={item.qtyAsPerUom === null ? "" : item.qtyAsPerUom}
                          onChange={(e) => updateItemRow(index, "qtyAsPerUom", e.target.value === "" ? null : Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="dpr-label">RE-WORK</label>
                        <input
                          type="number"
                          className="dpr-input"
                          value={item.reworkQty}
                          onChange={(e) => updateItemRow(index, "reworkQty", Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        <br/>
        {/* Manpower Details */}
            <div className="dpr-card">
              <div className="card-header">
                <span className="card-icon">👷</span> Manpower Details
              </div>
              <div className="dpr-grid">
                <div>
                  <label className="dpr-label">DEPARTMENT</label>
                  <select
                    className="dpr-select"
                    value={manpower.manpowerDepartmentId}
                    onChange={(e) => setManpower({ ...manpower, manpowerDepartmentId: e.target.value })}
                  >
                    <option value="">— Select Department (Optional) —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="dpr-label">TOTAL OPERATOR</label>
                  <input
                    type="number"
                    className="dpr-input"
                    value={manpower.totalOperator}
                    onChange={(e) => setManpower({ ...manpower, totalOperator: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="dpr-label">TOTAL HELPER</label>
                  <input
                    type="number"
                    className="dpr-input"
                    value={manpower.totalHelper}
                    onChange={(e) => setManpower({ ...manpower, totalHelper: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="dpr-label">TOTAL CONTRACTOR</label>
                  <input
                    type="number"
                    className="dpr-input"
                    value={manpower.totalContractor}
                    onChange={(e) => setManpower({ ...manpower, totalContractor: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="dpr-label">TOTAL MANPOWER</label>
                  <input
                    type="number"
                    className="dpr-input read-only"
                    value={(Number(manpower.totalOperator) || 0) + (Number(manpower.totalHelper) || 0) + (Number(manpower.totalContractor) || 0)}
                    readOnly
                  />
                </div>
              </div>
            </div>

        {/* Error / Success Notifications */}
        {error && <div className="alert-message error">{error}</div>}
        {success && <div className="alert-message success">{success}</div>}

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="dpr-btn-cancel"
            onClick={() => navigate("/admin/dashboard")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="dpr-btn-save"
            disabled={submitting}
          >
            💾 {submitting ? "Saving..." : "Save DPR Entry"}
          </button>
        </div>
      </div>
      </form>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "16px 8px 40px 8px",
};

const PAGE_STYLES = `
  .dpr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 16px;
  }
  .dpr-title {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  .dpr-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 4px 0 0;
  }
  .dpr-tab-nav {
    display: flex;
    gap: 8px;
    background: #f3f4f6;
    padding: 4px;
    border-radius: 8px;
  }
  .dpr-tab-btn {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    background: transparent;
    color: #4b5563;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .dpr-tab-btn.active {
    background: #ffffff;
    color: #1a7f37;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .dpr-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .card-header {
    font-size: 16px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }
  .card-header-flex .card-header {
    margin-bottom: 0;
  }
  .card-icon {
    font-size: 18px;
  }

  .dpr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .dpr-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #4b5563;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .dpr-input, .dpr-select {
    display: block;
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-sizing: border-box;
    background: #ffffff;
    color: #111827;
    transition: border-color 0.15s ease;
  }
  .dpr-input:focus, .dpr-select:focus {
    border-color: #1a7f37;
    outline: none;
    box-shadow: 0 0 0 3px rgba(26, 127, 55, 0.1);
  }
  .dpr-input-disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }
  .dpr-input.read-only {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .dpr-add-btn {
    background: #1a7f37;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .dpr-add-btn:hover {
    background: #15652c;
  }

  .item-rows-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .item-row {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: #f9fafb;
  }
  .item-row-header {
    font-size: 14px;
    font-weight: 700;
    color: #4b5563;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .item-row-number {
    background: #1a7f37;
    color: #ffffff;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
  }
  .item-delete-btn {
    margin-left: auto;
    background: transparent;
    color: #d93025;
    border: none;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .item-delete-btn:hover {
    text-decoration: underline;
  }
  .item-row-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
  .dpr-btn-cancel {
    background: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .dpr-btn-cancel:hover {
    background: #f9fafb;
  }
  .dpr-btn-save {
    background: #1a7f37;
    color: #ffffff;
    border: none;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .dpr-btn-save:hover:not(:disabled) {
    background: #15652c;
  }
  .dpr-btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .alert-message {
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    margin-top: 16px;
    font-weight: 500;
  }
  .alert-message.error {
    background: #fde8e8;
    color: #9b1c1c;
    border: 1px solid #f8b4b4;
  }
  .alert-message.success {
    background: #def7ec;
    color: #03543f;
    border: 1px solid #84e1bc;
  }

  .dpr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }
  .dpr-table th {
    background: #f9fafb;
    color: #4b5563;
    padding: 12px 16px;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
  }
  .dpr-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
  }
  .dpr-table tr:hover {
    background: #f9fafb;
  }
  .no-data {
    text-align: center;
    color: #6b7280;
    padding: 24px !important;
  }
  .action-delete {
    background: transparent;
    color: #d93025;
    border: none;
    font-weight: 600;
    cursor: pointer;
  }
  .action-delete:hover {
    text-decoration: underline;
  }

  .animate-fade {
    animation: fadeIn 0.2s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
