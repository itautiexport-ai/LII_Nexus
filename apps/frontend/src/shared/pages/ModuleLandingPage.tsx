import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { SECTIONS } from "../../shared/components/AdminLayout";
import { useAuthStore } from "../../modules/auth/hooks/useAuthStore";

export default function ModuleLandingPage() {
  const { moduleKey } = useParams();
  const user = useAuthStore((s) => s.user);

  const section = useMemo(() => {
    return SECTIONS.find((s) => s.key === moduleKey);
  }, [moduleKey]);

  const visibleItems = useMemo(() => {
    if (!section || !user) return [];
    const userRoles = user.roles || [];
    const isSystemAdmin = userRoles.includes("System Admin");
    const sectionRolePrefix = `Menu: ${section.label}`;

    return section.items.filter((item: any) => {
      if (isSystemAdmin) return true;
      if (userRoles.includes(sectionRolePrefix)) return true;
      const itemRole = `${sectionRolePrefix} -> ${item.label}`;
      return userRoles.includes(itemRole);
    });
  }, [section, user]);

  if (!section) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "#4b5563" }}>Module not found</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: 800, 
          color: "#0f172a", 
          margin: "0 0 12px 0",
          letterSpacing: "-0.02em"
        }}>
          Welcome to {section.label} Module
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, lineHeight: 1.5 }}>
          Access all {section.label.toLowerCase()} module tools and features below.
        </p>
      </div>

      {visibleItems.length === 0 ? (
        <div style={{ 
          background: "#fff", 
          padding: 40, 
          borderRadius: 16, 
          textAlign: "center",
          border: "1px dashed #cbd5e1"
        }}>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>
            You don't have any sub-modules assigned within {section.label}.
          </p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: 24 
        }}>
          {visibleItems.map((item: any) => {
            const isGroup = !!item.items;
            // If it's a group, clicking the card navigates to the first sub-item, 
            // or we just render sub-items as nested links.
            if (isGroup) {
              return (
                <div 
                  key={item.label}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 16px 0" }}>
                    {item.label}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {item.items.map((sub: any) => {
                      // Need to check if sub is visible too
                      const userRoles = user?.roles || [];
                      const isSysAdmin = userRoles.includes("System Admin");
                      const secRolePrefix = `Menu: ${section.label}`;
                      const subItemRole = `${secRolePrefix} -> ${item.label} -> ${sub.label}`;
                      
                      const isSubVisible = isSysAdmin || userRoles.includes(secRolePrefix) || userRoles.includes(subItemRole);
                      
                      if (!isSubVisible) return null;

                      return (
                        <Link 
                          key={sub.to}
                          to={sub.to}
                          style={{
                            display: "block",
                            padding: "10px 16px",
                            background: "#f8fafc",
                            borderRadius: 8,
                            color: "#3b82f6",
                            fontWeight: 500,
                            textDecoration: "none",
                            transition: "background-color 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                        >
                          {sub.label} &rarr;
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Normal Item Card
            return (
              <Link 
                key={item.to}
                to={item.to}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: 24,
                  textDecoration: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)";
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 8px 0" }}>
                  {item.label}
                </h3>
                <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px 0", flex: 1 }}>
                  Access {item.label.toLowerCase()} tools
                </p>
                <div style={{ color: "#3b82f6", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
                  Open Module <span>&rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
