import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea } from "@heroui/react";
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
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Form Pengajuan Cuti
  const [leaveForm, setLeaveForm] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [leaveSuccess, setLeaveSuccess] = useState("");

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

  const todayIsoStr = new Date().toISOString().split("T")[0];

  const totalDays = () => {
    if (!leaveForm.start_date || !leaveForm.end_date) return 0;
    const start = new Date(leaveForm.start_date);
    const end = new Date(leaveForm.end_date);
    if (end < start) return 0;
    let count = 0; let current = new Date(start); current.setHours(0,0,0,0);
    const endZero = new Date(end); endZero.setHours(0,0,0,0);
    while (current <= endZero) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const getSisaCuti = () => {
    if (!leaveForm.leave_type_id) return null;
    const typeIdStr = String(leaveForm.leave_type_id);
    const bal = balances?.find(b => String(b.leave_type_id) === typeIdStr);
    return bal ? bal.remaining_days : 0;
  };

  const getReturnDate = () => {
    if (!leaveForm.end_date) return null;
    let current = new Date(leaveForm.end_date);
    current.setDate(current.getDate() + 1);
    while (current.getDay() === 0 || current.getDay() === 6) {
      current.setDate(current.getDate() + 1);
    }
    return current.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const handleSubmitLeave = async () => {
    if (!leaveForm.leave_type_id || !leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) { setLeaveError("Semua field wajib diisi!"); return; }
    if (new Date(leaveForm.end_date) < new Date(leaveForm.start_date)) { setLeaveError("Tanggal selesai tidak boleh sebelum tanggal mulai!"); return; }
    setLeaveLoading(true); setLeaveError(""); setLeaveSuccess("");
    try {
      const formData = new FormData();
      Object.keys(leaveForm).forEach(k => formData.append(k, leaveForm[k]));
      if (attachmentFile) formData.append("attachment", attachmentFile);
      await leaveApi.createRequest(formData);
      setLeaveSuccess("Pengajuan berhasil dikirim! Menunggu persetujuan HRD.");
      fetchLeaves(); fetchBalances();
      setTimeout(() => { setActivePage("leaves"); setLeaveForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" }); setAttachmentFile(null); setLeaveSuccess(""); }, 2000);
    } catch (e) {
      setLeaveError(e.response?.data?.error || "Gagal mengajukan cuti");
    } finally { setLeaveLoading(false); }
  };

  const activeTabStyle = { bg: "#eff6ff", text: "#1d4ed8" };
  
  const savedTheme = localStorage.getItem("hr_theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [isDarkMode, setIsDarkMode] = useState(savedTheme ? savedTheme === "dark" : systemDark);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("hr_theme", next ? "dark" : "light");
  };

  const mode = isDarkMode ? "dark" : "light";
  const T = { 
    bg: mode === "dark" ? "#0f172a" : "#f8fafc", 
    sidebar: mode === "dark" ? "#1e293b" : "white", 
    cardBg: mode === "dark" ? "#1e293b" : "white",
    cardBorder: mode === "dark" ? "1px solid #334155" : "1px solid #e5e7eb", 
    textDark: mode === "dark" ? "#f8fafc" : "#1f2937", 
    textGray: mode === "dark" ? "#94a3b8" : "#64748b", 
    textLight: mode === "dark" ? "#475569" : "#94a3b8", 
    primary: "#2563eb", 
    red: "#ef4444", 
    green: "#10b981", 
    yellow: mode === "dark" ? "#d97706" : "#f59e0b",
    highlightBg: mode === "dark" ? "#1e3a8a" : "#eff6ff"
  };

  const statusStyle = { pending: { bg: "#fef3c7", color: "#d97706", label: "Menunggu" }, approved: { bg: "#dcfce7", color: "#166534", label: "Disetujui" }, rejected: { bg: "#fee2e2", color: "#991b1b", label: "Ditolak" }, disetujui: { bg: "#dcfce7", color: "#166534", label: "Disetujui" } };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  
  // Calculate total balance for all leave types combined
  const sisaCuti = balances?.reduce((sum, b) => sum + (b.remaining_days || 0), 0) || 0;
  const totalTerpakai = balances?.reduce((sum, b) => sum + (b.used_days || 0), 0) || 0;
  const kuotaTotal = balances?.reduce((sum, b) => sum + (b.total_days || 0), 0) || 0;

  const MenuItem = ({ id, label, icon, onClick }) => (
    <div onClick={() => onClick ? onClick() : setActivePage(id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: activePage === id ? activeTabStyle.bg : "transparent", color: activePage === id ? activeTabStyle.text : T.textGray, fontWeight: activePage === id ? "600" : "500", fontSize: 14, transition: "background 0.2s", marginBottom: 4 }}>
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
          <MenuItem id="new_leave" label="Ajukan Cuti Baru" icon="➕" />
          <MenuItem id="leaves" label="Riwayat Cuti" icon="📄" />
          <MenuItem id="calendar" label="Kalender Saya" icon="📅" />
          <MenuItem id="info" label="Informasi Cuti" icon="ℹ️" />
        </div>

        {/* STATUS CUTI COLLAPSIBLE */}
        <div style={{ padding: "0 20px", marginTop: 24 }}>
          <div onClick={() => setIsStatusOpen(!isStatusOpen)} style={{ background: T.bg, borderRadius: 12, padding: "16px 20px", border: T.cardBorder, cursor: "pointer", transition: "all 0.3s ease" }}>
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
             
             {/* THEME TOGGLE BUTTON */}
             <button onClick={toggleTheme} style={{ background: T.cardBg, border: T.cardBorder, padding: "8px 16px", borderRadius: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: T.textDark, fontWeight: "600", fontSize: 13, boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
               <span style={{ fontSize: 16 }}>{isDarkMode ? "☀️" : "🌙"}</span>
               {isDarkMode ? "Mode Terang" : "Mode Gelap"}
             </button>

             <div style={{ position: "relative" }}>
               <button onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ position: "relative", width: 44, height: 44, borderRadius: 8, border: T.cardBorder, background: T.cardBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                 🔔
                 {notifications.length > 0 && <span style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: 4, background: T.red }} />}
               </button>
               {isNotifOpen && (
                 <div style={{ position: "absolute", top: 54, right: 0, width: 320, background: T.cardBg, borderRadius: 12, border: T.cardBorder, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, padding: 16 }}>
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
             <Button disableRipple onPress={() => setActivePage("new_leave")} style={{ background: T.primary, color: "white", fontWeight: "600", borderRadius: 8, height: 44, padding: "0 20px" }}>
               + Ajukan Cuti Baru
             </Button>
           </div>
        </div>

        {activePage === "dashboard" && (
          <>
            {/* STATS KOTAK 3 KLASIK */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
               <div style={{ background: T.cardBg, padding: 24, borderRadius: 12, border: T.cardBorder, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: T.bg, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎟️</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Sisa Cuti</p>
                    <p style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: 0 }}>{sisaCuti} <span style={{ fontSize: 14, fontWeight: "500", color: T.textLight }}>HARI</span></p>
                  </div>
               </div>
               <div style={{ background: T.cardBg, padding: 24, borderRadius: 12, border: T.cardBorder, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: T.bg, color: T.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📊</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Cuti Terpakai</p>
                    <p style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: 0 }}>{totalTerpakai} <span style={{ fontSize: 14, fontWeight: "500", color: T.textLight }}>HARI</span></p>
                  </div>
               </div>
               <div style={{ background: T.cardBg, padding: 24, borderRadius: 12, border: T.cardBorder, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: T.bg, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📅</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Total Kuota</p>
                    <p style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: 0 }}>{kuotaTotal} <span style={{ fontSize: 14, fontWeight: "500", color: T.textLight }}>HARI</span></p>
                  </div>
               </div>
            </div>

            {/* TWO COLUMN CONTENT AREA */}
            <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr", gap: 24 }}>
              
              {/* KOLOM KIRI: Pengajuan Terakhir */}
              <div style={{ background: T.cardBg, borderRadius: 12, border: T.cardBorder, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                <div style={{ padding: "20px 24px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: "700", color: T.textDark }}>⏳ Pengajuan Terakhir Anda</h3>
                  <span onClick={() => setActivePage("leaves")} style={{ fontSize: 13, color: T.primary, cursor: "pointer", fontWeight: "600", transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity=0.7} onMouseLeave={e => e.currentTarget.style.opacity=1}>Lihat Semua &rarr;</span>
                </div>
                <div style={{ padding: "8px 24px 24px", display: "flex", flexDirection: "column" }}>
                  {leaves.length > 0 ? leaves.slice(0, 3).map(l => (
                    <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, paddingBottom: 16, borderBottom: T.cardBorder }}>
                      <div>
                        <p style={{ margin: "0 0 6px 0", fontSize: 13, fontWeight: "700", color: T.textDark }}>{l.leave_type_name || "Cuti Tahunan"} <span style={{ color: T.textLight, fontWeight: "500" }}>({l.total_days} Hari)</span></p>
                        <p style={{ margin: 0, fontSize: 12, color: T.textGray, fontWeight: "500" }}>{l.start_date.slice(0,10)} s/d {l.end_date.slice(0,10)}</p>
                      </div>
                      <span style={{ background: statusStyle[l.status]?.bg || "#f3f4f6", color: statusStyle[l.status]?.color || "#374151", padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                        {statusStyle[l.status]?.label || l.status}
                      </span>
                    </div>
                  )) : (
                    <div style={{ textAlign: "center", padding: "32px 0", color: T.textGray, fontSize: 13 }}>Belum ada riwayat pengajuan cuti.</div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: Widget Info */}
              <div style={{ background: "linear-gradient(135deg, #2563eb, #1e40af)", borderRadius: 12, border: "none", color: "white", padding: 32, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(37,99,235,0.3)" }}>
                <div style={{ position: "absolute", right: -30, top: -20, fontSize: 140, opacity: 0.1, transform: "rotate(15deg)" }}>🏖️</div>
                <div style={{ zIndex: 1, flex: 1 }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: "800", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{sisaCuti > 5 ? "✨" : "⚠️"}</span> {sisaCuti > 5 ? "Waktunya Liburan!" : "Kuota Menipis!"}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>
                    {sisaCuti > 5 
                      ? `Anda masih memiliki ${sisaCuti} hari cuti tahun ini. Jangan lupakan keseimbangan kerja dan istirahat Anda. Yuk, rencanakan liburan bersama keluarga atau sahabat!` 
                      : `Sisa cuti Anda tinggal ${sisaCuti} hari. Gunakan sisa kuota tersebut dengan bijak ya.`}
                  </p>
                </div>
                <div style={{ zIndex: 1, marginTop: 32 }}>
                  <Button disableRipple onPress={() => setActivePage("new_leave")} style={{ background: "white", color: "#1e40af", fontWeight: "800", width: "100%", borderRadius: 8, height: 44, fontSize: 14 }}>
                    Ambil Cuti Sekarang
                  </Button>
                </div>
              </div>

            </div>
          </>
        )}

        {activePage === "new_leave" && (
          <div style={{ maxWidth: 700, background: T.cardBg, borderRadius: 12, border: T.cardBorder, padding: 32 }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: 20, fontWeight: "700", color: T.textDark }}>Formulir Cuti Karyawan</h3>

            {leaveError && <div style={{ background: "#fef2f2", color: T.red, padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: "500", marginBottom: 24 }}>{leaveError}</div>}
            {leaveSuccess && <div style={{ background: "#f0fdf4", color: T.green, padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: "500", marginBottom: 24 }}>{leaveSuccess}</div>}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                Jenis Cuti <span style={{ color: T.red }}>*</span>
              </label>
              <select value={leaveForm.leave_type_id}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
                style={{ width: "100%", border: T.cardBorder, borderRadius: 8, padding: "12px 14px", fontSize: 14, color: T.textDark, background: T.bg, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                <option value="">Pilih Jenis Cuti</option>
                {leaveTypes.map(type => (
                  <option key={type.id} value={String(type.id)}>{type.name} (Maks. {type.max_days} Hari)</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                  Tanggal Mulai <span style={{ color: T.red }}>*</span>
                </label>
                <input type="date" min={todayIsoStr} value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                  style={{ width: "100%", border: T.cardBorder, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.textDark, background: T.bg, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                  Tanggal Selesai <span style={{ color: T.red }}>*</span>
                </label>
                <input type="date" min={leaveForm.start_date || todayIsoStr} value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                  style={{ width: "100%", border: T.cardBorder, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.textDark, background: T.bg, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
            </div>

            {totalDays() > 0 && (
              <div style={{ background: T.highlightBg, color: T.primary, padding: "16px 20px", borderRadius: 8, fontSize: 13, marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(37, 99, 235, 0.2)", paddingBottom: 12 }}>
                  <span style={{ fontWeight: "600" }}>Total Durasi Cuti:</span>
                  <span style={{ fontWeight: "800", fontSize: 15 }}>{totalDays()} Hari <span style={{ fontSize: 11, fontWeight: "500", opacity: 0.8 }}>(Tanpa Weekend)</span></span>
                </div>
                {getSisaCuti() !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "600" }}>Sisa Kuota Cuti Anda:</span>
                    <span style={{ fontWeight: "800", color: getSisaCuti() >= totalDays() ? T.green : T.red }}>{getSisaCuti()} Hari</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "600" }}>Harus Kembali Ke Kantor:</span>
                  <span style={{ fontWeight: "800", color: T.textDark }}>📅 {getReturnDate()}</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                Alasan Cuti <span style={{ color: T.red }}>*</span>
              </label>
              <Textarea
                placeholder="Tulis alasan secara jelas dan detail..."
                value={leaveForm.reason}
                onValueChange={(val) => setLeaveForm(prev => ({ ...prev, reason: val }))}
                variant="bordered"
                minRows={4}
                classNames={{
                  inputWrapper: "!border-[#e5e7eb] rounded-lg !bg-transparent shadow-none hover:!border-slate-300 focus-within:!border-blue-600 focus-within:!bg-transparent",
                  input: "text-sm font-medium",
                  inputStyle: { color: T.textDark }
                }}
              />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                Lampiran Pendukung <span style={{ fontSize: 12, fontWeight: "400", color: T.textGray }}>(Opsional)</span>
              </label>
              <div
                onClick={() => document.getElementById("file-upload-input").click()}
                style={{ border: `2px dashed ${attachmentFile ? T.primary : "#cbd5e1"}`, borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: attachmentFile ? T.highlightBg : T.bg, transition: "all 0.2s" }}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                />
                {attachmentFile ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>📎</span>
                    <div style={{ textAlign: "left" }}>
                       <p style={{ margin: 0, fontSize: 13, fontWeight: "600", color: T.primary }}>{attachmentFile.name}</p>
                       <p style={{ margin: 0, fontSize: 11, color: T.textGray }}>{(attachmentFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setAttachmentFile(null); }} style={{ marginLeft: 8, border: "none", background: "transparent", cursor: "pointer", color: T.red, fontSize: 18, lineHeight: 1 }}>✕</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: "0 0 4px 0", fontSize: 13, color: T.textGray, fontWeight: "600" }}>🖼️ &nbsp; Klik untuk pilih file</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.textGray }}>JPG, PNG, PDF, DOC — Maks. 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: T.cardBorder, paddingTop: 24 }}>
              <Button disableRipple onPress={() => setActivePage("dashboard")} style={{ fontSize: 14, fontWeight: "600", borderRadius: 8, background: "transparent", border: T.cardBorder, color: T.textDark, padding: "0 24px", height: 44 }}>
                Batal
              </Button>
              <Button disableRipple isLoading={leaveLoading} onPress={handleSubmitLeave}
                style={{ background: T.primary, border: "none", color: "white", fontWeight: "600", fontSize: 14, borderRadius: 8, padding: "0 24px", height: 44 }}>
                Kirim Pengajuan
              </Button>
            </div>
          </div>
        )}

        {activePage === "leaves" && (
           <div style={{ background: T.cardBg, borderRadius: 12, border: T.cardBorder }}>
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
                   {balances.map(b => (
                      <div key={b.id} style={{ background: T.cardBg, borderRadius: 12, border: T.cardBorder, padding: 24, paddingLeft: 20, borderLeft: `6px solid ${T.primary}`, display: "flex", flexDirection: "column", gap: 12, transition: "transform 0.2s", cursor: "default" }} onMouseEnter={(e)=>e.currentTarget.style.transform="translateY(-4px)"} onMouseLeave={(e)=>e.currentTarget.style.transform="translateY(0)"}>
                         <div>
                            <p style={{ fontSize: 13, fontWeight: "800", color: T.textDark, margin: "0 0 8px 0" }}>{b.leave_type_name.toUpperCase()}</p>
                            <div style={{ display: "flex", gap: 8 }}>
                               <span style={{ display: "inline-block", background: "#f0fdf4", color: T.green, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>Sisa: {b.remaining_days} Hari</span>
                               <span style={{ display: "inline-block", background: "#fef2f2", color: T.red, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>Pakai: {b.used_days} Hari</span>
                            </div>
                         </div>
                         <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                            <div style={{ width: `${(b.used_days / (b.total_days || 1)) * 100}%`, height: "100%", background: T.primary }}></div>
                         </div>
                         <p style={{ fontSize: 11, color: T.textGray, margin: 0, lineHeight: 1.5 }}>
                            Total kuota Anda untuk jenis cuti ini adalah {b.total_days} hari di tahun {b.year}.
                         </p>
                      </div>
                   ))}
                   {balances.length === 0 && (
                      <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 32, background: T.cardBg, borderRadius: 12, border: T.cardBorder, color: T.textGray, fontSize: 13 }}>
                         Memuat kebijakan cuti dari server...
                      </div>
                   )}
                </div>
             </div>
           </div>
        )}
        {activePage === "calendar" && (
           <div style={{ background: T.cardBg, borderRadius: 16, border: T.cardBorder, minHeight: 600, display: "flex", flexDirection: "column", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
             <div style={{ padding: "24px 32px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: "800", color: T.textDark }}>Kalender Jadwal Pribadi</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: 14, color: T.textGray }}>Visualisasi hari masuk dan hari libur/cuti Anda</p>
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                 <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))} style={{ width: 40, height: 40, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", fontWeight: "bold" }}>←</button>
                 <span style={{ fontSize: 16, fontWeight: "700", width: 140, textAlign: "center" }}>
                   {currentMonthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                 </span>
                 <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))} style={{ width: 40, height: 40, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", fontWeight: "bold" }}>→</button>
                 <button onClick={() => setCurrentMonthDate(new Date())} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: "none", background: T.bg, color: T.textDark, cursor: "pointer", fontWeight: "600", fontSize: 13 }}>Hari Ini</button>
               </div>
             </div>
             
             <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, marginBottom: 12 }}>
                  {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: "700", color: T.textGray, textTransform: "uppercase" }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, flex: 1 }}>
                  {(() => {
                    const year = currentMonthDate.getFullYear();
                    const month = currentMonthDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    
                    const cells = [];
                    for(let i=0; i<firstDay; i++) cells.push(<div key={`empty-${i}`} style={{ background: T.bg, borderRadius: 12, opacity: 0.5 }}></div>);
                    
                    for(let day=1; day<=daysInMonth; day++) {
                      const dateObj = new Date(year, month, day);
                      dateObj.setHours(0,0,0,0);
                      
                      const isToday = new Date().setHours(0,0,0,0) === dateObj.getTime();
                      
                      const myApprovedLeaves = leaves.filter(l => l.status === "approved" || l.status === "disetujui");
                      
                      const drops = myApprovedLeaves.filter(l => {
                         const st = new Date(l.start_date); st.setHours(0,0,0,0);
                         const en = new Date(l.end_date); en.setHours(23,59,59,999);
                         return dateObj >= st && dateObj <= en;
                      });
                      
                      cells.push(
                        <div key={day} style={{ border: drops.length > 0 ? `2px solid ${T.primary}` : T.cardBorder, borderRadius: 12, minHeight: 120, padding: "8px", background: isToday ? "#eff6ff" : (drops.length > 0 ? "#eff6ff" : "white"), display: "flex", flexDirection: "column", gap: 4, transition: "transform 0.1s", cursor: "pointer" }}
                             onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                             onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                          <div style={{ fontSize: 14, fontWeight: isToday || drops.length > 0 ? "800" : "600", color: isToday ? T.primary : T.textDark, textAlign: "right", marginBottom: 4 }}>
                            {day}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 }}>
                            {drops.map(l => (
                              <div key={'drop'+l.id} title={l.leave_type_name} style={{ background: T.primary, color: "white", fontSize: 11, fontWeight: "700", padding: "6px 8px", borderRadius: 8, textAlign: "center", boxShadow: "0 2px 4px rgba(37,99,235,0.3)" }}>
                                {l.leave_type_name.split(' ')[0]}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
}