import React, { useState, useRef } from "react";
import { securityCustomApi } from "../api/securityCustomApi";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function VisitorEntryPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [personToMeet, setPersonToMeet] = useState("");
  const [purpose, setPurpose] = useState("");

  // Optional Photo State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoTime, setPhotoTime] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Start Camera
  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setVideoStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access failed", err);
      setError("Could not access webcam. Please ensure camera permissions are granted or select a file instead.");
    }
  }

  // Stop Camera
  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setCameraActive(false);
  }

  // Capture Photo
  async function capturePhoto() {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        setUploading(true);
        try {
          const file = new File([blob], "visitor_photo.jpg", { type: "image/jpeg" });
          const formData = new FormData();
          formData.append("file", file);
          
          const uploadRes = await axiosInstance.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          
          setCapturedImage(uploadRes.data.data.fileUrl);
          setPhotoTime(new Date().toISOString());
          stopCamera();
        } catch (err: any) {
          setError("Failed to upload captured photo: " + (err.message || "Error"));
        } finally {
          setUploading(false);
        }
      }, "image/jpeg", 0.85);
      
    } catch (err: any) {
      setError("Capture failed: " + err.message);
    }
  }



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!visitorName) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await securityCustomApi.createVisitorEntry({
        visitorName,
        phone,
        companyName,
        personToMeet,
        purpose,
        imageUrl: capturedImage || undefined,
        photoCapturedAt: photoTime || undefined,
      });

      // Reset
      setVisitorName("");
      setPhone("");
      setCompanyName("");
      setPersonToMeet("");
      setPurpose("");
      setCapturedImage(null);
      setPhotoTime(null);

      setSuccessMsg("Visitor checked in successfully! You can view the log in Visitor Entry History.");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save visitor entry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
          Visitor Entry
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          HR Security sub-module for checking in new visitors and guests.
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
          + New Visitor Entry Check-In
        </h2>

        {successMsg && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>✅ {successMsg}</span>
            <button
              onClick={() => navigate("/admin/hr/security/visitor-entry-history")}
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
                Visitor Name *
              </label>
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Enter full name"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter contact number"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Company / Organization
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Person to Meet
              </label>
              <input
                type="text"
                value={personToMeet}
                onChange={(e) => setPersonToMeet(e.target.value)}
                placeholder="Host employee name"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>

          {/* Photo Section */}
          <div style={{ marginBottom: "20px", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "16px", background: "#f8fafc" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
              Visitor Photo (Optional)
            </label>
            
            {capturedImage ? (
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <img 
                  src={capturedImage} 
                  alt="Visitor Preview" 
                  style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #cbd5e1" }} 
                />
                <div>
                  <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: "600", marginBottom: "4px" }}>
                    ✓ Photo Ready
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCapturedImage(null); setPhotoTime(null); }}
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {cameraActive ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "320px" }}>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      style={{ width: "100%", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#000" }} 
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={uploading}
                        style={{
                          flex: 1,
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {uploading ? "Uploading..." : "📸 Take Snapshot"}
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        style={{
                          background: "#64748b",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={startCamera}
                      style={{
                        background: "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      📷 Use Web Camera
                    </button>
                    {uploading && <span style={{ fontSize: "13px", color: "#64748b" }}>Uploading...</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
              Purpose of Visit
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Official Meeting, Delivery"
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 28px",
              background: loading ? "#94a3b8" : "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Checking In..." : "Check-In Visitor"}
          </button>
        </form>
      </div>
    </div>
  );
}
