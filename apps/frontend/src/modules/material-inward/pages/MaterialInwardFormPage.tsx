import React, { FormEvent, useEffect, useState, useRef } from "react";
import { materialInwardApi } from "../api/materialInwardApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";

const UOM_OPTIONS = ["Pcs", "Sqft", "Nos", "Kg", "Mtr", "CBM", "CFT", "Bags"];

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function MaterialInwardFormPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    supplierName: "",
    invoiceChallanNo: "",
    vehicleNumber: "",
    driverName: "",
    driverContact: "",
    materialName: "",
    quantityReceived: "",
    uom: "Pcs",
    receivedBy: "",
    remarks: "",
    photoUrl: "" as string | null,
    status: "Pending" as const,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Load active employees
    employeesApi.listForDropdown()
      .then((empList) => {
        setEmployees(empList.filter((e) => e.status === "active"));
      })
      .catch(() => {});
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setIsUploading(true);
    setError(null);

    try {
      const uploadedUrl = await materialInwardApi.uploadPhoto(file);
      setForm((f) => ({ ...f, photoUrl: uploadedUrl }));
      setSuccess("Product photo uploaded successfully.");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload photo to the server. Please try again.");
      setSelectedPhoto(null);
      setPhotoPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setForm((f) => ({ ...f, photoUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.materialName.trim() || !form.quantityReceived || !form.supplierName.trim()) {
      setError("Please fill in all required fields (Material Name, Quantity, and Supplier).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...form,
        invoiceChallanNo: form.invoiceChallanNo.trim() || null,
        quantityReceived: parseFloat(form.quantityReceived),
        vehicleNumber: form.vehicleNumber.trim() || null,
        driverName: form.driverName.trim() || null,
        driverContact: form.driverContact.trim() || null,
        receivedBy: form.receivedBy || null,
        remarks: form.remarks.trim() || null,
        poNumber: null,
        invoiceChallanDate: null,
      };

      const record = await materialInwardApi.create(payload);
      setSuccess(`Material Inward record created successfully: ${record.inwardNo}`);
      
      // Reset form
      setForm({
        supplierName: "",
        invoiceChallanNo: "",
        vehicleNumber: "",
        driverName: "",
        driverContact: "",
        materialName: "",
        quantityReceived: "",
        uom: "Pcs",
        receivedBy: "",
        remarks: "",
        photoUrl: "" as string | null,
        status: "Pending" as const,
      });
      setSelectedPhoto(null);
      setPhotoPreview(null);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.response?.data?.message || "Failed to create material inward record. Please check details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Material Inward</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Register new arrivals and track received inventories.</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: 8, border: "1px solid #fee2e2", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", color: "#15803d", borderRadius: 8, border: "1px solid #dcfce7", marginBottom: 20 }}>
          {success}
        </div>
      )}

      {/* Entry Form Card */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", marginTop: 0, marginBottom: 20 }}>Material Inward Entry Form</h2>
        <form onSubmit={handleSubmit}>
          {/* Grid Layout for Form */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
            {/* Field: Material Name */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                Material/Product Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                name="materialName"
                value={form.materialName}
                onChange={handleInputChange}
                required
                placeholder="e.g. Pine Wood Planks, Hardware Screws"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {/* Field: Quantity Received */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                  Qty Received <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="quantityReceived"
                  value={form.quantityReceived}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                  UOM <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  name="uom"
                  value={form.uom}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, backgroundColor: "#fff" }}
                >
                  {UOM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field: Supplier Name */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                Supplier Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                name="supplierName"
                value={form.supplierName}
                onChange={handleInputChange}
                required
                placeholder="e.g. Laxmi Timber Traders"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {/* Field: Challan Number */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                Challan Number
              </label>
              <input
                type="text"
                name="invoiceChallanNo"
                value={form.invoiceChallanNo}
                onChange={handleInputChange}
                placeholder="Challan Number"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {/* Field: Vehicle Number */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                Vehicle Number
              </label>
              <input
                type="text"
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={handleInputChange}
                placeholder="e.g. DL-1CA-1234"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {/* Field: Driver Name */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                Driver Name
              </label>
              <input
                type="text"
                name="driverName"
                value={form.driverName}
                onChange={handleInputChange}
                placeholder="Driver full name"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {/* Field: Driver Contact */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                Driver Contact
              </label>
              <input
                type="text"
                name="driverContact"
                value={form.driverContact}
                onChange={handleInputChange}
                placeholder="10-digit mobile number"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {/* Field: Received By (Dropdown) */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                Received By Employee
              </label>
              <select
                name="receivedBy"
                value={form.receivedBy}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, backgroundColor: "#fff" }}
              >
                <option value="">-- Select Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Field: Product Photo Upload */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
                Product Photo
              </label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  {isUploading ? "Uploading..." : "Select Image"}
                </button>

                {photoPreview && (
                  <div style={{ position: "relative", width: 50, height: 50, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: "rgba(239, 68, 68, 0.9)",
                        color: "#fff",
                        border: "none",
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        fontSize: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 }}>
              Remarks
            </label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleInputChange}
              rows={3}
              placeholder="Add any material notes, quality concerns, or packing anomalies..."
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              type="reset"
              onClick={() => {
                handleRemovePhoto();
                setError(null);
                setSuccess(null);
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f8fafc",
                color: "#64748b",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              style={{
                padding: "10px 24px",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
              }}
            >
              {isLoading ? "Saving Record..." : "Submit Material Inward"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
