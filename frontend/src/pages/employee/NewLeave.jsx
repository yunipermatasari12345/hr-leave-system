import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { leaveApi } from "../../api/leaveApi";
import { STORAGE_KEYS } from "../../constants/storage";

export default function NewLeave() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [form, setForm] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const name = localStorage.getItem(STORAGE_KEYS.name) || "Karyawan";
  const dept = localStorage.getItem(STORAGE_KEYS.department) || "Grup Umum";
  const pos = localStorage.getItem(STORAGE_KEYS.position) || "Seksi Staff";

  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem(STORAGE_KEYS.theme) === "dark"
  );
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem(STORAGE_KEYS.theme, newMode ? "dark" : "light");
  };

  const T = isDarkMode 
    ? {
        bg: "#0f172a",
        cardBg: "#1e293b",
        cardBorder: "1px solid #334155",
        textDark: "#f8fafc",
        textGray: "#94a3b8",
        textLight: "#64748b",
        primary: "#3b82f6",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b"
      }
    : {
        bg: "#f8fafc",
        cardBg: "white",
        cardBorder: "1px solid #e2e8f0",
        textDark: "#0f172a",
        textGray: "#64748b",
        textLight: "#94a3b8",
        primary: "#3051a3",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b"
      };
  const [balances, setBalances] = useState([]);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  useEffect(() => {
    leaveApi.getTypes().then((data) => setLeaveTypes(data || [])).catch(() => {});
    leaveApi.getMyBalances().then((data) => setBalances(data || [])).catch(() => {});
  }, []);

  const totalTerpakai = balances.find(b => b.leave_type_name === "Cuti Tahunan")?.used_days || 0;
  const sisaCuti = balances.find(b => b.leave_type_name === "Cuti Tahunan")?.remaining_days || 0;

  const todayIsoStr = new Date().toISOString().split("T")[0];

  const totalDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (end < start) return 0;

    let count = 0;
    let current = new Date(start);
    current.setHours(0,0,0,0);
    const endZero = new Date(end);
    endZero.setHours(0,0,0,0);

    while (current <= endZero) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Minggu, 6 = Sabtu
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const handleSubmit = async () => {
    if (!form.leave_type_id || !form.start_date || !form.end_date || !form.reason) {
      setError("Semua field wajib diisi!"); return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("Tanggal selesai tidak boleh sebelum tanggal mulai!"); return;
    }
    if (totalDays() <= 0) {
      setError("Pilih tanggal yang memuat minimal satu hari kerja (bukan hanya akhir pekan).");
      return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      await leaveApi.createRequest({
        leave_type_id: form.leave_type_id,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
        attachment: attachmentFile || undefined,
      });
      setSuccess("Pengajuan berhasil dikirim! Menunggu persetujuan HRD.");
      onOpen(); // Tampilkan modal sukses
      // setTimeout(() => navigate("/dashboard"), 2000); // Hapus auto-redirect agar user bisa klik OK
    } catch (e) {
      // Tampilkan error detail dari backend jika ada
      let backendMsg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Gagal mengajukan cuti";
      setError("Gagal mengajukan cuti: " + backendMsg);
      // Log error ke console untuk debugging
      console.error("[AJUKAN CUTI ERROR]", e);
    } finally { setLoading(false); }
  };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const MenuHeader = ({ label }) => (
    <div style={{ fontSize: 10, fontWeight: "800", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: 1.2, padding: "16px 16px 8px 16px" }}>
      {label}
    </div>
  );

  const MenuItem = ({ id, label, icon }) => {
    const isActive = id === "new_leave";
    return (
      <div 
        onClick={() => { 
          if (id === "new_leave") {
            setIsMobileMenuOpen(false);
          } else if (id === "dashboard") {
            navigate("/dashboard", { state: { activePage: "dashboard" } });
          } else {
            navigate("/dashboard", { state: { activePage: id } });
          }
        }} 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          padding: "12px 16px", 
          borderRadius: 8, 
          cursor: "pointer", 
          background: isActive ? "rgba(255, 255, 255, 0.12)" : "transparent", 
          color: isActive ? "white" : "rgba(255, 255, 255, 0.75)", 
          fontWeight: isActive ? "700" : "500", 
          fontSize: 13, 
          transition: "all 0.2s ease", 
          marginBottom: 4,
          borderLeft: isActive ? "4px solid #fff" : "4px solid transparent",
          paddingLeft: isActive ? 12 : 16,
        }}
        className="premium-menu-item"
      >
        <span style={{ fontSize: 16, opacity: isActive ? 1 : 0.8 }}>{icon}</span> {label}
      </div>
    );
  };

  return (
    <div className={`resp-layout font-['Plus_Jakarta_Sans',sans-serif] ${isDarkMode ? "dark" : ""} w-full`} style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.textDark, transition: "background 0.3s, color 0.3s" }}>
      
      {/* SIDEBAR KLASIK (Visually Uplifted to Premium Corporate Sidebar) */}
      <div className="resp-sidebar" style={{ 
        width: 260, 
        background: isDarkMode ? "#1e293b" : "#3051a3", 
        borderRight: isDarkMode ? "1px solid #334155" : "none", 
        display: "flex", 
        flexDirection: "column", 
        flexShrink: 0, 
        paddingTop: 32,
        color: "white"
      }}>
        <div className="sidebar-logo" style={{ padding: "0 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 13 }}>📅</div>
            <h1 style={{ color: "white", fontSize: 16, fontWeight: "800", margin: 0, letterSpacing: -0.5, textTransform: "uppercase" }}>CUTI APPSKEP</h1>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "white" }}>
             {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        
        <div className={`sidebar-collapsible ${isMobileMenuOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column", flex: 1, background: isMobileMenuOpen ? (isDarkMode ? "#1e293b" : "#3051a3") : "transparent" }}>
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
            <div onClick={() => setIsStatusOpen(!isStatusOpen)} style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "12px 16px", cursor: "pointer", transition: "all 0.3s ease", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>📊</span>
                  <p style={{ fontSize: 10, fontWeight: "800", color: "rgba(255, 255, 255, 0.7)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Kuota Cuti 2026</p>
                </div>
                <span style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.5)", transform: isStatusOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>▼</span>
              </div>
              {isStatusOpen && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed rgba(255, 255, 255, 0.15)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div><p style={{ fontSize: 9, fontWeight: "800", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 2px 0", textTransform: "uppercase" }}>Karyawan</p><p style={{ fontSize: 12, fontWeight: "700", color: "white", margin: 0 }}>{name}</p></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><p style={{ fontSize: 9, fontWeight: "800", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 2px 0", textTransform: "uppercase" }}>Terpakai</p><p style={{ fontSize: 12, fontWeight: "800", color: "white", margin: 0 }}>{totalTerpakai} HARI</p></div>
                    <div><p style={{ fontSize: 9, fontWeight: "800", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 2px 0", textTransform: "uppercase" }}>Sisa</p><p style={{ fontSize: 12, fontWeight: "800", color: "white", margin: 0 }}>{sisaCuti} HARI</p></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-profile" style={{ marginTop: "auto", padding: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "800", border: "1px solid rgba(255, 255, 255, 0.2)" }}>{name.substring(0,2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: "700", color: "white", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                <p style={{ fontSize: 11, fontWeight: "500", color: "rgba(255, 255, 255, 0.65)", margin: 0 }}>{pos}</p>
              </div>
            </div>
            <Button disableRipple onPress={() => { localStorage.clear(); navigate("/login"); }} style={{ width: "100%", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "white", fontWeight: "700", fontSize: 13, borderRadius: 10, height: 38 }} onMouseEnter={(e)=>e.currentTarget.style.background="rgba(255, 255, 255, 0.2)"} onMouseLeave={(e)=>e.currentTarget.style.background="rgba(255, 255, 255, 0.1)"}>
              🚪 &nbsp; Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="resp-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "40px" }}>
        
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
                 <span style={{ color: T.primary }}>Ajukan Cuti Baru</span>
              </div>
              
              <h2 style={{ fontSize: 22, fontWeight: "800", color: T.textDark, margin: 0, letterSpacing: -0.5 }}>
                Formulir Pengajuan Cuti
              </h2>
           </div>
           <div className="resp-header-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
             {/* THEME TOGGLE */}
             <button onClick={toggleTheme} style={{ background: T.bg, border: T.cardBorder, padding: "8px 12px", borderRadius: 8, cursor: "pointer", color: T.textDark, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
               <span>{isDarkMode ? "☀️" : "🌙"}</span>
             </button>

             {/* Message Icon with Badge */}
             <div style={{ position: "relative" }}>
                <button style={{ position: "relative", width: 38, height: 38, borderRadius: 8, border: T.cardBorder, background: T.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.textDark }}>
                  ✉️
                  <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", fontSize: 9, fontWeight: "800", height: 16, minWidth: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    7
                  </span>
                </button>
             </div>

             {/* Notification Bell Icon */}
             <div style={{ position: "relative" }}>
                <button style={{ position: "relative", width: 38, height: 38, borderRadius: 8, border: T.cardBorder, background: T.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.textDark }}>
                  🔔
                </button>
             </div>

             {/* Profile Info far right topbar */}
             <div style={{ display: "flex", alignItems: "center", gap: 10, borderLeft: `1px solid ${isDarkMode ? "#334155" : "#e5e7eb"}`, paddingLeft: 12 }}>
                <span style={{ fontSize: 13, fontWeight: "700", color: T.textDark }} className="hidden md:inline">{name}</span>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: isDarkMode ? "#3b82f6" : "#3051a3", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "800" }}>
                  {name.substring(0, 2).toUpperCase()}
                </div>
             </div>
           </div>
        </div>

        <div className="resp-form-body" style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>
          <div className="glass-card resp-card-fluid rounded-[24px] border border-white/40 shadow-xl" style={{ maxWidth: 720, margin: "0 auto", padding: 36 }}>

            {error && <div style={{ background: "rgba(239, 68, 68, 0.08)", color: T.red, padding: "14px 18px", borderRadius: 16, fontSize: 13, fontWeight: "600", marginBottom: 24, border: "1px solid rgba(239, 68, 68, 0.18)" }}>⚠️ {error}</div>}
            {success && <div style={{ background: "rgba(16, 185, 129, 0.08)", color: T.green, padding: "14px 18px", borderRadius: 16, fontSize: 13, fontWeight: "600", marginBottom: 24, border: "1px solid rgba(16, 185, 129, 0.18)" }}>✅ {success}</div>}

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Jenis Cuti Karyawan <span style={{ color: T.red }}>*</span>
              </label>
              <select value={form.leave_type_id}
                onChange={(e) => setForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: T.textDark, background: "#f8fafc", outline: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: "600", transition: "all 0.2s" }}
                onFocus={(e)=>e.target.style.borderColor=T.primary}
                onBlur={(e)=>e.target.style.borderColor="#cbd5e1"}>
                <option value="">Pilih Jenis Cuti</option>
                {leaveTypes.map(type => (
                  <option key={type.id} value={String(type.id)}>{type.name} (Maks. {type.max_days} Hari)</option>
                ))}
              </select>
            </div>

            <div className="resp-grid-2 resp-grid-2--equal" style={{ gap: 20, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Tanggal Mulai <span style={{ color: T.red }}>*</span>
                </label>
                <input type="date" min={todayIsoStr} value={form.start_date}
                  onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                  style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "12px 16px", fontSize: 14, color: T.textDark, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#f8fafc", fontWeight: "600" }}
                  onFocus={(e)=>e.target.style.borderColor=T.primary}
                  onBlur={(e)=>e.target.style.borderColor="#cbd5e1"} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Tanggal Selesai <span style={{ color: T.red }}>*</span>
                </label>
                <input type="date" min={form.start_date || todayIsoStr} value={form.end_date}
                  onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                  style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "12px 16px", fontSize: 14, color: T.textDark, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#f8fafc", fontWeight: "600" }}
                  onFocus={(e)=>e.target.style.borderColor=T.primary}
                  onBlur={(e)=>e.target.style.borderColor="#cbd5e1"} />
              </div>
            </div>

            {totalDays() > 0 && (
              <div className="gradient-indigo-glow" style={{ padding: "16px 20px", borderRadius: 16, fontSize: 13, marginBottom: 28, fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>✨ Total Durasi Pengajuan:</span>
                <span className="text-indigo-600 dark:text-indigo-200" style={{ fontSize: 15 }}>{totalDays()} Hari Kerja <span style={{ fontSize: 11, fontWeight: "500", opacity: 0.8 }}>(Sabtu &amp; Minggu Libur)</span></span>
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Alasan Pengajuan Cuti <span style={{ color: T.red }}>*</span>
              </label>
              <Textarea
                placeholder="Tulis alasan cuti secara detail dan profesional..."
                value={form.reason}
                onValueChange={(val) => setForm(prev => ({ ...prev, reason: val }))}
                variant="bordered"
                minRows={4}
                classNames={{
                  inputWrapper: "border border-slate-300 rounded-xl bg-slate-50 shadow-none hover:border-slate-400 focus-within:!border-blue-600 focus-within:!bg-white p-3",
                  input: "text-slate-700 text-sm font-medium"
                }}
              />
            </div>

            {/* Upload Lampiran (Opsional) */}
            <div style={{ marginBottom: 36 }}>
              <label style={{ fontSize: 13, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Lampiran Bukti Pendukung <span style={{ fontSize: 11, fontWeight: "500", color: T.textGray }}>(Opsional — Surat Dokter/Undangan, PDF/Gambar)</span>
              </label>
              <div
                onClick={() => document.getElementById("file-upload-input").click()}
                style={{ border: `2px dashed ${attachmentFile ? T.primary : "#cbd5e1"}`, borderRadius: 16, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: attachmentFile ? "rgba(37,99,235,0.04)" : "#f8fafc", transition: "all 0.2s" }}
                onMouseEnter={(e)=>e.currentTarget.style.borderColor=T.primary}
                onMouseLeave={(e)=>{if(!attachmentFile) e.currentTarget.style.borderColor="#cbd5e1"}}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                />
                {attachmentFile ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>📎</span>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: "700", color: T.primary }}>{attachmentFile.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: T.textGray, fontWeight: "600" }}>{(attachmentFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setAttachmentFile(null); }} style={{ marginLeft: 12, border: "none", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer", color: T.red, width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✕</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: "0 0 4px 0", fontSize: 13, color: T.textGray, fontWeight: "600" }}>📥 &nbsp; Seret berkas atau klik untuk pilih file</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.textLight, fontWeight: "500" }}>PDF, PNG, JPG, DOC — Maksimal 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="resp-form-actions animate-fade-in" style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap", borderTop: T.cardBorder, paddingTop: 28 }}>
              <Button disableRipple variant="bordered" onPress={() => navigate("/dashboard")} style={{ fontSize: 13, fontWeight: "700", borderRadius: 12, border: T.cardBorder, color: T.textDark, padding: "0 24px", height: 46 }}>
                Batal
              </Button>
              <Button disableRipple isLoading={loading} onPress={handleSubmit}
                className="glow-btn shadow-[0_4px_15px_rgba(37,99,235,0.25)]"
                style={{ background: T.primary, border: "none", color: "white", fontWeight: "700", fontSize: 13, borderRadius: 12, padding: "0 24px", height: 46 }}>
                Kirim Form Pengajuan
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* MODAL SUKSES PREMIUM */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        isDismissable={false}
        hideCloseButton
        backdrop="blur"
        placement="center"
        motionProps={{
          variants: {
            enter: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
            exit: { y: 20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
          }
        }}
        classNames={{
          base: "border-[#e5e7eb] border-1 rounded-[24px]",
          header: "border-b-[1px] border-[#f1f5f9]",
          footer: "border-t-[1px] border-[#f1f5f9]",
        }}
      >
        <ModalContent>
          <ModalBody className="py-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle shadow-[0_0_25px_rgba(16,185,129,0.25)] border border-emerald-100 dark:border-emerald-900/30">
              <span style={{ fontSize: 40 }}>✅</span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Pengajuan Terkirim!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[290px] font-medium">
              Formulir pengajuan cuti Anda telah berhasil dikirim dan sedang dalam proses peninjauan oleh tim HRD.
            </p>
          </ModalBody>
          <ModalFooter className="flex flex-col gap-2 p-6">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none"
              onPress={() => navigate("/dashboard")}
            >
              Kembali ke Dashboard
            </Button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mt-2">
              Sistem Otomatis PT APPSKEP
            </p>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}