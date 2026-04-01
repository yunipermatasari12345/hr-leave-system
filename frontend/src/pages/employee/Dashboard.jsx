import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import { leaveApi } from "../../api/leaveApi";
import { STORAGE_KEYS } from "../../constants/storage";

export default function EmployeeDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const navigate = useNavigate();
  const name = localStorage.getItem(STORAGE_KEYS.name) || "Karyawan";
  const dept = localStorage.getItem(STORAGE_KEYS.department) || "Grup Umum";
  const pos = localStorage.getItem(STORAGE_KEYS.position) || "Seksi Staff";

  useEffect(() => { 
    fetchLeaves(); 
    fetchBalances();
    fetchNotifications();
    fetchLeaveTypes();

    const interval = setInterval(() => {
      fetchLeaves(); fetchBalances(); fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchLeaves = async () => { try { setLeaves(await leaveApi.getMyLeaves() || []); } catch {} };
  const fetchBalances = async () => { try { setBalances(await leaveApi.getMyBalances() || []); } catch {} };
  const fetchNotifications = async () => { try { setNotifications(await leaveApi.getMyNotifications() || []); } catch {} };
  const fetchLeaveTypes = async () => { try { setLeaveTypes(await leaveApi.getTypes() || []); } catch {} };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const activeTabStyle = { bg: "#eff6ff", text: "#1d4ed8" };
  const T = { bg: "#f8fafc", sidebar: "white", cardBorder: "1px solid #e5e7eb", textDark: "#1f2937", textGray: "#64748b", textLight: "#94a3b8", primary: "#2563eb", red: "#ef4444", green: "#10b981", yellow: "#f59e0b" };
  const statusStyle = { pending: { bg: "#fef3c7", color: "#d97706", label: "Menunggu" }, approved: { bg: "#dcfce7", color: "#166534", label: "Disetujui" }, rejected: { bg: "#fee2e2", color: "#991b1b", label: "Ditolak" }, disetujui: { bg: "#dcfce7", color: "#166534", label: "Disetujui" } };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sisaCuti = balances?.reduce((acc, curr) => acc + curr.remaining_days, 0) || 0;
  const totalTerpakai = balances?.reduce((acc, curr) => acc + curr.used_days, 0) || 0;
  const kuotaTotal = sisaCuti + totalTerpakai;

  const MenuItem = ({ id, label, icon }) => (
    <div onClick={() => setActivePage(id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: activePage === id ? activeTabStyle.bg : "transparent", color: activePage === id ? activeTabStyle.text : T.textGray, fontWeight: activePage === id ? "600" : "500", fontSize: 14, transition: "background 0.2s", marginBottom: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR KLASIK (Desain Talenta) */}
      <div style={{ width: 260, background: T.sidebar, borderRight: T.cardBorder, display: "flex", flexDirection: "column", flexShrink: 0, paddingTop: 32 }}>
        <div style={{ padding: "0 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 1 }}>
          <img src="/logo.png" alt="Logo" style={{ height: 80, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display='none'; }} />
          <h1 style={{ color: "#03070cff", fontSize: 28, fontWeight: "900", margin: 0, letterSpacing: -0.3 }}>appskep</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
          <MenuItem id="dashboard" label="Dashboard Utama" icon="❖" />
          <MenuItem id="leaves" label="Riwayat Cuti" icon="📄" />
          <MenuItem id="info" label="Informasi Cuti" icon="ℹ️" />
        </div>

        {/* STATUS CUTI COLLAPSIBLE */}
        <div style={{ padding: "0 20px", marginTop: 24 }}>
          <div onClick={() => setIsStatusOpen(!isStatusOpen)} style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 20px", border: T.cardBorder, cursor: "pointer", transition: "all 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Status Cuti 2026</p>
              </div>
              <span style={{ fontSize: 12, color: T.textLight, transform: isStatusOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>▼</span>
            </div>
            {isStatusOpen && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f0", display: "flex", flexDirection: "column", gap: 16 }}>
                <div><p style={{ fontSize: 10, fontWeight: "700", color: T.textLight, margin: "0 0 4px 0", textTransform: "uppercase" }}>Karyawan</p><p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: 0 }}>{name}</p></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><p style={{ fontSize: 10, fontWeight: "700", color: T.textLight, margin: "0 0 4px 0", textTransform: "uppercase" }}>Terpakai</p><p style={{ fontSize: 13, fontWeight: "700", color: T.primary, margin: 0 }}>{totalTerpakai} HARI</p></div>
                  <div><p style={{ fontSize: 10, fontWeight: "700", color: T.textLight, margin: "0 0 4px 0", textTransform: "uppercase" }}>Sisa</p><p style={{ fontSize: 13, fontWeight: "700", color: T.textDark, margin: 0 }}>{sisaCuti} HARI</p></div>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(totalTerpakai / (kuotaTotal || 1)) * 100}%`, height: "100%", background: T.primary, borderRadius: 3 }}></div></div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: T.cardBorder }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.yellow, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold" }}>{name.substring(0,2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "500", color: T.textGray, margin: 0 }}>{pos} · {dept}</p>
            </div>
          </div>
          <Button disableRipple onPress={handleLogout} style={{ width: "100%", background: "transparent", border: "none", color: T.textGray, fontWeight: "600", fontSize: 13, justifyContent: "flex-start", padding: 0 }} onMouseEnter={(e)=>e.currentTarget.style.color=T.red} onMouseLeave={(e)=>e.currentTarget.style.color=T.textGray}>
            <span style={{ marginRight: 8, fontSize: 16 }}>🚪</span> Keluar
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT KLASIK (Layout Kanan) */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        
        {/* HEADER KLASIK */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
           <div>
             <h2 style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: "0 0 8px 0" }}>Selamat datang, {name.split(' ')[0]}!</h2>
             <p style={{ fontSize: 13, color: T.textGray, margin: 0 }}>📅 &nbsp; {today}</p>
           </div>
           <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
             <div style={{ position: "relative" }}>
               <button onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ position: "relative", width: 44, height: 44, borderRadius: 8, border: T.cardBorder, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                 🔔
                 {notifications.length > 0 && <span style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: 4, background: T.red }} />}
               </button>
               {isNotifOpen && (
                 <div style={{ position: "absolute", top: 54, right: 0, width: 320, background: "white", borderRadius: 12, border: T.cardBorder, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, padding: 16 }}>
                   <h4 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: "600", color: T.textDark }}>Pemberitahuan Terbaru</h4>
                   <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                     {notifications.length > 0 ? notifications.slice(0, 5).map((n, i) => (
                       <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: i === notifications.slice(0, 5).length - 1 ? "none" : T.cardBorder }}>
                         <div style={{ width: 8, height: 8, borderRadius: 4, background: n.is_read ? T.textLight : T.primary, marginTop: 4 }}></div>
                         <div>
                           <p style={{ margin: "0 0 2px 0", fontSize: 13, color: T.textDark, fontWeight: n.is_read ? "500" : "600" }}>{n.title}</p>
                           <p style={{ margin: 0, fontSize: 12, color: T.textGray }}>{n.message}</p>
                         </div>
                       </div>
                     )) : <p style={{ fontSize: 13, color: T.textLight }}>Belum ada pemberitahuan.</p>}
                   </div>
                 </div>
               )}
             </div>
             <Button disableRipple onPress={() => navigate("/leaves/new")} style={{ background: T.primary, color: "white", fontWeight: "600", borderRadius: 8, height: 44, padding: "0 20px" }}>
               + Ajukan Cuti Baru
             </Button>
           </div>
        </div>

        {activePage === "dashboard" && (
          <>
            {/* STATS KOTAK 3 KLASIK DENGAN DESAIN TALENTA */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40 }}>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: T.cardBorder, display: "flex", alignItems: "center", gap: 20 }}>
                 <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f8fafc", color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎟️</div>
                 <div>
                   <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Sisa Cuti</p>
                   <p style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: 0 }}>{sisaCuti} <span style={{ fontSize: 14, fontWeight: "500", color: T.textLight }}>HARI</span></p>
                 </div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: T.cardBorder, display: "flex", alignItems: "center", gap: 20 }}>
                 <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f8fafc", color: T.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📊</div>
                 <div>
                   <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Cuti Terpakai</p>
                   <p style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: 0 }}>{totalTerpakai} <span style={{ fontSize: 14, fontWeight: "500", color: T.textLight }}>HARI</span></p>
                 </div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: T.cardBorder, display: "flex", alignItems: "center", gap: 20 }}>
                 <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f8fafc", color: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📅</div>
                 <div>
                   <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Total Kuota</p>
                   <p style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: 0 }}>{kuotaTotal} <span style={{ fontSize: 14, fontWeight: "500", color: T.textLight }}>HARI</span></p>
                 </div>
              </div>
            </div>
          </>
        )}

        {activePage === "leaves" && (
           <div style={{ background: "white", borderRadius: 12, border: T.cardBorder }}>
             <div style={{ padding: "20px 24px", borderBottom: T.cardBorder }}>
               <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Riwayat Pengajuan Cuti</h3>
             </div>
             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
               <thead>
                 <tr>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Tipe Cuti</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Jadwal</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Durasi</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {leaves.map(l => (
                   <tr key={l.id} style={{ borderBottom: T.cardBorder }}>
                     <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "500" }}><span style={{marginRight: 8}}>📄</span>{l.leave_type_name || "Cuti Tahunan"}</td>
                     <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray }}>{l.start_date.slice(0,10)} sd {l.end_date.slice(0,10)}</td>
                     <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, textAlign: "center", fontWeight: "600" }}>{l.total_days} Hari</td>
                     <td style={{ padding: "16px 24px", textAlign: "center" }}>
                       <span style={{ display: "inline-block", background: statusStyle[l.status]?.bg || "#f3f4f6", color: statusStyle[l.status]?.color || "#374151", padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
                         {statusStyle[l.status]?.label || l.status}
                       </span>
                     </td>
                   </tr>
                 ))}
                 {leaves.length === 0 && <tr><td colSpan="4" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray }}>Belum ada riwayat cuti.</td></tr>}
               </tbody>
             </table>
           </div>
        )}

        {activePage === "info" && (
           <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
             {/* Banner Panduan / SOP Cuti */}
             <div style={{ background: "linear-gradient(to right, #2563eb, #1e40af)", borderRadius: 16, padding: 32, color: "white", boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
                <h3 style={{ fontSize: 20, fontWeight: "800", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 12 }}>
                   <span style={{ fontSize: 24 }}>📚</span> Panduan & Kebijakan Cuti
                </h3>
                <p style={{ margin: "0 0 8px 0", fontSize: 14, opacity: 0.9, lineHeight: 1.6, display: "flex", gap: 12 }}>
                   <span style={{ fontWeight: "bold" }}>1.</span> <span>Pengajuan Cuti Tahunan wajib dilakukan selambat-lambatnya <b>H-3</b> (tiga hari) sebelum tanggal pelaksanaan cuti.</span>
                </p>
                <p style={{ margin: "0 0 8px 0", fontSize: 14, opacity: 0.9, lineHeight: 1.6, display: "flex", gap: 12 }}>
                   <span style={{ fontWeight: "bold" }}>2.</span> <span>Pengambilan Cuti Sakit yang memakan waktu lebih dari 1 hari <b>wajib</b> ditindaklanjuti dengan menyerahkan Surat Keterangan Sakit dari Dokter ke HRD.</span>
                </p>
                <p style={{ margin: "0", fontSize: 14, opacity: 0.9, lineHeight: 1.6, display: "flex", gap: 12 }}>
                   <span style={{ fontWeight: "bold" }}>3.</span> <span>Keputusan persetujuan atau penolakan cuti sepenuhnya berada di bawah wewenang HRD dengan mempertimbangkan rasio kehadiran departemen.</span>
                </p>
             </div>

             {/* Daftar Jenis Hak Cuti */}
             <div>
                <h3 style={{ fontSize: 18, fontWeight: "800", color: T.textDark, margin: "0 0 16px 0" }}>Daftar Hak Cuti Karyawan</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                   {leaveTypes.map(type => (
                      <div key={type.id} style={{ background: "white", borderRadius: 12, border: T.cardBorder, padding: 24, paddingLeft: 20, borderLeft: `6px solid ${T.primary}`, display: "flex", flexDirection: "column", gap: 12, transition: "transform 0.2s", cursor: "default" }} onMouseEnter={(e)=>e.currentTarget.style.transform="translateY(-4px)"} onMouseLeave={(e)=>e.currentTarget.style.transform="translateY(0)"}>
                         <div>
                            <p style={{ fontSize: 15, fontWeight: "800", color: T.textDark, margin: "0 0 8px 0" }}>{type.name.toUpperCase()}</p>
                            <span style={{ display: "inline-block", background: "#eff6ff", color: T.primary, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>Maks. {type.max_days} Hari / Tahun</span>
                         </div>
                         <p style={{ fontSize: 12, color: T.textGray, margin: 0, lineHeight: 1.5, fontWeight: "500" }}>
                            Jenis cuti ini merupakan hak resmi yang diberikan perusahaan sesuai dengan ketentuan perundang-undangan ketenagakerjaan.
                         </p>
                      </div>
                   ))}
                   {leaveTypes.length === 0 && (
                      <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 32, background: "white", borderRadius: 12, border: T.cardBorder, color: T.textGray, fontSize: 13 }}>
                         Memuat kebijakan cuti dari server...
                      </div>
                   )}
                </div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
}