export interface ThemeTokens {
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
  good: string;
  warning: string;
  critical: string;
  unknown: string;
  accent: string;
}

export const lightTheme: ThemeTokens = {
  bg: "#f4f6f8",
  cardBg: "#ffffff",
  border: "#e0e0e0",
  text: "#1a1a1a",
  textMuted: "#666666",
  good: "#1a7f37",
  warning: "#b8860b",
  critical: "#c0392b",
  unknown: "#999999",
  accent: "#4a90d9",
};

export const darkTheme: ThemeTokens = {
  bg: "#14161a",
  cardBg: "#1e2126",
  border: "#333844",
  text: "#eaeaea",
  textMuted: "#9aa1ac",
  good: "#3fca6a",
  warning: "#e0a83e",
  critical: "#e2564f",
  unknown: "#7d8590",
  accent: "#6aa9e9",
};

export function statusColor(theme: ThemeTokens, status: string): string {
  if (status === "good") return theme.good;
  if (status === "warning") return theme.warning;
  if (status === "critical") return theme.critical;
  return theme.unknown;
}
