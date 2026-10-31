import React, { useState, useEffect } from "react";
import { securityCustomApi } from "../api/securityCustomApi";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../modules/auth/hooks/useAuthStore";

interface UploadedFile {
  url: string;
  capturedAt: string;
}

const CHECKPOINTS = [
  { id: "1", label: "1. पैकिंग हॉल - फोटो" },
  { id: "2", label: "2. पेन्ट बूथ - फोटो" },
  { id: "3", label: "3. सेन्डिंग एरिया - फोटो" },
  { id: "4", label: "4. फायर पैनल - फोटो" },
  { id: "5", label: "5. एसएस वर्क्स शाॅप एंव पैनल - फोटो" },
  { id: "6", label: "6. पाउडर कोटिंग प्लांट पैनल - फोटो" },
  { id: "7", label: "7. सीएनसी लेजर मशीन पैनल - फोटो" },
  { id: "8", label: "8. प्रथम तल पैनल रूम - फोटो" },
  { id: "9", label: "9. प्रथम तल पैकिंग एरिया - फोटो" },
  { id: "10", label: "10. ऑफिस एरिया के पास खेड होकर गार्ड स्वयं की फोटो खीचेगा - फोटो" },
  { id: "11", label: "11. केमिकल स्टोर - फोटो" },
  { id: "12", label: "12. कार्टन रॉ मैटेिरयल एरिया - फोटो" },
  { id: "13", label: "13. C.T.P - फोटो" },
  { id: "14", label: "14. एच टी पैनल रूम / पिछे वाला गेट - फोटो" },
  { id: "15", label: "15. पावर पैनल रूम / ट्रांसफारमर - फोटो" },
  { id: "16", label: "16. वुड स्टोर - फोटो" },
  { id: "17", label: "17. सीज़निंग चैम्बर - फोटो" },
  { id: "18", label: "18. बॉयलर / आँपरेटर /हैल्पर - फोटो" },
  { id: "19", label: "19. मशीन शोप पॉवर पैनल - फोटो" },
  { id: "20", label: "20. डस्ट कलेक्टर एरिया - फोटो" },
  { id: "21", label: "21. मशीन शोप (इनसाइड) - फोटो" },
  { id: "22", label: "22. सीएनसी वुडन / आँपरेटर - फोटो" },
  { id: "23", label: "23. मशीन शोप (आउटसाइड) - फोटो" },
  { id: "24", label: "24. नया प्लांट - फोटो" },
  { id: "25", label: "25. गेट नई फैक्ट्री - फोटो" },
  { id: "26", label: "26. कैंटीन - फोटो" },
  { id: "27", label: "27. स्वयं की फोटो मशीन के साथ - फोटो" },
];

