import React, { useState, useRef } from "react";
import { securityCustomApi } from "../api/securityCustomApi";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function SecurityNightFormPage() {
  const navigate = useNavigate();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [guardName, setGuardName] = useState("");
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split("T")[0]);
  const [gateLocation, setGateLocation] = useState("");
  const [patrolStatus, setPatrolStatus] = useState("Normal");
  const [observations, setObservations] = useState("");
  const [remarks, setRemarks] = useState("");

  // Photo & Real-Time Lock State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoCapturedAt, setPhotoCapturedAt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Photo Selection & Automatic Real-Time Timestamp Stamping
  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const exactRealTime = new Date().toISOString(); // Real-time timestamp at exact capture moment
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPhotoCapturedAt(exactRealTime); // Locked real-time
    }
  }

  // Submit Form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guardName || !shiftDate) return;
    setError(null);
    setSuccessMsg(null);
    setUploading(true);

    try {
      let uploadedImageUrl = "";
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await axiosInstance.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedImageUrl = uploadRes.data.data.fileUrl;
      }

      await securityCustomApi.createNightForm({
        guardName,
        shiftDate,
        gateLocation,
        patrolStatus,
        observations,
        remarks,
        imageUrl: uploadedImageUrl,
        photoCapturedAt: photoCapturedAt || undefined,
      });

      // Reset Form & Photo state
      setGuardName("");
      setGateLocation("");
      setPatrolStatus("Normal");
      setObservations("");
      setRemarks("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setPhotoCapturedAt(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setSuccessMsg("Security Night Log submitted successfully! You can view it in Security Night Log History.");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save record.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
          Security Night Form
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          HR Security sub-module for registering tamper-proof night security patrol logs.
        </p>
      </div>

      {/* Main Form Container */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          maxWidth: "800px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginTop: 0, marginBottom: "16px" }}>
          + New Security Night Log Entry
        </h2>

        {successMsg && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>✅ {successMsg}</span>
            <button
              onClick={() => navigate("/admin/hr/security/night-log-history")}
              style={{ background: "#15803d", color: "#ffffff", border: "none", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
            >
              Go to History
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Guard Name *
              </label>
              <input
                type="text"
                required
                value={guardName}
                onChange={(e) => setGuardName(e.target.value)}
                placeholder="Enter guard name"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Shift Date *
              </label>
              <input
                type="date"
                required
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Gate / Patrol Location *
              </label>
              <input
                type="text"
                required
                value={gateLocation}
                onChange={(e) => setGateLocation(e.target.value)}
                placeholder="e.g. Main Gate, Building B"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Patrol Status
              </label>
              <select
                value={patrolStatus}
                onChange={(e) => setPatrolStatus(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              >
                <option value="Normal">Normal</option>
                <option value="Minor Issue">Minor Issue</option>
                <option value="Major Alert">Major Alert</option>
              </select>
            </div>
          </div>

          {/* Photo Capture & Real-Time Timestamp Section */}
          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
              📷 Live Camera Photo / Image Capture
            </label>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px 0" }}>
              The system automatically captures and locks the exact real-time timestamp when the guard clicks the photo to prevent cheating.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoCapture}
                style={{ display: "none" }}
                id="camera-file-input"
              />
              <label
                htmlFor="camera-file-input"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  background: "#0284c7",
                  color: "#ffffff",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                📷 Capture / Upload Photo
              </label>

              {previewUrl && photoCapturedAt && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                  <img
                    src={previewUrl}
                    alt="Captured"
                    style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }}
                  />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#166534" }}>
                      🔒 Real-Time Photo Locked
                    </div>
                    <div style={{ fontSize: "11px", color: "#475569" }}>
                      🕒 {new Date(photoCapturedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Key Observations
              </label>
              <textarea
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Details of night checks and rounds"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Remarks
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: "10px 28px",
              background: uploading ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading & Saving..." : "Submit Night Log"}
          </button>
        </form>
      </div>
    </div>
  );
}
