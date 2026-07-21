import { useNavigate } from "react-router-dom";

export default function ResourcesCenterPage() {
  const navigate = useNavigate();

  const resources = [
    {
      title: "Documents",
      description: "Browse, upload and manage all organizational documents.",
      icon: "📄",
      to: "/admin/documents",
    },
    {
      title: "Upload Document",
      description: "Add a new document to the document library.",
      icon: "⬆️",
      to: "/admin/documents/new",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#111827" }}>
        Resources Center
      </h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>
        Access and manage all company resources, documents and files from one place.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 18,
        }}
      >
        {resources.map((r) => (
          <div
            key={r.to}
            onClick={() => navigate(r.to)}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "20px 18px",
              cursor: "pointer",
              transition: "box-shadow 0.15s ease, border-color 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 4px 12px rgba(52,87,213,0.12)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "#3457d5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 1px 3px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb";
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{r.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
              {r.title}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
              {r.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
