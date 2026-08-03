import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentApi, CATEGORY_LABELS, DocumentCategory } from "../api/documentApi";

export default function DocumentFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: "sop" as DocumentCategory, fileName: "", expiryDate: "", isConfidential: false, changeNotes: "" });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const doc = await documentApi.create({
        title: form.title, category: form.category, fileName: form.fileName,
        fileUrl: `https://files.example.com/${encodeURIComponent(form.fileName)}`,
        expiryDate: form.expiryDate || undefined, isConfidential: form.isConfidential, changeNotes: form.changeNotes || undefined,
      });
      navigate(`/admin/documents/${doc.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create document.");
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Upload Document</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Title
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DocumentCategory })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>File Name
          <input required placeholder="e.g. sop-v1.pdf" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Expiry Date (optional)
          <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Change Notes
          <textarea value={form.changeNotes} onChange={(e) => setForm({ ...form, changeNotes: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginTop: 4, boxSizing: "border-box" }} />
        </label>
        <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <input type="checkbox" checked={form.isConfidential} onChange={(e) => setForm({ ...form, isConfidential: e.target.checked })} /> Confidential
        </label>
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}
