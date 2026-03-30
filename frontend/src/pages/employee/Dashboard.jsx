import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Avatar, Divider } from "@heroui/react";
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

  const total = leaves.length;
  const approved = leaves.filter(l => l.status === "approved").length;
  const rejected = leaves.filter(l => l.status === "rejected").length;
  const pending = leaves.filter(l => l.status === "pending").length;

  const statusBg = { pending: "#fffbeb", approved: "#f0fdf4", rejected: "#fef2f2" };
  const statusLabel = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

  const mainBgColor = "#eef4fb";
  const sidebarColor = "#1a73e8";

  const MenuItem = ({ id, label, icon }) => {
    const isActive = activePage === id;
    return (
      <div
        onClick={() => setActivePage(id)}
        style={{
          background: isActive ? mainBgColor : "transparent",
          color: isActive ? "#000000" : "#ffffff",
          padding: "12px 20px",
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
          position: "relative",
          display: "flex", alignItems: "center", gap: 12,
          cursor: "pointer",
          fontWeight: "bold",
          transition: "all 0.2s",
          marginBottom: 4
        }}>
        {isActive && (
          <>
            <div style={{ position: "absolute", right: 0, top: -20, width: 20, height: 20, background: "transparent", borderBottomRightRadius: 20, boxShadow: `10px 10px 0 0 ${mainBgColor}` }} />
            <div style={{ position: "absolute", right: 0, bottom: -20, width: 20, height: 20, background: "transparent", borderTopRightRadius: 20, boxShadow: `10px -10px 0 0 ${mainBgColor}` }} />
          </>
        )}
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 14 }}>{label}</span>
      </div>
    );
  };

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: mainBgColor, fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: 240, background: sidebarColor, display: "flex", flexDirection: "column", flexShrink: 0, paddingTop: 32 }}>
        <div style={{ padding: "0 24px", marginBottom: 40, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <svg width="18" height="18" fill="none" stroke={sidebarColor} strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
          </div>
          <h1 style={{ color: "white", fontSize: 18, fontWeight: "bold", margin: 0, letterSpacing: -0.5 }}>Appskep</h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 20 }}>
          <MenuItem id="dashboard" label="Dashboard" icon="❖" />
          <MenuItem id="leaves" label="Riwayat Cuti" icon="📄" />
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: "2px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Avatar name={name} size="sm" style={{ background: "white", color: "#000", fontWeight: "bold", border: "2px solid white" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "bold", color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "white", margin: 0, opacity: 0.9 }}>Portal Karyawan</p>
            </div>
          </div>
          <Button disableRipple onPress={handleLogout} style={{ width: "100%", background: "white", border: "none", color: "#000", fontWeight: "bold", fontSize: 13, padding: "16px 0", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            KELUAR
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ padding: "32px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: "bold", color: "#000000", margin: "0 0 6px 0", letterSpacing: -0.5 }}>
              {activePage === "dashboard" ? "DASHBOARD" : "RIWAYAT CUTI"}
            </h2>
            <p style={{ fontSize: 13, fontWeight: "bold", color: "#000000", margin: 0 }}>
              {activePage === "dashboard" ? `SELAMAT DATANG KEMBALI, ${name.toUpperCase()}` : `${leaves.length} PENGAJUAN DITEMUKAN`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#000000", background: "white", padding: "10px 16px", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              📅 &nbsp; {today.toUpperCase()}
            </div>
            <div style={{ width: 40, height: 40, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", cursor: "pointer", color: "#000", fontSize: 16 }}>
              🔔
            </div>
            <Avatar name={name} size="md" style={{ background: "#000", color: "white", fontWeight: "bold", cursor: "pointer", width: 40, height: 40 }} />
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>

          {activePage === "dashboard" && (
            <div>
              {/* STATS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "TOTAL PENGAJUAN", value: total },
                  { label: "TOTAL DITERIMA", value: approved },
                  { label: "TOTAL DITOLAK", value: rejected },
                  { label: "TOTAL PENDING", value: pending },
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                    <p style={{ fontSize: 12, fontWeight: "bold", color: "#000000", margin: "0 0 10px 0" }}>{stat.label}</p>
                    <p style={{ fontSize: 32, fontWeight: "bold", color: "#000000", margin: 0 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* RECENT LEAVES */}
              <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: "bold", color: "#000", margin: 0 }}>PENGAJUAN TERAKHIR</h3>
                  <Button disableRipple onPress={() => navigate("/leaves/new")} style={{ background: "#000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, padding: "0 20px", height: 38 }}>
                    + AJUKAN CUTI
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", padding: "0 20px 10px", borderBottom: "2px solid #000", fontSize: 12, fontWeight: "bold", color: "#000" }}>
                    <div style={{ flex: 1 }}>PERIODE & ALASAN</div>
                    <div style={{ width: 100 }}>DURASI</div>
                    <div style={{ width: 120 }}>STATUS</div>
                  </div>
                  {leaves.slice(0, 5).map((leave, i) => (
                    <div key={leave.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: mainBgColor, borderRadius: 14, border: "2px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "white", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          📅
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: "bold", color: "#000", margin: "0 0 4px 0" }}>{leave.start_date?.slice(0, 10)} &nbsp;—&nbsp; {leave.end_date?.slice(0, 10)}</p>
                          <p style={{ fontSize: 12, fontWeight: "bold", color: "#000", margin: 0 }}>ALASAN: {leave.reason.toUpperCase()}</p>
                        </div>
                      </div>
                      <div style={{ width: 100, fontSize: 13, fontWeight: "bold", color: "#000" }}>{leave.total_days} HARI</div>
                      <div style={{ width: 120, display: "flex" }}>
                        <span style={{ fontSize: 11, fontWeight: "bold", padding: "6px 12px", borderRadius: 16, background: statusBg[leave.status], border: "2px solid #000", color: "#000" }}>
                          {statusLabel[leave.status].toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {leaves.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <p style={{ color: "#000", fontSize: 13, fontWeight: "bold", margin: "0 0 16px 0", opacity: 0.6 }}>BELUM ADA PENGAJUAN CUTI</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePage === "leaves" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                <Button disableRipple onPress={() => navigate("/leaves/new")} style={{ background: "#000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, padding: "0 20px", height: 38 }}>
                  + AJUKAN CUTI
                </Button>
              </div>
              {/* LIST */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", padding: "0 20px 10px", borderBottom: "2px solid #000", fontSize: 12, fontWeight: "bold", color: "#000" }}>
                  <div style={{ width: 40 }}>NO</div>
                  <div style={{ flex: 1 }}>KARYAWAN</div>
                  <div style={{ flex: 1 }}>ALASAN</div>
                  <div style={{ flex: 1 }}>PERIODE</div>
                  <div style={{ width: 120 }}>STATUS</div>
                </div>
                {leaves.map((leave, i) => {
                  const hrdNote = getStr(leave.hrd_note);
                  return (
                    <div key={leave.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", background: mainBgColor, borderRadius: 14, border: "2px solid transparent", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ width: 40, fontSize: 13, fontWeight: "bold", color: "#000" }}>#{leave.id}</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={name} style={{ background: "white", border: "2px solid #000", color: "#000", fontWeight: "bold", width: 32, height: 32 }} />
                        <span style={{ fontSize: 13, fontWeight: "bold", color: "#000" }}>{name}</span>
                      </div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 16 }}>{leave.reason.toUpperCase()}</div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000" }}>{leave.start_date?.slice(0, 10)} &mdash; {leave.end_date?.slice(0, 10)}</div>
                      <div style={{ width: 120 }}>
                        <span style={{ fontSize: 11, fontWeight: "bold", padding: "6px 12px", borderRadius: 16, background: statusBg[leave.status], border: "2px solid #000", color: "#000" }}>
                          {statusLabel[leave.status].toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {leaves.length === 0 && <p style={{ textAlign: "center", color: "#000", fontWeight: "bold", fontSize: 13, padding: 32, margin: 0, opacity: 0.6 }}>BELUM ADA RIWAYAT CUTI</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}