export default function SecurityNightFormPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [uploadingCheckpoints, setUploadingCheckpoints] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [guardName, setGuardName] = useState("");
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split("T")[0]);
  const [patrolStatus, setPatrolStatus] = useState("Normal");
  const [observations, setObservations] = useState("");
  const [remarks, setRemarks] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Map of checkpoint ID to UploadedFile
  const [images, setImages] = useState<Record<string, UploadedFile>>({});

  // Google Forms active card indicator state
  const [focusedCard, setFocusedCard] = useState<string | null>(null);

  // File Upload
  async function handleFileUpload(checkpointId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingCheckpoints((prev) => ({ ...prev, [checkpointId]: true }));
    setError(null);

    try {
      const exactRealTime = new Date().toISOString();
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axiosInstance.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = uploadRes.data.data.fileUrl;
      setImages((prev) => ({
        ...prev,
        [checkpointId]: {
          url,
          capturedAt: exactRealTime,
        },
      }));
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to upload image.");
    } finally {
      setUploadingCheckpoints((prev) => ({ ...prev, [checkpointId]: false }));
      e.target.value = "";
    }
  }

  // Remove Checkpoint Image
  function handleRemoveImage(checkpointId: string) {
    const updatedImages = { ...images };
    delete updatedImages[checkpointId];
    setImages(updatedImages);
  }

  // Clear Form
  function handleClearForm() {
    if (window.confirm("Are you sure you want to clear all form fields?")) {
      setGuardName("");
      setImages({});
      setObservations("");
      setRemarks("");
      setEmergencyContact("");
      setPatrolStatus("Normal");
      setError(null);
      setSuccessMsg(null);
    }
  }

  // Submit Form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guardName) {
      setError("गार्ड का नाम आवश्यक है / Guard Name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Serialize checkpoint images map to JSON string
      const imageUrlsStr = JSON.stringify(images);

      // Lock first photo time, or default to current timestamp
      const primaryPhotoTime = Object.values(images).length > 0 
        ? Object.values(images)[0].capturedAt 
        : new Date().toISOString();

      // Append emergency contact info to observations for transparency
      let finalObservations = observations;
      if (emergencyContact) {
        finalObservations = `${observations ? observations + "\n" : ""}Emergency Call Selection: ${emergencyContact}`;
      }

      await securityCustomApi.createNightForm({
        guardName,
        shiftDate,
        gateLocation: "Factory Patrol Areas",
        patrolStatus,
        observations: finalObservations,
        remarks,
        imageUrl: imageUrlsStr,
        photoCapturedAt: primaryPhotoTime,
      });

      setGuardName("");
      setImages({});
      setObservations("");
      setRemarks("");
      setEmergencyContact("");
      setPatrolStatus("Normal");
      setSuccessMsg("Security Night Log submitted successfully! You can view it in Security Night Log History.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        background: "#f0ebf8",
        minHeight: "100vh",
        padding: "24px 12px",
        fontFamily: "Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Top Banner Navigation Bar */}
      <div
        style={{
          maxWidth: "770px",
          margin: "0 auto 16px auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate("/admin/hr/security/night-log-history")}
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          📂 View History Logs / इतिहास देखें
        </button>
      </div>

      <div style={{ maxWidth: "770px", margin: "0 auto" }}>
        {/* Banner + Title Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #dadce0",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            borderTop: "10px solid #673ab7",
          }}
        >
          {/* Stunning Night Sky Banner Gradient */}
          <div
            style={{
              height: "180px",
              background: "linear-gradient(135deg, #120024 0%, #311b92 50%, #512da8 100%)",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Silhouette & Flashlight Beam Simulation */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "15%",
                width: "40px",
                height: "80px",
                background: "rgba(0,0,0,0.35)",
                clipPath: "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "75px",
                right: "13.5%",
                width: "600px",
                height: "600px",
                background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
                transform: "translate(50%, 50%) rotate(-45deg)",
                pointerEvents: "none",
              }}
            />
            {/* Stars */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "10%",
                width: "3px",
                height: "3px",
                background: "#ffffff",
                borderRadius: "50%",
                boxShadow: "100px 30px #fff, 200px 10px #fff, 350px 80px #fff, 500px 40px #fff",
              }}
            />
            <h2
              style={{
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                zIndex: 10,
              }}
            >
              🔒 Security Guard Checkpoints
            </h2>
          </div>

          <div style={{ padding: "24px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "400", color: "#202124", margin: "0 0 8px 0" }}>
              नाईट गार्ड सिक्योरिटी फॉर्म
            </h1>
            <p style={{ fontSize: "14px", color: "#202124", margin: "0 0 16px 0" }}>
              सुरक्षा गार्ड की कार्य सारणी (हर 2 घन्टे में फॉर्म भरे)
            </p>

            <hr style={{ border: "0", borderTop: "1px solid #dadce0", margin: "16px 0" }} />

            {/* User Logged-in Info block */}
            <div
              style={{
                border: "1px solid #dadce0",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#3c4043",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <strong>{user?.email || "unknown@liinexus.com"}</strong>
                </span>
                <span style={{ fontSize: "12px", color: "#1a73e8", cursor: "pointer", textDecoration: "underline" }}>
                  Switch account
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#70757a" }}>
                <span style={{ fontSize: "16px" }}>☁️</span>
                <span>
                  The name and email associated with your account will be recorded when you submit this form.
                </span>
              </div>
            </div>

            <div style={{ color: "#d93025", fontSize: "14px", marginTop: "16px" }}>
              * Indicates required question
            </div>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {successMsg && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderLeft: "6px solid #16a34a",
              borderRadius: "8px",
              padding: "16px 24px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              color: "#166534",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: "600", fontSize: "15px" }}>✅ Success!</div>
              <div style={{ fontSize: "13px", marginTop: "2px" }}>{successMsg}</div>
            </div>
            <button
              onClick={() => navigate("/admin/hr/security/night-log-history")}
              style={{
                background: "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Go to History Logs
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dadce0",
              borderLeft: "6px solid #d93025",
              borderRadius: "8px",
              padding: "16px 24px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              color: "#c9241a",
            }}
          >
            <div style={{ fontWeight: "600", fontSize: "15px" }}>⚠️ Error / त्रुटि</div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>{error}</div>
          </div>
        )}

        {/* FORM START */}
        <form onSubmit={handleSubmit}>
          {/* Guard Name Card */}
          <div
            onFocus={() => setFocusedCard("guardName")}
            onBlur={() => setFocusedCard(null)}
            style={{
              background: "#ffffff",
              border: "1px solid #dadce0",
              borderLeft: focusedCard === "guardName" ? "6px solid #673ab7" : "1px solid #dadce0",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "border-left 0.15s ease-in-out",
            }}
          >
            <div style={{ fontSize: "16px", color: "#202124", marginBottom: "8px" }}>
              गार्ड का नाम / Guard Name <span style={{ color: "#d93025" }}>*</span>
            </div>
            <div style={{ marginTop: "16px" }}>
              <input
                type="text"
                required
                value={guardName}
                onChange={(e) => setGuardName(e.target.value)}
                placeholder="Your answer"
                style={{
                  width: "100%",
                  maxWidth: "360px",
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  outline: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  color: "#202124",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.target.style.borderBottom = "2px solid #673ab7")}
                onBlur={(e) => (e.target.style.borderBottom = "1px solid #dadce0")}
              />
            </div>
          </div>

          {/* Date Selector Card */}
          <div
            onFocus={() => setFocusedCard("shiftDate")}
            onBlur={() => setFocusedCard(null)}
            style={{
              background: "#ffffff",
              border: "1px solid #dadce0",
              borderLeft: focusedCard === "shiftDate" ? "6px solid #673ab7" : "1px solid #dadce0",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "border-left 0.15s ease-in-out",
            }}
          >
            <div style={{ fontSize: "16px", color: "#202124", marginBottom: "8px" }}>
              दिनांक / Date <span style={{ color: "#d93025" }}>*</span>
            </div>
            <div style={{ marginTop: "16px" }}>
              <input
                type="date"
                required
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                style={{
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  outline: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  color: "#202124",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.target.style.borderBottom = "2px solid #673ab7")}
                onBlur={(e) => (e.target.style.borderBottom = "1px solid #dadce0")}
              />
            </div>
          </div>

          {/* 27 Checkpoints Cards */}
          {CHECKPOINTS.map((cp) => {
            const hasImage = !!images[cp.id];
            const isUploading = !!uploadingCheckpoints[cp.id];
            const cardKey = `checkpoint-${cp.id}`;

            return (
              <div
                key={cp.id}
                onFocus={() => setFocusedCard(cardKey)}
                onBlur={() => setFocusedCard(null)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #dadce0",
                  borderLeft: focusedCard === cardKey ? "6px solid #673ab7" : "1px solid #dadce0",
                  borderRadius: "8px",
                  padding: "24px",
                  marginBottom: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "border-left 0.15s ease-in-out",
                }}
              >
                <div style={{ fontSize: "16px", color: "#202124", marginBottom: "4px", lineHeight: "1.4" }}>
                  {cp.label}
                </div>
                <div style={{ fontSize: "12px", color: "#70757a", marginBottom: "16px" }}>
                  Upload 1 supported file. Max 10 MB.
                </div>

                {!hasImage ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id={`file-input-${cp.id}`}
                      onChange={(e) => handleFileUpload(cp.id, e)}
                      style={{ display: "none" }}
                      disabled={isUploading || submitting}
                    />
                    <label
                      htmlFor={`file-input-${cp.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "1px solid #dadce0",
                        borderRadius: "4px",
                        padding: "6px 16px",
                        color: "#1a73e8",
                        background: "#ffffff",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: isUploading ? "not-allowed" : "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#f4f8ff")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      <span>📤</span> {isUploading ? "Uploading..." : "Add file"}
                    </label>
                  </div>
                ) : (
                  <div
                    style={{
                      border: "1px solid #dadce0",
                      borderRadius: "6px",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#f8fafc",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={images[cp.id].url}
                        alt={cp.label}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>
                          🔒 Photo Saved & Locked
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          🕒 Timestamp: {new Date(images[cp.id].capturedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(cp.id)}
                      disabled={submitting}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#d93025",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Emergency Alert Contact Question Card */}
          <div
            onFocus={() => setFocusedCard("emergencyContact")}
            onBlur={() => setFocusedCard(null)}
            style={{
              background: "#ffffff",
              border: "1px solid #dadce0",
              borderLeft: focusedCard === "emergencyContact" ? "6px solid #673ab7" : "1px solid #dadce0",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "border-left 0.15s ease-in-out",
            }}
          >
            <div style={{ fontSize: "16px", color: "#202124", marginBottom: "8px", lineHeight: "1.5" }}>
              अगर निरिक्षण के दौरान आपको अलग आवाज , जलने की बदबू या कोई आपातकालीन स्थिति का आभास होता है तो इस पर कॉल कर सूचित करे
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              {[
                { value: "मुन्ना कुमार (9982548888)", label: "मुन्ना कुमार (9982548888)" },
                { value: "Aashu kumar (HR Manager) (9982514444)", label: "Aashu kumar (HR Manager) (9982514444)" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#202124", cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    name="emergencyContact"
                    value={opt.value}
                    checked={emergencyContact === opt.value}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    style={{ accentColor: "#673ab7", width: "16px", height: "16px" }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Patrol Status Card */}
          <div
            onFocus={() => setFocusedCard("patrolStatus")}
            onBlur={() => setFocusedCard(null)}
            style={{
              background: "#ffffff",
              border: "1px solid #dadce0",
              borderLeft: focusedCard === "patrolStatus" ? "6px solid #673ab7" : "1px solid #dadce0",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "border-left 0.15s ease-in-out",
            }}
          >
            <div style={{ fontSize: "16px", color: "#202124", marginBottom: "16px" }}>
              पैट्रोलिंग की स्थिति / Patrol Status
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { value: "Normal", label: "Normal (सामान्य)" },
                { value: "Minor Issue", label: "Minor Issue (छोटी समस्या)" },
                { value: "Major Alert", label: "Major Alert (बड़ी चेतावनी)" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#202124", cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    name="patrolStatus"
                    value={opt.value}
                    checked={patrolStatus === opt.value}
                    onChange={(e) => setPatrolStatus(e.target.value)}
                    style={{ accentColor: "#673ab7", width: "16px", height: "16px" }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Observations Card */}
          <div
            onFocus={() => setFocusedCard("observations")}
            onBlur={() => setFocusedCard(null)}
            style={{
              background: "#ffffff",
              border: "1px solid #dadce0",
              borderLeft: focusedCard === "observations" ? "6px solid #673ab7" : "1px solid #dadce0",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "border-left 0.15s ease-in-out",
            }}
          >
            <div style={{ fontSize: "16px", color: "#202124", marginBottom: "8px" }}>
              प्रमुख निष्कर्ष / Key Observations
            </div>
            <div style={{ marginTop: "16px" }}>
              <textarea
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Your answer"
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  outline: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  color: "#202124",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                onFocus={(e) => (e.target.style.borderBottom = "2px solid #673ab7")}
                onBlur={(e) => (e.target.style.borderBottom = "1px solid #dadce0")}
              />
            </div>
          </div>

          {/* Remarks Card */}
          <div
            onFocus={() => setFocusedCard("remarks")}
            onBlur={() => setFocusedCard(null)}
            style={{
              background: "#ffffff",
              border: "1px solid #dadce0",
              borderLeft: focusedCard === "remarks" ? "6px solid #673ab7" : "1px solid #dadce0",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "border-left 0.15s ease-in-out",
            }}
          >
            <div style={{ fontSize: "16px", color: "#202124", marginBottom: "8px" }}>
              टिप्पणी / Remarks
            </div>
            <div style={{ marginTop: "16px" }}>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Your answer"
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  outline: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  color: "#202124",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                onFocus={(e) => (e.target.style.borderBottom = "2px solid #673ab7")}
                onBlur={(e) => (e.target.style.borderBottom = "1px solid #dadce0")}
              />
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "40px",
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "#673ab7",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => {
                if (!submitting) e.currentTarget.style.background = "#5e35b1";
              }}
              onMouseOut={(e) => {
                if (!submitting) e.currentTarget.style.background = "#673ab7";
              }}
            >
              {submitting ? "Submitting..." : "Submit / सबमिट करें"}
            </button>

            <button
              type="button"
              onClick={handleClearForm}
              disabled={submitting}
              style={{
                background: "none",
                border: "none",
                color: "#673ab7",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Clear form / फॉर्म साफ़ करें
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
