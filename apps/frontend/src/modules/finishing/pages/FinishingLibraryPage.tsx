import React, { useState, useEffect, useRef } from "react";
import "../../fms/pages/Fms.css";
import { finishingRecipeApi, FinishingRecipeRecord } from "../api/finishingRecipeApi";
import { finishingLibraryApi, FinishingLibraryItem } from "../api/finishingLibraryApi";
import { masterDataApi } from "../../admin/masterdata/api/masterDataApi";
import { axiosInstance } from "../../../services/api/axiosInstance";

export default function FinishingLibraryPage() {
  const [items, setItems] = useState<FinishingLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerCode, setBuyerCode] = useState("");
  const [finishRecipeCode, setFinishRecipeCode] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<FinishingRecipeRecord | null>(null);
  const [remarks, setRemarks] = useState("");

  // Dynamic photos list (no empty placeholder boxes)
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Master data & Recipes for auto-fill / linking
  const [buyersList, setBuyersList] = useState<any[]>([]);
  const [recipesList, setRecipesList] = useState<FinishingRecipeRecord[]>([]);

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  // Separate Modal for Finish Recipe in Form
  const [showRecipeModalInForm, setShowRecipeModalInForm] = useState(false);

  // Detail Modal State for listing item view
  const [viewItem, setViewItem] = useState<FinishingLibraryItem | null>(null);
  const [activeModalPhoto, setActiveModalPhoto] = useState<string>("");

  useEffect(() => {
    loadLibrary();
    loadDependencies();
  }, []);

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [videoStream]);

  const loadLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await finishingLibraryApi.getAll();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to load library items.");
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [recipes, buyers] = await Promise.all([
        finishingRecipeApi.getAll().catch(() => []),
        masterDataApi.getBuyers().catch(() => [])
      ]);
      setRecipesList(recipes);
      setBuyersList(buyers);
    } catch (err) {
      console.error("Failed to load recipes or buyers", err);
    }
  };

  // Recipe selection
  const handleSelectRecipeCode = async (code: string) => {
    setFinishRecipeCode(code);
    if (!code) {
      setSelectedRecipe(null);
      return;
    }

    const matched = recipesList.find(
      r => r.finish_code.trim().toLowerCase() === code.trim().toLowerCase()
    );

    if (matched) {
      try {
        const full = await finishingRecipeApi.getById(matched.id);
        setSelectedRecipe(full);
        if (full.buyer_code && !buyerCode) {
          setBuyerCode(full.buyer_code);
        }
      } catch {
        setSelectedRecipe(matched);
      }
    } else {
      setSelectedRecipe(null);
    }
  };

  // Open separate Finish Recipe Modal Window
  const handleOpenRecipeModal = async () => {
    if (!finishRecipeCode) {
      alert("Please select or enter a Finish Recipe Code first.");
      return;
    }

    const matched = recipesList.find(
      r => r.finish_code.trim().toLowerCase() === finishRecipeCode.trim().toLowerCase()
    );

    if (matched) {
      try {
        const full = await finishingRecipeApi.getById(matched.id);
        setSelectedRecipe(full);
      } catch {
        setSelectedRecipe(matched);
      }
    }
    setShowRecipeModalInForm(true);
  };

  // Multiple Files Upload
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axiosInstance.post<{ success: boolean; data: { fileUrl: string } }>(
          "/standalone-checklists/upload-attachment",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const url = res.data.data.fileUrl;
        setPhotos(prev => [...prev, url]);
      }
    } catch (err: any) {
      alert("Error uploading photos: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingPhotos(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
    }
  };

  // Camera Management
  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraFileInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setVideoStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      console.warn("Direct getUserMedia failed, using camera picker fallback", err);
      cameraFileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      setVideoStream(null);
    }
    setCameraActive(false);
  };

  const capturePhotoFromCamera = async () => {
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
        setUploadingPhotos(true);
        try {
          const file = new File([blob], `swatch-cam-${Date.now()}.jpg`, { type: "image/jpeg" });
          const formData = new FormData();
          formData.append("file", file);

          const res = await axiosInstance.post<{ success: boolean; data: { fileUrl: string } }>(
            "/standalone-checklists/upload-attachment",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          const url = res.data.data.fileUrl;
          setPhotos(prev => [...prev, url]);
          stopCamera();
        } catch (err: any) {
          alert("Failed to upload camera snapshot: " + (err.message || "Error"));
        } finally {
          setUploadingPhotos(false);
        }
      }, "image/jpeg", 0.9);
    } catch (err: any) {
      alert("Snapshot failed: " + err.message);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!buyerName.trim()) {
      setFormError("Please enter or select a Buyer Name.");
      return;
    }
    if (!finishRecipeCode.trim()) {
      setFormError("Please enter or select a Finish Recipe Code.");
      return;
    }
    if (photos.length === 0) {
      setFormError("Please upload at least one swatch photo.");
      return;
    }

    setSubmitting(true);
    try {
      await finishingLibraryApi.create({
        buyerName: buyerName.trim(),
        buyerCode: buyerCode.trim() || undefined,
        finishRecipeCode: finishRecipeCode.trim(),
        recipeId: selectedRecipe?.id || undefined,
        photos,
        remarks: remarks.trim() || undefined,
      });

      // Reset Form & reload
      setShowAddForm(false);
      setBuyerName("");
      setBuyerCode("");
      setFinishRecipeCode("");
      setSelectedRecipe(null);
      setRemarks("");
      setPhotos([]);
      await loadLibrary();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.error || err.message || "Failed to save library item.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this library item?")) return;
    try {
      await finishingLibraryApi.delete(id);
      loadLibrary();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete item.");
    }
  };

  const handleOpenDetails = async (item: FinishingLibraryItem) => {
    setViewItem(item);
    setActiveModalPhoto(item.photos && item.photos.length > 0 ? item.photos[0] : (item.recipe_swatch_image || ""));
    if (!item.recipe_steps || item.recipe_steps.length === 0) {
      try {
        const full = await finishingLibraryApi.getById(item.id);
        setViewItem(full);
        if (full.photos && full.photos.length > 0) {
          setActiveModalPhoto(full.photos[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredItems = items.filter(it => {
    const q = search.toLowerCase();
    return (
      it.buyer_name?.toLowerCase().includes(q) ||
      it.buyer_code?.toLowerCase().includes(q) ||
      it.finish_recipe_code?.toLowerCase().includes(q) ||
      it.item_description?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "24px 32px", maxWidth: "1280px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>📚</span>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              FINISHING LIBRARY
            </h1>
            <span style={{ fontSize: "12px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
              Buyer Approved Swatches
            </span>
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#64748b" }}>
            Repository of buyer-approved finish swatches &amp; linked recipe specifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setFormError(null);
          }}
          style={{
            background: showAddForm ? "#64748b" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 22px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 6px -1px rgba(37,99,235,0.25)",
            transition: "all 0.2s"
          }}
        >
          <span>{showAddForm ? "✕ Close Form" : "+ Add to Library"}</span>
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={bulkFileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleBulkUpload}
      />
      <input
        ref={cameraFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setUploadingPhotos(true);
            const formData = new FormData();
            formData.append("file", file);
            axiosInstance.post<{ success: boolean; data: { fileUrl: string } }>(
              "/standalone-checklists/upload-attachment",
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            ).then(res => {
              setPhotos(prev => [...prev, res.data.data.fileUrl]);
            }).catch(err => {
              alert(err.response?.data?.message || "Failed to upload photo");
            }).finally(() => {
              setUploadingPhotos(false);
            });
          }
        }}
      />

      {/* ADD TO LIBRARY FORM (Expandable Card) */}
      {showAddForm && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
            padding: "28px",
            marginBottom: "32px",
            animation: "fadeIn 0.25s ease-out"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "22px" }}>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                Add Approved Swatch to Library
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ background: "transparent", border: "none", fontSize: "18px", color: "#94a3b8", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>

          {formError && (
            <div style={{ padding: "10px 16px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", marginBottom: "18px", fontSize: "13px", border: "1px solid #fee2e2" }}>
              ❌ {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 1. UPLOAD PHOTOS SECTION (Single Select Multiple Photos button + Camera button) */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                Swatch Photos <span style={{ color: "#ef4444" }}>*</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => bulkFileInputRef.current?.click()}
                  disabled={uploadingPhotos}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "9px 18px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: uploadingPhotos ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 1px 2px rgba(37,99,235,0.2)"
                  }}
                >
                  <span>📁</span> Select Multiple Photos
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={uploadingPhotos}
                  style={{
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "9px 18px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: uploadingPhotos ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 1px 2px rgba(79,70,229,0.2)"
                  }}
                >
                  <span>📸</span> Take Picture
                </button>

                {uploadingPhotos && (
                  <span style={{ fontSize: "13px", color: "#2563eb", fontWeight: "600" }}>
                    Uploading photos, please wait...
                  </span>
                )}
              </div>

              {/* Uploaded Photos Preview List */}
              {photos.length > 0 && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "14px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "88px",
                        height: "88px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "2px solid #3b82f6",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.08)"
                      }}
                    >
                      <img
                        src={url}
                        alt={`Swatch ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(220, 38, 38, 0.9)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          fontSize: "11px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold"
                        }}
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", paddingLeft: "8px", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                    {photos.length} {photos.length === 1 ? "photo" : "photos"} attached
                  </div>
                </div>
              )}
            </div>

            {/* 2. BUYER & FINISH RECIPE SECTION */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr auto", gap: "16px", alignItems: "flex-end", marginBottom: "24px" }}>
              {/* Buyer Name */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  Buyer Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  list="buyers-datalist"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. El Corte, Wayly, Target"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <datalist id="buyers-datalist">
                  {buyersList.map((b: any) => (
                    <option key={b.id || b.name} value={b.name} />
                  ))}
                </datalist>
              </div>

              {/* Buyer Code */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  Buyer Code
                </label>
                <input
                  type="text"
                  value={buyerCode}
                  onChange={(e) => setBuyerCode(e.target.value)}
                  placeholder="e.g. EC-01, 789"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Finish Recipe Code */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1d4ed8", marginBottom: "6px" }}>
                  Finish Recipe Code <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={finishRecipeCode}
                  onChange={(e) => handleSelectRecipeCode(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "2px solid #3b82f6",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    background: "#eff6ff",
                    fontWeight: "600",
                    color: "#0f172a"
                  }}
                >
                  <option value="">— Select Finish Recipe Code —</option>
                  {recipesList.map(r => (
                    <option key={r.id} value={r.finish_code}>
                      {r.finish_code} ({r.item_code} - {r.item_description || "Recipe"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Finish Recipe Button (opens separate window/modal) */}
              <div>
                <button
                  type="button"
                  onClick={handleOpenRecipeModal}
                  style={{
                    padding: "10px 18px",
                    background: finishRecipeCode ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "#94a3b8",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: finishRecipeCode ? "pointer" : "not-allowed",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "40px",
                    whiteSpace: "nowrap",
                    boxShadow: finishRecipeCode ? "0 2px 4px rgba(37,99,235,0.25)" : "none"
                  }}
                  title="Click to view full recipe specifications & steps in a popup window"
                >
                  📖 Finish Recipe
                </button>
              </div>
            </div>

            {/* Remarks / Approval Notes */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Approval Remarks / टिप्पणियां (वैकल्पिक)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Approved sample for Autumn collection, signed off by buyer merchandiser."
                rows={2}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 28px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 4px rgba(37,99,235,0.3)"
                }}
              >
                {submitting ? "Saving..." : "✓ Save to Library"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEPARATE POPUP WINDOW/MODAL FOR FINISH RECIPE */}
      {showRecipeModalInForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "840px",
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px" }}>📖</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                    Finish Recipe: {finishRecipeCode}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>
                    Linked Recipe Specifications &amp; Steps
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecipeModalInForm(false)}
                style={{ background: "transparent", border: "none", fontSize: "22px", color: "#64748b", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            {selectedRecipe ? (
              <div>
                {/* Meta details */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "18px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Item Code:</span>
                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{selectedRecipe.item_code}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Finish Code:</span>
                    <div style={{ fontWeight: "700", color: "#1d4ed8" }}>{selectedRecipe.finish_code}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Description:</span>
                    <div style={{ color: "#334155" }}>{selectedRecipe.item_description || "—"}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Gloss Level:</span>
                    <div style={{ color: "#334155" }}>{selectedRecipe.gloss_level || "—"}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Wood Type:</span>
                    <div style={{ color: "#334155" }}>{selectedRecipe.wood_type || "—"}</div>
                  </div>
                  {selectedRecipe.swatch_image && (
                    <div>
                      <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Recipe Swatch:</span>
                      <div>
                        <img src={selectedRecipe.swatch_image} alt="Swatch" style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Steps Table */}
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                  Recipe Steps ({selectedRecipe.steps?.length || 0})
                </h4>

                {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", color: "#475569" }}>
                          <th style={{ padding: "8px 10px", width: "40px" }}>Step</th>
                          <th style={{ padding: "8px 10px" }}>Process / Material</th>
                          <th style={{ padding: "8px 10px" }}>Tool / Machine</th>
                          <th style={{ padding: "8px 10px" }}>Grit / Qty</th>
                          <th style={{ padding: "8px 10px" }}>Drying Time</th>
                          <th style={{ padding: "8px 10px" }}>No. of Coats</th>
                          <th style={{ padding: "8px 10px" }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecipe.steps.map((st, i) => (
                          <tr key={st.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 10px", fontWeight: "700" }}>{st.step_no}</td>
                            <td style={{ padding: "8px 10px" }}>{st.process_material || "—"}</td>
                            <td style={{ padding: "8px 10px" }}>{st.tool_machine || "—"}</td>
                            <td style={{ padding: "8px 10px" }}>{st.grit_quantity || "—"}</td>
                            <td style={{ padding: "8px 10px" }}>{st.drying_time || "—"}</td>
                            <td style={{ padding: "8px 10px" }}>{st.no_of_coats || "—"}</td>
                            <td style={{ padding: "8px 10px" }}>{st.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "20px", background: "#f8fafc", textAlign: "center", color: "#64748b", fontSize: "13px", borderRadius: "6px" }}>
                    No steps registered for this recipe.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                No recipe details found for code "{finishRecipeCode}".
              </div>
            )}

            <div style={{ textAlign: "right", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setShowRecipeModalInForm(false)}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 22px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SWATCH LIBRARY LISTING */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            Swatch Library Listing
          </h2>
          <span style={{ fontSize: "12px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
            {filteredItems.length} {filteredItems.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search buyer, recipe code, description..."
          style={{
            padding: "8px 14px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            minWidth: "260px"
          }}
        />
      </div>

      {/* LISTING TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>Loading Finishing Library...</div>
        ) : error ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#ef4444" }}>{error}</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8" }}>
            <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📭</span>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#475569" }}>No library items found</div>
            <div style={{ fontSize: "13px", marginTop: "4px" }}>Click "+ Add to Library" above to add buyer approved swatch photos.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1", color: "#475569" }}>
                <th style={{ padding: "12px 16px", width: "170px" }}>Swatch Photos</th>
                <th style={{ padding: "12px 16px" }}>Buyer Name</th>
                <th style={{ padding: "12px 16px" }}>Buyer Code</th>
                <th style={{ padding: "12px 16px" }}>Finish Recipe Code</th>
                <th style={{ padding: "12px 16px" }}>Linked Item Info</th>
                <th style={{ padding: "12px 16px" }}>Added By / Date</th>
                <th style={{ padding: "12px 16px", textAlign: "right", width: "150px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {/* Photo Thumbnails */}
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      {item.photos && item.photos.length > 0 ? (
                        item.photos.slice(0, 4).map((p, idx) => (
                          <img
                            key={idx}
                            src={p}
                            alt={`Swatch ${idx + 1}`}
                            onClick={() => handleOpenDetails(item)}
                            style={{
                              width: "36px",
                              height: "36px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              cursor: "pointer"
                            }}
                            title={`Click to view Photo #${idx + 1}`}
                          />
                        ))
                      ) : item.recipe_swatch_image ? (
                        <img
                          src={item.recipe_swatch_image}
                          alt="Swatch"
                          style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                        />
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>No photo</span>
                      )}
                    </div>
                  </td>

                  {/* Buyer Name */}
                  <td style={{ padding: "10px 16px", fontWeight: "700", color: "#0f172a" }}>
                    {item.buyer_name}
                  </td>

                  {/* Buyer Code */}
                  <td style={{ padding: "10px 16px", color: "#475569" }}>
                    {item.buyer_code ? (
                      <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontWeight: "600", fontSize: "12px" }}>
                        {item.buyer_code}
                      </span>
                    ) : "—"}
                  </td>

                  {/* Finish Recipe Code */}
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "12px", border: "1px solid #bfdbfe" }}>
                      {item.finish_recipe_code}
                    </span>
                  </td>

                  {/* Linked Item Description */}
                  <td style={{ padding: "10px 16px", color: "#334155" }}>
                    <div style={{ fontWeight: "600" }}>{item.item_code || "—"}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{item.item_description || "Linked Recipe"}</div>
                  </td>

                  {/* Created By & Date */}
                  <td style={{ padding: "10px 16px", color: "#64748b", fontSize: "12px" }}>
                    <div>{item.user_name || "Admin"}</div>
                    <div>{new Date(item.created_at).toLocaleDateString()}</div>
                  </td>

                  {/* Action Buttons */}
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(item)}
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        👁️ View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* VIEW DETAILS MODAL FOR LISTING ITEM */}
      {viewItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "920px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    {viewItem.buyer_name}
                  </h2>
                  <span style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "700" }}>
                    Recipe Code: {viewItem.finish_recipe_code}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  Buyer Code: <strong>{viewItem.buyer_code || "N/A"}</strong> | Added on {new Date(viewItem.created_at).toLocaleDateString()} by {viewItem.user_name || "Admin"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  🖨️ Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  style={{ background: "transparent", border: "none", fontSize: "22px", color: "#64748b", cursor: "pointer", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: 2 Columns - Photos Gallery & Recipe Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "24px", marginBottom: "20px" }}>
              {/* Left Column: Photos Gallery */}
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                  Approved Swatch Photos ({viewItem.photos?.length || 0})
                </h3>

                {activeModalPhoto ? (
                  <div style={{ marginBottom: "10px", textAlign: "center", background: "#0f172a", borderRadius: "8px", overflow: "hidden", minHeight: "240px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={activeModalPhoto}
                      alt="Enlarged Swatch"
                      style={{ maxWidth: "100%", maxHeight: "320px", objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: "30px", background: "#f8fafc", textAlign: "center", borderRadius: "8px", color: "#94a3b8" }}>
                    No photos uploaded
                  </div>
                )}

                {/* Thumbnails row */}
                {viewItem.photos && viewItem.photos.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
                    {viewItem.photos.map((p, i) => (
                      <img
                        key={i}
                        src={p}
                        alt={`Thumb ${i + 1}`}
                        onClick={() => setActiveModalPhoto(p)}
                        style={{
                          width: "56px",
                          height: "56px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: activeModalPhoto === p ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </div>
                )}

                {viewItem.remarks && (
                  <div style={{ marginTop: "16px", padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Approval Remarks:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#334155" }}>{viewItem.remarks}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Linked Finishing Recipe Details */}
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1e3a8a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📖</span> Linked Finishing Recipe Details
                </h3>

                <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Item Code:</div>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>{viewItem.item_code || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Finish Code:</div>
                      <div style={{ fontWeight: "700", color: "#1d4ed8" }}>{viewItem.finish_recipe_code}</div>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Description:</div>
                      <div style={{ color: "#334155" }}>{viewItem.item_description || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Gloss Level:</div>
                      <div style={{ color: "#334155" }}>{viewItem.gloss_level || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Wood Type:</div>
                      <div style={{ color: "#334155" }}>{viewItem.wood_type || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Steps Table */}
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                  Recipe Steps ({viewItem.recipe_steps?.length || 0})
                </div>

                {viewItem.recipe_steps && viewItem.recipe_steps.length > 0 ? (
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                          <th style={{ padding: "6px 8px", width: "36px" }}>#</th>
                          <th style={{ padding: "6px 8px" }}>Process / Material</th>
                          <th style={{ padding: "6px 8px" }}>Tool</th>
                          <th style={{ padding: "6px 8px" }}>Grit/Qty</th>
                          <th style={{ padding: "6px 8px" }}>Drying</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewItem.recipe_steps.map((st, i) => (
                          <tr key={st.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "6px 8px", fontWeight: "700" }}>{st.step_no}</td>
                            <td style={{ padding: "6px 8px" }}>{st.process_material || "—"}</td>
                            <td style={{ padding: "6px 8px" }}>{st.tool_machine || "—"}</td>
                            <td style={{ padding: "6px 8px" }}>{st.grit_quantity || "—"}</td>
                            <td style={{ padding: "6px 8px" }}>{st.drying_time || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "16px", background: "#f8fafc", textAlign: "center", borderRadius: "6px", color: "#94a3b8", fontSize: "12px" }}>
                    No steps registered for this recipe code
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ textAlign: "right", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 22px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA CAPTURE MODAL */}
      {cameraActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "16px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25)",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📸</span> Capture Swatch Photo <small style={{ fontWeight: "normal", color: "#64748b" }}>/ स्वैच फ़ोटो लें</small>
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  color: "#64748b",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ position: "relative", backgroundColor: "#0f172a", borderRadius: "8px", overflow: "hidden", marginBottom: "16px", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {uploadingPhotos && (
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: "600" }}>
                  Uploading photo...
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={stopCamera}
                disabled={uploadingPhotos}
                style={{
                  padding: "8px 16px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhotoFromCamera}
                disabled={uploadingPhotos}
                style={{
                  padding: "8px 20px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 4px rgba(37,99,235,0.3)"
                }}
              >
                📸 {uploadingPhotos ? "Uploading..." : "Snap & Use Photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
