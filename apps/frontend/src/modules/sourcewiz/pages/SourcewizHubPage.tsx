import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

export default function SourcewizHubPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cards = [
    {
      title: "All Products",
      description: "You can add new products and edit or delete existing products",
      to: "/admin/sourcewiz/products",
      iconBg: "#dcf5f2",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="13" height="15" rx="2.5" fill="#14b8a6" opacity="0.4" />
          <rect x="7" y="3" width="14" height="15" rx="2.5" fill="#0d9488" />
          <path d="M11 7h6M11 10h4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Create Catalogue for a Buyer",
      description: "You can select products and create catalogues in multiple formats",
      to: "/admin/sourcewiz/create-catalogue",
      iconBg: "#ffeedd",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" fill="#ea580c" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" fill="#ea580c" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" fill="#ea580c" />
          {/* Plus icon on the 4th quadrant */}
          <path d="M17 14v6M14 17h6" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "All Catalogues",
      description: "You can see all the catalogues, both active and draft, that you have created",
      to: "/admin/sourcewiz/quotations",
      iconBg: "#ecfccb",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <polyline
            points="3 17 8.5 11.5 13 15.5 21 7.5"
            stroke="#65a30d"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="11.5" r="1.5" fill="#65a30d" />
          <circle cx="13" cy="15.5" r="1.5" fill="#65a30d" />
          <circle cx="21" cy="7.5" r="2" fill="#65a30d" />
          {/* Sparkles */}
          <path d="M18 3.5v2M19 4.5h-2" stroke="#65a30d" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5.5 8v1.5M6.25 8.75h-1.5" stroke="#65a30d" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Buyers",
      description: "Maintain a list of all buyer contacts",
      to: "/admin/buyers",
      iconBg: "#e0f2fe",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#0284c7">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "36px 48px",
        maxWidth: 1280,
        margin: "0 auto",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Top Status Bar (matching Sourcewiz header) ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          marginBottom: 36,
        }}
      >
        {/* Task in Progress Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#f0fdfa",
            border: "1.5px solid #2dd4bf",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 600,
            color: "#0f766e",
            boxShadow: "0 1px 2px rgba(13, 148, 136, 0.05)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#0d9488",
              display: "inline-block",
            }}
          />
          <span>1 Task in progress</span>
        </div>

        {/* User Avatar Circle */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#86efac",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#166534",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          title={user?.fullName || "User"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      {/* ── 2x2 Cards Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 28,
        }}
      >
        {cards.map((card, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.to)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                background: "#ffffff",
                border: isHovered ? "1px solid #cbd5e1" : "1px solid #f1f5f9",
                borderRadius: 18,
                padding: "36px 32px",
                minHeight: 180,
                cursor: "pointer",
                boxShadow: isHovered
                  ? "0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)"
                  : "0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 1px 3px -1px rgba(0, 0, 0, 0.02)",
                transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              {/* Icon Container */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: card.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  transition: "transform 0.2s ease",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}
              >
                {card.icon}
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 10px 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {card.title}
              </h2>

              {/* Description */}
              <p
                style={{
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
