import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, Avatar, Divider } from "@heroui/react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  return config;
});

function getStr(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && "String" in val) return val.String || "";
  return String(val);
}

export default function EmployeeDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "Karyawan";

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try { const res = await api.get("/api/employee/leaves"); setLeaves(res.data || []); }
    catch { setLeaves([]); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const total    = leaves.length;
  const approved = leaves.filter(l => l.status === "approved").length;
  const rejected = leaves.filter(l => l.status === "rejected").length;
  const pending  = leaves.filter(l => l.status === "pending").length;

  const statusColor = { pending: "warning", approved: "success", rejected: "danger" };
  const statusLabel = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: "#0f172a" }}>Appskep HR</p>
              <p style={{ fontSize: 11, margin: 0, color: "#94a3b8" }}>Portal Karyawan</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {[{ id: "dashboard", label: "Dashboard" }, { id: "leaves", label: "Riwayat Cuti" }].map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              style={{
                width: "100%", border: "none", padding: "11px 16px", borderRadius: 8, fontSize: 13,
                fontWeight: activePage === item.id ? 700 : 500, cursor: "pointer", textAlign: "left", marginBottom: 2,
                background: activePage === item.id ? "#eff6ff" : "transparent",
                color: activePage === item.id ? "#0ea5e9" : "#64748b",
                borderLeft: activePage === item.id ? "3px solid #0ea5e9" : "3px solid transparent",
              }}>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Avatar name={name} size="sm" style={{ background: "#0ea5e9", color: "white", fontWeight: 700 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{name}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Karyawan</p>
            </div>
          </div>
          <Button size="sm" variant="flat" color="danger" onPress={handleLogout} className="w-full" style={{ fontSize: 12 }}>
            Keluar
          </Button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "32px 36px", overflow: "auto" }}>

        {activePage === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Dashboard</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Selamat datang, {name}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Pengajuan", value: total, color: "#0ea5e9", bg: "#eff6ff" },
                { label: "Total Diterima", value: approved, color: "#10b981", bg: "#f0fdf4" },
                { label: "Total Ditolak", value: rejected, color: "#ef4444", bg: "#fef2f2" },
                { label: "Total Pending", value: pending, color: "#f59e0b", bg: "#fffbeb" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "white", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: stat.color }} />
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0 0", fontWeight: 500 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Pengajuan Terakhir</h2>
                <Button size="sm" onPress={() => navigate("/leaves/new")}
                  style={{ background: "#0ea5e9", color: "white", fontWeight: 600, fontSize: 12 }}>
                  + Ajukan Cuti
                </Button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leaves.slice(0, 5).map((leave, i) => {
                  const hrdNote = getStr(leave.hrd_note);
                  return (
                    <div key={leave.id}>
                      <div style={{ padding: "12px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <Chip size="sm" color={statusColor[leave.status] || "default"} variant="flat">
                            {statusLabel[leave.status] || leave.status}
                          </Chip>
                        </div>
                        <p style={{ fontSize: 13, color: "#475569", margin: "0 0 2px 0" }}>
                          {leave.start_date?.slice(0,10)} — {leave.end_date?.slice(0,10)}
                          <Chip size="sm" variant="flat" color="default" style={{ marginLeft: 8, fontSize: 11 }}>{leave.total_days} hari</Chip>
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{leave.reason}</p>
                        {hrdNote && <p style={{ fontSize: 12, color: "#0ea5e9", margin: "4px 0 0 0" }}>Catatan HRD: {hrdNote}</p>}
                      </div>
                      {i < leaves.slice(0,5).length - 1 && <Divider />}
                    </div>
                  );
                })}
                {leaves.length === 0 && (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <p style={{ color: "#94a3b8", marginBottom: 16, fontSize: 14 }}>Belum ada pengajuan cuti</p>
                    <Button onPress={() => navigate("/leaves/new")}
                      style={{ background: "#0ea5e9", color: "white", fontWeight: 600, fontSize: 13 }}>
                      Ajukan Cuti Sekarang
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activePage === "leaves" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Riwayat Cuti</h1>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Total {leaves.length} pengajuan</p>
              </div>
              <Button onPress={() => navigate("/leaves/new")}
                style={{ background: "#0ea5e9", color: "white", fontWeight: 600, fontSize: 13 }}>
                + Ajukan Cuti
              </Button>
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: "8px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              {leaves.map((leave, i) => {
                const hrdNote = getStr(leave.hrd_note);
                return (
                  <div key={leave.id}>
                    <div style={{ padding: "14px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Chip size="sm" color={statusColor[leave.status] || "default"} variant="flat">
                          {statusLabel[leave.status] || leave.status}
                        </Chip>
                      </div>
                      <p style={{ fontSize: 13, color: "#475569", margin: "0 0 2px 0" }}>
                        {leave.start_date?.slice(0,10)} — {leave.end_date?.slice(0,10)}
                        <Chip size="sm" variant="flat" color="default" style={{ marginLeft: 8, fontSize: 11 }}>{leave.total_days} hari</Chip>
                      </p>
                      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{leave.reason}</p>
                      {hrdNote && <p style={{ fontSize: 12, color: "#0ea5e9", margin: "4px 0 0 0" }}>Catatan HRD: {hrdNote}</p>}
                    </div>
                    {i < leaves.length - 1 && <Divider />}
                  </div>
                );
              })}
              {leaves.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32, margin: 0 }}>Belum ada riwayat cuti</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}