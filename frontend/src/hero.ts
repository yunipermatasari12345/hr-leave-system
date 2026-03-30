export const heroTheme = {
  colors: {
    primary: "#1a73e8",
    primaryLight: "#eaf4ff",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    bg: "#f3f8ff",
    card: "#ffffff",
    text: "#111827",
    muted: "#6b7280",
  },
  borderRadius: "14px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  fontFamily: "'Inter', sans-serif",
};

export const heroStatus = {
  pending: {
    text: "Menunggu",
    bg: "#fffbeb",
    color: "#b45309",
  },
  approved: {
    text: "Disetujui",
    bg: "#ecfdf5",
    color: "#065f46",
  },
  rejected: {
    text: "Ditolak",
    bg: "#fef2f2",
    color: "#991b1b",
  },
};

export function statusStyle(status: "pending" | "approved" | "rejected") {
  return {
    backgroundColor: heroStatus[status].bg,
    color: heroStatus[status].color,
    borderRadius: "8px",
    padding: "2px 10px",
    fontWeight: 700,
    fontSize: 12,
    textTransform: "capitalize" as const,
  };
}