import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { formatsApi, FormatRecord } from "../api/formatsApi";
import { axiosInstance as api } from "../../../services/api/axiosInstance";

export default function FormatsPage() {
  const user = useAuthStore((s: any) => s.user);
  const isSystemAdmin = user?.roles?.includes("System Admin");

  const [formats, setFormats] = useState<FormatRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("📄");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFormats();
  }, []);

  const loadFormats = async () => {
    try {
      setLoading(true);
      const data = await formatsApi.list();
      setFormats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !newTitle) {
      alert("Title and File are required!");
      return;
    }

    try {
      setUploading(true);
      // 1. Upload the file
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const fileUrl = uploadRes.data.data.fileUrl;

      // 2. Create the format record
      await formatsApi.create({
        title: newTitle,
        description: newDesc,
        icon: newIcon,
        fileUrl: fileUrl
      });

      alert("Format uploaded successfully!");
      setIsModalOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewIcon("📄");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      loadFormats();
    } catch (err) {
      console.error(err);
      alert("Failed to upload format.");
    } finally {
      setUploading(false);
    }
  };

  // Fallback default formats if database is empty (so the user always sees the ones I just made)
  const defaultFormats = [
    {
      id: "default-1",
      title: "Checklist Upload Format",
      description: "Excel format template for uploading multiple checklists at once.",
      fileUrl: "/formats/Checklist_Upload_Format.xlsx",
      icon: "📋",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "default-2",
      title: "Delegation Upload Format",
      description: "Excel format template for bulk delegating tasks.",
      fileUrl: "/formats/Delegation_Upload_Format.xlsx",
      icon: "🎯",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const displayFormats = [...defaultFormats, ...formats];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
        <div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            color: "#0f172a", 
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em"
          }}>
            Formats Library
          </h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, lineHeight: 1.5 }}>
            Download official Excel formats and templates for bulk uploads and other module integrations.
          </p>
        </div>
        
        {isSystemAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: "10px 20px",
              background: "#10b981",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            + Upload New Format
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading formats...</div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
          gap: 24 
        }}>
          {displayFormats.map((format) => (
            <div 
              key={format.id}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 32 }}>{format.icon || "📄"}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  {format.title}
                </h3>
              </div>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px 0", flex: 1, lineHeight: 1.6 }}>
                {format.description}
              </p>
              <a 
                href={format.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 16px",
                  background: "#3b82f6",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  borderRadius: 8,
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
              >
                Download File &darr;
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 16, width: "100%", maxWidth: 500,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <h2 style={{ margin: "0 0 24px 0", fontSize: 20 }}>Upload New Format</h2>
            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Title *</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ddd" }}
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Description</label>
                <textarea 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ddd", minHeight: 80 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Emoji Icon</label>
                <input 
                  type="text" 
                  value={newIcon} 
                  onChange={e => setNewIcon(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ddd" }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>File *</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 16px", border: "1px solid #ddd", background: "#fff", borderRadius: 8, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  style={{ padding: "10px 16px", border: "none", background: "#3b82f6", color: "#fff", borderRadius: 8, cursor: uploading ? "not-allowed" : "pointer" }}
                >
                  {uploading ? "Uploading..." : "Save Format"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
