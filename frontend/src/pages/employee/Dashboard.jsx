import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Textarea } from "@heroui/react";
import { leaveApi } from "../../api/leaveApi";
import { STORAGE_KEYS } from "../../constants/storage";
import { API_BASE_URL } from "../../constants/config";
import {
  leaveRowHasAttachment,
  legacyAttachmentHref,
  fetchLeaveAttachmentWithMeta,
} from "../../utils/leaveAttachmentFetch";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [activePage, setActivePage] = useState(location.state?.activePage || "dashboard");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Form Pengajuan Cuti
  const [leaveForm, setLeaveForm] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [leaveSuccess, setLeaveSuccess] = useState("");
  const [successModal, setSuccessModal] = useState({ open: false, title: "", message: "" });

  const openMyAttachment = async (l) => {
    try {
      if (l.has_attachment) {
        const { objectURL } = await fetchLeaveAttachmentWithMeta(
          API_BASE_URL,
          "employee",
          l.id,
        );
        window.open(objectURL, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(objectURL), 120000);
      } else {
        const href = legacyAttachmentHref(API_BASE_URL, l);
        if (href) window.open(href, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      alert(e?.message || "Gagal membuka lampiran");
    }
  };

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
    
    const days = totalDays();
    const quota = getSisaCuti();

    if (days <= 0) {
      setLeaveError("Pilih tanggal yang memuat minimal satu hari kerja (bukan hanya akhir pekan).");
      return;
    }

    setLeaveLoading(true); setLeaveError(""); setLeaveSuccess("");
    try {
      await leaveApi.createRequest({
        leave_type_id: leaveForm.leave_type_id,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason,
        attachment: attachmentFile || undefined,
      });
      setSuccessModal({ open: true, title: "Pengajuan Terkirim!", message: "Formulir pengajuan cuti Anda telah berhasil dikirim dan sedang dalam proses peninjauan oleh tim HRD." });
      fetchLeaves(); fetchBalances();
      setIsLeaveModalOpen(false);
      setLeaveForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" }); 
      setAttachmentFile(null); 
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
    sidebar: mode === "dark" ? "#1e293b" : "#e0f2fe", 
    cardBg: mode === "dark" ? "#1e293b" : "white",
    cardBorder: mode === "dark" ? "1px solid #334155" : "1px solid #bae6fd", 
    textDark: mode === "dark" ? "#f8fafc" : "#0f172a", 
    textGray: mode === "dark" ? "#94a3b8" : "#0369a1", 
    textLight: mode === "dark" ? "#475569" : "#0ea5e9", 
    primary: "#0284c7", 
    red: "#ef4444", 
    green: "#10b981", 
    yellow: mode === "dark" ? "#d97706" : "#f59e0b",
    highlightBg: mode === "dark" ? "#1e3a8a" : "#e0f2fe",
    activeMenuBg: mode === "dark" ? "rgba(59, 130, 246, 0.15)" : "#0ea5e9", 
    activeMenuText: mode === "dark" ? "#60a5fa" : "#ffffff", 
    logoText: mode === "dark" ? "#f8fafc" : "#0ea5e9", 
    logoIconBg: mode === "dark" ? "#4f46e5" : "#0ea5e9", 
    inactiveMenuText: mode === "dark" ? "#cbd5e1" : "#0f172a"
  };

  const statusStyle = { pending: { bg: "#fef3c7", color: "#d97706", label: "Menunggu" }, approved: { bg: "#dcfce7", color: "#166534", label: "Disetujui" }, rejected: { bg: "#fee2e2", color: "#991b1b", label: "Ditolak" }, disetujui: { bg: "#dcfce7", color: "#166534", label: "Disetujui" } };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  
  const sisaCuti = balances?.reduce((sum, b) => sum + (b.remaining_days || 0), 0) || 0;
  const totalTerpakai = balances?.reduce((sum, b) => sum + (b.used_days || 0), 0) || 0;
  const kuotaTotal = balances?.reduce((sum, b) => sum + (b.total_days || 0), 0) || 0;

  const MenuHeader = ({ label }) => {
    return (
      <div style={{ 
        fontSize: 11, 
        fontWeight: "800", 
        color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.65)", 
        padding: "16px 16px 6px 16px", 
        textTransform: "uppercase", 
        letterSpacing: 1.0 
      }}>
        {label}
      </div>
    );
  };
  const MenuItem = ({ id, label, icon, onClick }) => {
    const isActive = activePage === id;
    return (
      <div 
        onClick={() => { 
          if(id === "new_leave") setIsLeaveModalOpen(true); 
          else if(onClick) onClick(); 
          else setActivePage(id); 
          setIsMobileMenuOpen(false); 
        }} 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          padding: "12px 16px", 
          borderRadius: 8, 
          cursor: "pointer", 
          background: isActive ? T.activeMenuBg : "transparent", 
          color: isActive ? T.activeMenuText : T.inactiveMenuText, 
          fontWeight: isActive ? "700" : "600", 
          fontSize: 14, 
          transition: "all 0.2s ease", 
          marginBottom: 4,
          paddingLeft: 16,
        }}
        className="premium-menu-item"
      >
        <span style={{ fontSize: 16, opacity: isActive ? 1 : 0.9 }}>{icon}</span> {label}
      </div>
    );
  };

  return (
    <div className={`resp-layout font-['Plus_Jakarta_Sans',sans-serif] ${isDarkMode ? "dark" : ""} w-full`} style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.textDark, transition: "background 0.3s, color 0.3s" }}>
      
      {/* SIDEBAR PREMIUM (Visually Uplifted to Light/Dark Premium Sidebar) */}
      <div className="resp-sidebar" style={{ 
        width: 260, 
        background: T.sidebar, 
        borderRight: isDarkMode ? T.cardBorder : "none", 
        display: "flex", 
        flexDirection: "column", 
        flexShrink: 0, 
        paddingTop: 32,
        color: isDarkMode ? T.textDark : "#0f172a"
      }}>
        <div className="sidebar-logo" style={{ padding: "0 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: T.logoIconBg, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 13 }}>AS</div>
            <h1 style={{ color: T.logoText, fontSize: 18, fontWeight: "800", margin: 0, letterSpacing: -0.5 }}>appskep</h1>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: isDarkMode ? T.textDark : "#0f172a" }}>
             {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        
        <div className={`sidebar-collapsible ${isMobileMenuOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column", flex: 1, background: isMobileMenuOpen ? T.sidebar : "transparent" }}>
          <div className="sidebar-menu" style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
            <MenuHeader label="Utama" />
            <MenuItem id="dashboard" label="Dashboard Utama" icon="❖" />
            <MenuItem id="new_leave" label="Ajukan Cuti Baru" icon="➕" />
            
            <MenuHeader label="Manajemen Pribadi" />
            <MenuItem id="leaves" label="Riwayat Cuti" icon="📄" />
            <MenuItem id="calendar" label="Kalender Saya" icon="📅" />
            <MenuItem id="info" label="Informasi Cuti" icon="ℹ️" />
          </div>

          {/* Kuota Cuti */}
          <div className="sidebar-status" style={{ padding: "0 20px", marginTop: 16 }}>
            <div onClick={() => setIsStatusOpen(!isStatusOpen)} style={{ background: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(14, 165, 233, 0.08)", borderRadius: 12, padding: "12px 16px", cursor: "pointer", transition: "all 0.3s ease", border: isDarkMode ? T.cardBorder : "1px solid rgba(14, 165, 233, 0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>📊</span>
                  <p style={{ fontSize: 10, fontWeight: "800", color: isDarkMode ? T.textGray : "#0369a1", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Kuota Cuti 2026</p>
                </div>
                <span style={{ fontSize: 10, color: isDarkMode ? T.textGray : "#0369a1", transform: isStatusOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>▼</span>
              </div>
              {isStatusOpen && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(14, 165, 233, 0.2)"}`, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div><p style={{ fontSize: 9, fontWeight: "800", color: isDarkMode ? T.textLight : "#556b82", margin: "0 0 2px 0", textTransform: "uppercase" }}>Karyawan</p><p style={{ fontSize: 12, fontWeight: "700", color: isDarkMode ? T.textDark : "#0f172a", margin: 0 }}>{name}</p></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><p style={{ fontSize: 9, fontWeight: "800", color: isDarkMode ? T.textLight : "#556b82", margin: "0 0 2px 0", textTransform: "uppercase" }}>Terpakai</p><p style={{ fontSize: 12, fontWeight: "800", color: isDarkMode ? T.textDark : "#0f172a", margin: 0 }}>{totalTerpakai} HARI</p></div>
                    <div><p style={{ fontSize: 9, fontWeight: "800", color: isDarkMode ? T.textLight : "#556b82", margin: "0 0 2px 0", textTransform: "uppercase" }}>Sisa</p><p style={{ fontSize: 12, fontWeight: "800", color: isDarkMode ? T.textDark : "#0f172a", margin: 0 }}>{sisaCuti} HARI</p></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-profile" style={{ marginTop: "auto", padding: "24px", borderTop: isDarkMode ? T.cardBorder : "1px solid rgba(14, 165, 233, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: isDarkMode ? "#3b82f6" : "#0ea5e9", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "800" }}>{name.substring(0,2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: "700", color: isDarkMode ? T.textDark : "#0f172a", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                <p style={{ fontSize: 11, fontWeight: "500", color: isDarkMode ? T.textGray : "#0369a1", margin: 0 }}>{pos}</p>
              </div>
            </div>
            <Button disableRipple onPress={handleLogout} style={{ width: "100%", background: isDarkMode ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.08)", border: "none", color: isDarkMode ? T.red : "#ef4444", fontWeight: "700", fontSize: 13, borderRadius: 8, height: 38 }} onMouseEnter={(e)=>e.currentTarget.style.background="rgba(239, 68, 68, 0.15)"} onMouseLeave={(e)=>e.currentTarget.style.background="rgba(239, 68, 68, 0.08)"}>
              🚪 &nbsp; Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="resp-content" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "40px" }}>
        
        {/* HEADER / TOPBAR */}
        <div className="resp-header" style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 36, 
          flexWrap: "wrap", 
          gap: 16,
          background: T.cardBg,
          padding: "16px 24px",
          borderRadius: 12,
          border: T.cardBorder,
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
        }}>
           <div>
              {/* Enterprise Breadcrumb */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: "700", color: T.textGray, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1.5 }}>
                 <span>PT APPSKEP</span>
                 <span style={{ fontSize: 10, opacity: 0.5 }}>/</span>
                 <span>Portal Karyawan</span>
                 <span style={{ fontSize: 10, opacity: 0.5 }}>/</span>
                 <span style={{ color: T.primary }}>
                    {activePage === "dashboard" && "Dashboard Utama"}
                    {activePage === "leaves" && "Riwayat Cuti"}
                    {activePage === "calendar" && "Kalender Saya"}
                    {activePage === "info" && "Informasi Cuti"}
                 </span>
              </div>
              
              <h2 style={{ fontSize: 22, fontWeight: "800", color: T.textDark, margin: 0, letterSpacing: -0.5 }}>
                {activePage === "dashboard" && "Dashboard Utama"}
                {activePage === "leaves" && "Riwayat Pengajuan Cuti"}
                {activePage === "calendar" && "Kalender Cuti Saya"}
                {activePage === "info" && "Informasi Aturan Cuti"}
              </h2>
           </div>
            <div className="resp-header-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
             {/* THEME TOGGLE */}
             <button onClick={toggleTheme} style={{ background: T.bg, border: T.cardBorder, padding: "8px 12px", borderRadius: 8, cursor: "pointer", color: T.textDark, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
               <span>{isDarkMode ? "☀️" : "🌙"}</span>
             </button>
             {/* Notification Bell Icon with Badge */}
             <div style={{ position: "relative" }}>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ position: "relative", width: 38, height: 38, borderRadius: 8, border: T.cardBorder, background: T.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.textDark }}>
                  🔔
                  {notifications.length > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", fontSize: 9, fontWeight: "800", height: 16, minWidth: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                      {notifications.length}+
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="resp-notif-panel glass-card" style={{ position: "absolute", top: 46, right: 0, width: 320, borderRadius: 16, border: T.cardBorder, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)", zIndex: 100, padding: 16 }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: "800", color: T.textDark, borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", paddingBottom: 8 }}>Pemberitahuan</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 260, overflowY: "auto" }}>
                      {notifications.length > 0 ? notifications.slice(0, 5).map((n, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 10, borderBottom: i === notifications.slice(0, 5).length - 1 ? "none" : "1px solid rgba(148, 163, 184, 0.1)" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: n.is_read ? T.textLight : T.primary, marginTop: 5, flexShrink: 0 }}></div>
                          <div style={{ flex: 1, textAlign: "left" }}>
                            <p style={{ margin: "0 0 2px 0", fontSize: 12, color: T.textDark, fontWeight: "800" }}>{n.title}</p>
                            <p style={{ margin: 0, fontSize: 10, color: T.textGray, fontWeight: "500", lineHeight: 1.4 }}>{n.message}</p>
                          </div>
                        </div>
                      )) : <p style={{ fontSize: 11, color: T.textGray, textAlign: "center", margin: "6px 0" }}>Belum ada pemberitahuan.</p>}
                    </div>
                  </div>
                )}
             </div>

             {/* Profile Info far right topbar */}
             <div style={{ display: "flex", alignItems: "center", gap: 10, borderLeft: `1px solid ${isDarkMode ? "#334155" : "#e5e7eb"}`, paddingLeft: 12 }}>
                <span style={{ fontSize: 13, fontWeight: "700", color: T.textDark }} className="hidden md:inline">{name}</span>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: isDarkMode ? "#3b82f6" : "#3051a3", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "800" }}>
                  {name.substring(0, 2).toUpperCase()}
                </div>
             </div>

             <Button disableRipple onPress={() => setIsLeaveModalOpen(true)} className="glow-btn" style={{ background: T.primary, color: "white", fontWeight: "700", borderRadius: 8, height: 38, padding: "0 14px" }}>
               + Ajukan Cuti
             </Button>
           </div>
         </div>

         {activePage === "dashboard" && (
           <>
             {/* WELCOME BANNER (Dashboard only) */}
             <div className="glass-card animate-fade-in-up" style={{ 
               borderRadius: 12, 
               padding: "24px 32px", 
               display: "flex", 
               justifyContent: "space-between", 
               alignItems: "center", 
               marginBottom: 32, 
               border: T.cardBorder, 
               boxShadow: "0 4px 20px rgba(0,0,0,0.02)", 
               flexWrap: "wrap", 
               gap: 20,
               background: T.cardBg
             }}>
               <div style={{ flex: "1 1 300px" }}>
                  <h2 style={{ margin: "0 0 12px 0", color: "#3051a3", fontSize: 18, fontWeight: "800", lineHeight: 1.4 }}>
                    Haloo {name} SELAMAT DATANG DI SISTEM INFORMASI MANAJEMEN CUTI KARYAWAN PT APPSKEP
                  </h2>
                  <p style={{ margin: 0, color: T.textGray, fontSize: 13, maxWidth: 640, lineHeight: 1.6, fontWeight: "500" }}>
                    Ajukan cuti tahunan, cuti melahirkan, atau cuti sakit Anda dengan mudah melalui form pengajuan terpadu. Pastikan untuk melampirkan berkas bukti jika diperlukan.
                  </p>
               </div>
               <div style={{ fontSize: 72, userSelect: "none", opacity: 0.85 }}>
                 📅
               </div>
             </div>

             {/* STATS CARDS WITH COLOR LEFT BORDERS */}
             <div className="resp-grid-3" style={{ gap: 20, marginBottom: 32 }}>
               
               {/* Card 1: Sisa Kuota */}
               <div style={{
                 background: T.cardBg,
                 borderRadius: 8,
                 border: T.cardBorder,
                 borderLeft: `4px solid #3b82f6`,
                 padding: "20px 24px",
                 display: "flex",
                 justifyContent: "space-between",
                 alignItems: "center",
                 boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
               }}>
                 <div>
                   <p style={{ fontSize: 10, fontWeight: "800", textTransform: "uppercase", color: "#3b82f6", letterSpacing: 0.5, margin: "0 0 4px 0" }}>Sisa Cuti Caturwulan</p>
                   <h3 style={{ fontSize: 26, fontWeight: "800", color: T.textDark, margin: 0 }}>{sisaCuti} Hari</h3>
                 </div>
                 <div style={{ fontSize: 28, opacity: 0.3, color: T.textGray }}>
                   🏖️
                 </div>
               </div>

               {/* Card 2: Total Terpakai */}
               <div style={{
                 background: T.cardBg,
                 borderRadius: 8,
                 border: T.cardBorder,
                 borderLeft: `4px solid #10b981`,
                 padding: "20px 24px",
                 display: "flex",
                 justifyContent: "space-between",
                 alignItems: "center",
                 boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
               }}>
                 <div>
                   <p style={{ fontSize: 10, fontWeight: "800", textTransform: "uppercase", color: "#10b981", letterSpacing: 0.5, margin: "0 0 4px 0" }}>Total Terpakai</p>
                   <h3 style={{ fontSize: 26, fontWeight: "800", color: T.textDark, margin: 0 }}>{totalTerpakai} Hari</h3>
                 </div>
                 <div style={{ fontSize: 28, opacity: 0.3, color: T.textGray }}>
                   📈
                 </div>
               </div>

               {/* Card 3: Kuota Tahunan */}
               <div style={{
                 background: T.cardBg,
                 borderRadius: 8,
                 border: T.cardBorder,
                 borderLeft: `4px solid #06b6d4`,
                 padding: "20px 24px",
                 display: "flex",
                 justifyContent: "space-between",
                 alignItems: "center",
                 boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
               }}>
                 <div>
                   <p style={{ fontSize: 10, fontWeight: "800", textTransform: "uppercase", color: "#06b6d4", letterSpacing: 0.5, margin: "0 0 4px 0" }}>Kuota Tahunan</p>
                   <h3 style={{ fontSize: 26, fontWeight: "800", color: T.textDark, margin: 0 }}>{kuotaTotal} Hari</h3>
                 </div>
                 <div style={{ fontSize: 28, opacity: 0.3, color: T.textGray }}>
                   📅
                 </div>
               </div>
             </div>

             {/* TWO COLUMN CONTENT AREA */}
             <div className="resp-grid-2" style={{ gap: 24, marginBottom: 24 }}>
               
               {/* KOLOM KIRI: Pengajuan Terakhir */}
               <div className="glass-card" style={{ borderRadius: 20, border: T.cardBorder, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.01)" }}>
                 <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <h3 style={{ margin: 0, fontSize: 15, color: T.textDark, fontWeight: "800", tracking: -0.2 }}>⏳ Pengajuan Cuti Terakhir</h3>
                   <span onClick={() => setActivePage("leaves")} style={{ fontSize: 12, color: T.primary, cursor: "pointer", fontWeight: "700" }}>Lihat Semua &rarr;</span>
                 </div>
                 <div style={{ padding: "8px 24px 20px", display: "flex", flexDirection: "column" }}>
                   {leaves.length > 0 ? leaves.slice(0, 3).map(l => (
                     <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, paddingBottom: 16, borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                       <div>
                         <p style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: "700", color: T.textDark }}>{l.leave_type_name || "Cuti Tahunan"} <span style={{ color: T.textGray, fontWeight: "600", fontSize: 11 }}>({l.total_days} Hari)</span></p>
                         <p style={{ margin: 0, fontSize: 11, color: T.textGray, fontWeight: "600" }}>{l.start_date.slice(0,10)} s/d {l.end_date.slice(0,10)}</p>
                       </div>
                       <span className={`status-pill status-${l.status === 'disetujui' ? 'approved' : l.status}`}>
                         <span className="status-dot"></span>
                         {statusStyle[l.status]?.label || l.status}
                       </span>
                     </div>
                   )) : (
                     <div style={{ textAlign: "center", padding: "36px 0", color: T.textGray, fontSize: 13, fontWeight: "600" }}>Belum ada riwayat pengajuan cuti.</div>
                   )}
                 </div>
               </div>

               {/* KOLOM KANAN: Widget Info (Redesigned to a stunning dark-blue/indigo banner) */}
               <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 20, color: "white", padding: 32, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", border: isDarkMode ? "1px solid #334155" : "none", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
                 <div style={{ position: "absolute", right: -24, top: -24, fontSize: 100, opacity: 0.08, transform: "rotate(15deg)" }}>🌴</div>
                 <div style={{ zIndex: 1, flex: 1 }}>
                   <h3 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: "800", display: "flex", alignItems: "center", gap: 8, letterSpacing: -0.3 }}>
                     <span>{sisaCuti > 5 ? "✨" : "⚠️"}</span> {sisaCuti > 5 ? "Keseimbangan Kerja & Hidup" : "Sisa Kuota Terbatas"}
                   </h3>
                   <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, opacity: 0.8, fontWeight: "500" }}>
                     {sisaCuti > 5 
                       ? `Anda memiliki sisa kuota ${sisaCuti} hari cuti aktif. Jadwalkan istirahat Anda untuk menjaga produktivitas prima.` 
                       : `Kuota cuti Anda tersisa ${sisaCuti} hari. Disarankan untuk menggunakan sisa cuti ini secara selektif.`}
                   </p>
                 </div>
                 <div style={{ zIndex: 1, marginTop: 28 }}>
                   <Button disableRipple onPress={() => setIsLeaveModalOpen(true)} className="glow-btn" style={{ background: T.primary, color: "white", fontWeight: "700", width: "100%", borderRadius: 12, height: 44, border: "none", fontSize: 13 }}>
                     Ambil Cuti Sekarang
                   </Button>
                 </div>
               </div>

             </div>
           </>
         )}

         {/* MODAL AJUKAN CUTI (Styled beautifully as a slide-up elegant card) */}
         {isLeaveModalOpen && (
           <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
             <div className="glass-card" style={{ width: "100%", maxWidth: 600, borderRadius: 24, padding: 32, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                 <h3 style={{ margin: 0, fontSize: 20, fontWeight: "800", color: T.textDark, letterSpacing: -0.5 }}>Formulir Cuti Baru</h3>
                 <button onClick={() => setIsLeaveModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 14, cursor: "pointer", color: T.textGray, width: 28, height: 28, borderRadius: "50%" }}>✕</button>
               </div>

               {leaveError && <div style={{ background: "rgba(239, 68, 68, 0.08)", color: T.red, padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: "600", marginBottom: 20, border: "1px solid rgba(239, 68, 68, 0.15)" }}>⚠️ {leaveError}</div>}

               <div style={{ marginBottom: 20 }}>
                 <label style={{ fontSize: 12, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                   Jenis Cuti <span style={{ color: T.red }}>*</span>
                 </label>
                 <select value={leaveForm.leave_type_id}
                   onChange={(e) => setLeaveForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
                   style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: T.textDark, background: T.bg, outline: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                   <option value="">Pilih Jenis Cuti</option>
                   {leaveTypes.map(type => (
                     <option key={type.id} value={String(type.id)}>{type.name} (Maks. {type.max_days} Hari)</option>
                   ))}
                 </select>
               </div>

               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                 <div>
                   <label style={{ fontSize: 12, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                     Tanggal Mulai <span style={{ color: T.red }}>*</span>
                   </label>
                   <input type="date" min={todayIsoStr} value={leaveForm.start_date}
                     onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                     style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "11px 14px", fontSize: 14, color: T.textDark, background: T.bg, outline: "none", boxSizing: "border-box", fontFamily: "inherit", fontWeight: "600" }} />
                 </div>
                 <div>
                   <label style={{ fontSize: 12, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                     Tanggal Selesai <span style={{ color: T.red }}>*</span>
                   </label>
                   <input type="date" min={leaveForm.start_date || todayIsoStr} value={leaveForm.end_date}
                     onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                     style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "11px 14px", fontSize: 14, color: T.textDark, background: T.bg, outline: "none", boxSizing: "border-box", fontFamily: "inherit", fontWeight: "600" }} />
                 </div>
               </div>

               {totalDays() > 0 && (
                 <div className="gradient-indigo-glow" style={{ padding: "16px 20px", borderRadius: 12, fontSize: 13, marginBottom: 24, display: "flex", flexDirection: "column", gap: 8, fontWeight: "600" }}>
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                     <span>Durasi Pengajuan:</span>
                     <span style={{ fontWeight: "800" }}>{totalDays()} Hari Kerja</span>
                   </div>
                   <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed rgba(67, 56, 202, 0.15)", paddingTop: 8 }}>
                     <span>Kembali Bekerja:</span>
                     <span style={{ fontWeight: "800" }}>{getReturnDate()}</span>
                   </div>
                 </div>
               )}

               <div style={{ marginBottom: 24 }}>
                 <label style={{ fontSize: 12, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                   Alasan Cuti <span style={{ color: T.red }}>*</span>
                 </label>
                 <Textarea
                   placeholder="Tuliskan alasan cuti Anda secara profesional..."
                   value={leaveForm.reason}
                   onValueChange={(val) => setLeaveForm(prev => ({ ...prev, reason: val }))}
                   variant="bordered"
                   minRows={3}
                   classNames={{
                     inputWrapper: "border border-slate-300 rounded-xl bg-slate-50/50 shadow-none hover:border-slate-400 focus-within:!border-blue-600 focus-within:!bg-white p-3",
                     input: "text-sm text-slate-700 font-semibold",
                   }}
                 />
               </div>

               <div style={{ marginBottom: 32 }}>
                 <label style={{ fontSize: 12, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                   Lampiran Bukti <span style={{ fontSize: 11, fontWeight: "500", color: T.textGray }}>(Opsional)</span>
                 </label>
                 <div onClick={() => document.getElementById("modal-file-upload").click()} style={{ border: `2px dashed ${attachmentFile ? T.primary : "#cbd5e1"}`, borderRadius: 12, padding: "16px", textAlign: "center", cursor: "pointer", background: T.bg }}>
                   <input id="modal-file-upload" type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => setAttachmentFile(e.target.files[0] || null)} />
                   {attachmentFile ? (
                     <span style={{ fontSize: 12, fontWeight: "700", color: T.primary }}>📎 &nbsp; {attachmentFile.name}</span>
                   ) : (
                     <span style={{ fontSize: 12, color: T.textGray, fontWeight: "600" }}>🖼️ &nbsp; Klik untuk pilih berkas lampiran</span>
                   )}
                 </div>
               </div>

               <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                 <Button disableRipple onPress={() => setIsLeaveModalOpen(false)} style={{ background: "white", border: T.cardBorder, color: T.textDark, borderRadius: 12, height: 44, fontWeight: "700" }}>Batal</Button>
                 <Button disableRipple isLoading={leaveLoading} onPress={handleSubmitLeave} className="glow-btn" style={{ background: T.primary, color: "white", borderRadius: 12, height: 44, fontWeight: "700" }}>Kirim Pengajuan</Button>
               </div>
             </div>
           </div>
         )}

         {activePage === "leaves" && (
            <div className="glass-card animate-fade-in-up" style={{ borderRadius: 20, border: T.cardBorder, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: "800", color: T.textDark }}>Riwayat Pengajuan Cuti</h3>
              </div>
              <div className="resp-table-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Tipe Cuti</th>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Jadwal</th>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Durasi</th>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Lampiran</th>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id} style={{ borderBottom: T.cardBorder }}>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "700" }}><span style={{marginRight: 8}}>📄</span>{l.leave_type_name || "Cuti Tahunan"}</td>
                      <td style={{ padding: "16px 24px", fontSize: 12, color: T.textGray, fontWeight: "600" }}>{l.start_date.slice(0,10)} sd {l.end_date.slice(0,10)}</td>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, textAlign: "center", fontWeight: "800" }}>{l.total_days} Hari</td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        {leaveRowHasAttachment(l) ? (
                          <button
                            type="button"
                            onClick={() => openMyAttachment(l)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: T.primary, fontSize: 12, fontWeight: "800" }}>
                            📎 Buka File
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: T.textLight, fontWeight: "600" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <span className={`status-pill status-${l.status === 'disetujui' ? 'approved' : l.status}`}>
                          <span className="status-dot"></span>
                          {statusStyle[l.status]?.label || l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && <tr><td colSpan="5" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray, fontWeight: "600" }}>Belum ada riwayat cuti.</td></tr>}
                </tbody>
              </table>
              </div>
            </div>
         )}

         {activePage === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }} className="animate-fade-in-up">
              {/* Banner Panduan / SOP Cuti (Refactored to gorgeous gradient overlay) */}
              <div style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4f46e5 100%)", borderRadius: 20, padding: 36, color: "white", boxShadow: "0 15px 35px rgba(37,99,235,0.2)" }}>
                 <h3 style={{ fontSize: 18, fontWeight: "800", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 12, letterSpacing: -0.3 }}>
                    <span style={{ fontSize: 24 }}>📚</span> Kebijakan & Regulasi Cuti Kantor
                 </h3>
                 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                   <p style={{ margin: 0, fontSize: 13, opacity: 0.9, lineHeight: 1.6, display: "flex", gap: 12, fontWeight: "500" }}>
                      <span style={{ fontWeight: "800" }}>1.</span> <span>Pengajuan Cuti Tahunan wajib dilakukan selambat-lambatnya <b>H-3</b> sebelum tanggal mulai cuti agar tim dapat menyesuaikan alur kerja.</span>
                   </p>
                   <p style={{ margin: 0, fontSize: 13, opacity: 0.9, lineHeight: 1.6, display: "flex", gap: 12, fontWeight: "500" }}>
                      <span style={{ fontWeight: "800" }}>2.</span> <span>Pengajuan Cuti Sakit yang memakan waktu lebih dari 1 hari <b>wajib menyertakan lampiran</b> Surat Dokter sah dari Klinik/Rumah Sakit.</span>
                   </p>
                   <p style={{ margin: 0, fontSize: 13, opacity: 0.9, lineHeight: 1.6, display: "flex", gap: 12, fontWeight: "500" }}>
                      <span style={{ fontWeight: "800" }}>3.</span> <span>Persetujuan pengajuan cuti bersifat mutlak di bawah wewenang Staff HRD berdasarkan persentase kesiapan tim divisi masing-masing.</span>
                   </p>
                 </div>
              </div>

              {/* Daftar Jenis Hak Cuti */}
              <div>
                 <h3 style={{ fontSize: 16, fontWeight: "800", color: T.textDark, margin: "0 0 16px 0" }}>Kebijakan & Detail Sisa Kuota Cuti Anda</h3>
                 <div className="resp-info-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                    {balances.map(b => (
                       <div key={b.id} className="glass-card premium-card-hover" style={{ borderRadius: 20, border: T.cardBorder, padding: 24, paddingLeft: 20, borderLeft: `6px solid ${T.primary}`, display: "flex", flexDirection: "column", gap: 12, cursor: "default" }}>
                          <div>
                             <p style={{ fontSize: 13, fontWeight: "800", color: T.textDark, margin: "0 0 8px 0" }}>{b.leave_type_name.toUpperCase()}</p>
                             <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ display: "inline-block", background: "rgba(16,185,129,0.08)", color: T.green, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: "800" }}>SISA: {b.remaining_days} HARI</span>
                                <span style={{ display: "inline-block", background: "rgba(239,68,68,0.08)", color: T.red, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: "800" }}>TERPAKAI: {b.used_days} HARI</span>
                             </div>
                          </div>
                          <div style={{ height: 5, background: isDarkMode ? "#334155" : "#f1f5f9", borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
                             <div style={{ width: `${(b.used_days / (b.total_days || 1)) * 100}%`, height: "100%", background: T.primary }}></div>
                          </div>
                          <p style={{ fontSize: 11, color: T.textGray, margin: 0, lineHeight: 1.5, fontWeight: "600" }}>
                             Total kuota yang dialokasikan untuk Anda adalah {b.total_days} hari pada tahun anggaran {b.year}.
                          </p>
                       </div>
                    ))}
                    {balances.length === 0 && (
                       <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 32, background: T.cardBg, borderRadius: 20, border: T.cardBorder, color: T.textGray, fontSize: 13, fontWeight: "600" }}>
                          Sedang menyinkronkan kebijakan cuti dengan server...
                       </div>
                    )}
                 </div>
              </div>
            </div>
         )}

         {activePage === "calendar" && (
            <div className="glass-card animate-fade-in-up" style={{ borderRadius: 20, border: T.cardBorder, minHeight: 600, display: "flex", flexDirection: "column" }}>
              <div className="resp-calendar-toolbar" style={{ padding: "24px 32px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                   <h3 style={{ margin: 0, fontSize: 18, fontWeight: "800", color: T.textDark, letterSpacing: -0.3 }}>Kalender Jadwal Pribadi</h3>
                   <p style={{ margin: "4px 0 0 0", fontSize: 13, color: T.textGray, fontWeight: "600" }}>Visualisasi hari kerja serta agenda cuti Anda secara interaktif.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <button type="button" onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))} style={{ width: 40, height: 40, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", fontWeight: "bold", color: T.textDark }}>←</button>
                  <span style={{ fontSize: 14, fontWeight: "800", minWidth: 120, textAlign: "center", color: T.textDark }}>
                    {currentMonthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                  </span>
                  <button type="button" onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))} style={{ width: 40, height: 40, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", fontWeight: "bold", color: T.textDark }}>→</button>
                  <button type="button" onClick={() => setCurrentMonthDate(new Date())} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: "none", background: T.highlightBg, color: T.primary, cursor: "pointer", fontWeight: "700", fontSize: 13 }}>Hari Ini</button>
                </div>
              </div>
              
              <div className="resp-calendar-scroll" style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column" }}>
                 <div className="resp-calendar-inner">
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, marginBottom: 12 }}>
                   {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map(d => (
                     <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: "800", color: T.textGray, textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
                   ))}
                 </div>
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, flex: 1 }}>
                   {(() => {
                     const year = currentMonthDate.getFullYear();
                     const month = currentMonthDate.getMonth();
                     const firstDay = new Date(year, month, 1).getDay();
                     const daysInMonth = new Date(year, month + 1, 0).getDate();
                     
                     const cells = [];
                     for(let i=0; i<firstDay; i++) cells.push(<div key={`empty-${i}`} style={{ background: T.bg, borderRadius: 12, opacity: 0.3 }}></div>);
                     
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
                         <div key={day} className="resp-calendar-cell" style={{ border: drops.length > 0 ? `2px solid ${T.primary}` : T.cardBorder, borderRadius: 12, minHeight: 120, padding: "8px", background: isToday ? "rgba(37,99,235,0.06)" : (drops.length > 0 ? "rgba(37,99,235,0.04)" : T.cardBg), display: "flex", flexDirection: "column", gap: 4, transition: "transform 0.1s", cursor: "pointer" }}
                              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                           <div style={{ fontSize: 14, fontWeight: isToday || drops.length > 0 ? "800" : "700", color: isToday ? T.primary : T.textDark, textAlign: "right", marginBottom: 4 }}>
                             {day}
                           </div>
                           <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 }}>
                             {drops.map(l => (
                               <div key={'drop'+l.id} title={l.leave_type_name} style={{ background: T.primary, color: "white", fontSize: 10, fontWeight: "800", padding: "6px 8px", borderRadius: 8, textAlign: "center", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}>
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
            </div>
         )}

       </div>

       {/* SUCCESS MODAL REUSABLE */}
       {successModal.open && (
         <div className="resp-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001, backdropFilter: "blur(6px)", padding: 20 }}>
           <div className="resp-modal-shell animate-bounce-subtle" style={{ background: "white", borderRadius: 28, padding: "40px 32px", width: 400, maxWidth: "100%", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}>
             <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px" }}>
               ✓
             </div>
             <h2 style={{ fontSize: 22, fontWeight: "800", color: "#1e293b", margin: "0 0 12px 0" }}>{successModal.title}</h2>
             <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 32px 0", lineHeight: 1.6 }}>{successModal.message}</p>
             <Button 
               disableRipple 
               onPress={() => setSuccessModal({ ...successModal, open: false })} 
               style={{ width: "100%", background: "#1e293b", color: "white", height: 52, borderRadius: 16, fontWeight: "700", fontSize: 15 }}
             >
               Oke, Mengerti
             </Button>
           </div>
         </div>
       )}
    </div>
  );
}