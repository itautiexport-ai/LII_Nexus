import React from "react";

interface TableFreezeButtonProps {
  onClick: () => void;
  effectiveFreezeCount?: number;
  isHeaderFrozen?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const TableFreezeButton: React.FC<TableFreezeButtonProps> = ({
  onClick,
  effectiveFreezeCount = 0,
  isHeaderFrozen = true,
  style,
  className,
}) => {
  const isCustomized = effectiveFreezeCount > 0 || !isHeaderFrozen;

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      title="Configure Freeze Panes (Columns & Rows lock)"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 14px",
        borderRadius: "6px",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        border: isCustomized ? "1.5px solid #3b82f6" : "1px solid #cbd5e1",
        backgroundColor: isCustomized ? "#eff6ff" : "#ffffff",
        color: isCustomized ? "#1d4ed8" : "#334155",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        ...style,
      }}
    >
      <span style={{ fontSize: "0.95rem" }}>❄️</span>
      <span>Freeze Panes</span>
      {effectiveFreezeCount > 0 && (
        <span
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontSize: "0.7rem",
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: "10px",
            marginLeft: "2px",
          }}
        >
          {effectiveFreezeCount} col{effectiveFreezeCount > 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
};
