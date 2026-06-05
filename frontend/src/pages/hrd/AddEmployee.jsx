import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { employeeApi } from "../../api/employeeApi";
import { STORAGE_KEYS } from "../../constants/storage";

export default function AddEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ email: "", full_name: "", department: "", position: "", phone: "", role: "employee" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const DEPT_OPTIONS = ["Product", "Bisnis", "Kreatif"];
  const POS_OPTIONS = ["Coordinator of appsgizi", "Marketing", "Admin Officer", "Co Manager", "Manager"];

  const name = localStorage.getItem(STORAGE_KEYS.name) || "HRD Admin";

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
    sidebar: mode === "dark" ? "#1e293b" : "#0ea5e9", 
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
    activeMenuBg: mode === "dark" ? "rgba(59, 130, 246, 0.15)" : "#ffffff", 
    activeMenuText: mode === "dark" ? "#60a5fa" : "#0ea5e9", 
    logoText: mode === "dark" ? "#f8fafc" : "#ffffff", 
    logoIconBg: mode === "dark" ? "#4f46e5" : "rgba(255, 255, 255, 0.2)",
    inactiveMenuText: mode === "dark" ? "#cbd5e1" : "rgba(255, 255, 255, 0.85)"
  };

  const handleSubmit = async () => {
    if (!form.email || !form.full_name || !form.department || !form.position || !form.role) {
      setError("Semua field wajib diisi kecuali nomor HP!"); return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      await employeeApi.createForHR(form);
      setSuccess("Karyawan berhasil ditambahkan!");
      setForm({ email: "", full_name: "", department: "", position: "", phone: "", role: "employee" });
    } catch (e) {
      setError(e.response?.data?.error || "Gagal menambahkan karyawan");
    } finally { setLoading(false); }
  };

  const fields = [
    { label: "Nama Lengkap", field: "full_name", placeholder: "Contoh: Budi Santoso", type: "text", required: true },
    { label: "Nomor HP", field: "phone", placeholder: "Contoh: 08123456789", type: "text", required: false },
    { label: "Departemen", field: "department", placeholder: "Contoh: IT, HR, Finance", type: "text", required: true },
    { label: "Jabatan", field: "position", placeholder: "Contoh: Software Engineer", type: "text", required: true },
    { label: "Email Login", field: "email", placeholder: "Contoh: budi@appskep.com", type: "email", required: true },
  ];

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const MenuHeader = ({ label }) => (
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

  const MenuItem = ({ id, label, icon }) => {
    const isActive = id === "employees";
    return (
      <div 
        onClick={() => { 
          if (id === "employees") {
            setIsMobileMenuOpen(false);
          } else {
            navigate("/hrd/dashboard", { state: { activePage: id } });
          }
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
      {/* SIDEBAR PREMIUM */}
      <div className="resp-sidebar" style={{ 
        width: 260, 
        background: T.sidebar, 
        borderRight: isDarkMode ? T.cardBorder : "none", 
        display: "flex", 
        flexDirection: "column", 
        flexShrink: 0, 
        paddingTop: 32,
        color: isDarkMode ? T.textDark : "#ffffff"
      }}>
        <div className="sidebar-logo" style={{ padding: "0 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: T.logoIconBg, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 13 }}>AS</div>
            <h1 style={{ color: T.logoText, fontSize: 18, fontWeight: "800", margin: 0, letterSpacing: -0.5 }}>appskep</h1>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: isDarkMode ? T.textDark : "#ffffff" }}>
             {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        
        <div className={`sidebar-collapsible ${isMobileMenuOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column", flex: 1, background: isMobileMenuOpen ? T.sidebar : "transparent" }}>
          <div className="sidebar-menu" style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
            <MenuHeader label="Utama" />
            <MenuItem id="dashboard" label="Dashboard" icon="❖" />
            
            <MenuHeader label="Manajemen Cuti" />
            <MenuItem id="leaves" label="Pengajuan Cuti" icon="📑" />
            <MenuItem id="calendar" label="Kalender Cuti" icon="📅" />
            
            <MenuHeader label="Manajemen Pegawai" />
            <MenuItem id="employees" label="Data Karyawan" icon="👥" />
            
            <MenuHeader label="Laporan & Keamanan" />
            <MenuItem id="reports" label="Laporan Ekspor" icon="📊" />
            <MenuItem id="audit" label="Audit Trail" icon="🛡️" />
          </div>

          <div className="sidebar-profile" style={{ marginTop: "auto", padding: "24px", borderTop: isDarkMode ? T.cardBorder : "1px solid rgba(255, 255, 255, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: isDarkMode ? "#3b82f6" : "rgba(255, 255, 255, 0.25)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "800" }}>HR</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: "700", color: isDarkMode ? T.textDark : "#ffffff", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                <p style={{ fontSize: 11, fontWeight: "500", color: isDarkMode ? T.textGray : "rgba(255, 255, 255, 0.8)", margin: 0 }}>Administrator HRD</p>
              </div>
            </div>
            <Button disableRipple onPress={() => { localStorage.clear(); navigate("/login"); }} style={{ width: "100%", background: isDarkMode ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.2)", border: "none", color: isDarkMode ? T.red : "#ffffff", fontWeight: "700", fontSize: 13, borderRadius: 8, height: 38 }} onMouseEnter={(e)=>e.currentTarget.style.background=isDarkMode ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.3)"} onMouseLeave={(e)=>e.currentTarget.style.background=isDarkMode ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.2)"}>
              🚪 &nbsp; Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="resp-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div className="resp-form-topbar" style={{ padding: "40px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: "800", color: T.textDark, margin: "0 0 6px 0", letterSpacing: -0.5 }}>Tambahkan Karyawan Baru</h2>
            <p style={{ fontSize: 13, color: T.textGray, margin: 0, fontWeight: "500" }}>Buat database dan akses login karyawan yang baru masuk ke sistem.</p>
          </div>
          <div className="resp-header-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: T.textGray, fontWeight: "600" }}>📅 &nbsp; {today}</div>
            <Button disableRipple onPress={() => navigate("/hrd/dashboard")} style={{ background: "white", border: T.cardBorder, color: T.textDark, fontWeight: "700", borderRadius: 12, height: 40, padding: "0 20px" }}>
              Batal
            </Button>
          </div>
        </div>

        <div className="resp-form-body" style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>
          <div className="glass-card resp-card-fluid rounded-[24px] border border-white/40 shadow-xl" style={{ maxWidth: 800, margin: "0 auto", padding: 36 }}>

            {error && <div style={{ background: "rgba(239, 68, 68, 0.08)", color: T.red, padding: "14px 18px", borderRadius: 16, fontSize: 13, fontWeight: "600", marginBottom: 24, border: "1px solid rgba(239, 68, 68, 0.18)" }}>⚠️ {error}</div>}
            {success && <div style={{ background: "rgba(16, 185, 129, 0.08)", color: T.green, padding: "14px 18px", borderRadius: 16, fontSize: 13, fontWeight: "600", marginBottom: 24, border: "1px solid rgba(16, 185, 129, 0.18)" }}>✅ {success}</div>}

            <div className="resp-grid-2 resp-grid-2--equal" style={{ gap: 24, marginBottom: 28 }}>
              {fields.map(item => (
                <div key={item.field}>
                  <label style={{ fontSize: 13, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {item.label} {item.required && <span style={{ color: T.red }}>*</span>}
                  </label>
                  {item.field === 'department' || item.field === 'position' ? (
                    <input
                      type={item.type}
                      placeholder={item.placeholder}
                      value={form[item.field]}
                      onChange={(e) => setForm(prev => ({ ...prev, [item.field]: e.target.value }))}
                      list={item.field === 'department' ? 'dept-list' : 'pos-list'}
                      style={{ 
                        width: "100%", 
                        padding: "12px 16px", 
                        borderRadius: 12, 
                        border: "1px solid #cbd5e1", 
                        outline: "none", 
                        color: T.textDark, 
                        background: T.bg, 
                        fontSize: 14,
                        fontWeight: "600",
                        transition: "all 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = T.primary}
                      onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                    />
                  ) : (
                    <Input
                      type={item.type}
                      placeholder={item.placeholder}
                      value={form[item.field]}
                      onValueChange={(val) => setForm(prev => ({ ...prev, [item.field]: val }))}
                      variant="bordered"
                      size="md"
                      classNames={{
                        inputWrapper: "border border-slate-300 bg-slate-50 shadow-none hover:border-slate-400 focus-within:!border-blue-600 focus-within:!bg-white rounded-xl h-[46px] px-4",
                        input: "text-slate-700 text-sm font-semibold"
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Role Selector */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: "700", color: T.textDark, display: "block", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Role / Jabatan Sistem <span style={{ color: T.red }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, role: "employee" }))}
                  style={{
                    flex: 1, minWidth: 200, padding: "16px 20px", borderRadius: 16, cursor: "pointer", fontWeight: "700", fontSize: 14,
                    border: form.role === "employee" ? `2px solid ${T.primary}` : `2px solid #cbd5e1`,
                    background: form.role === "employee" ? "rgba(37,99,235,0.06)" : "white",
                    color: form.role === "employee" ? T.primary : T.textGray,
                    transition: "all 0.2s",
                    boxShadow: form.role === "employee" ? "0 4px 15px rgba(37,99,235,0.1)" : "none"
                  }}
                >
                  👤 &nbsp; Karyawan (Akses Biasa)
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, role: "hrd" }))}
                  style={{
                    flex: 1, minWidth: 200, padding: "16px 20px", borderRadius: 16, cursor: "pointer", fontWeight: "700", fontSize: 14,
                    border: form.role === "hrd" ? `2px solid #7c3aed` : `2px solid #cbd5e1`,
                    background: form.role === "hrd" ? "rgba(124,58,237,0.06)" : "white",
                    color: form.role === "hrd" ? "#7c3aed" : T.textGray,
                    transition: "all 0.2s",
                    boxShadow: form.role === "hrd" ? "0 4px 15px rgba(124,58,237,0.1)" : "none"
                  }}
                >
                  🛡️ &nbsp; Staff HRD (Akses Penuh)
                </button>
              </div>
              <p style={{ fontSize: 12, color: T.textLight, marginTop: 12, marginBottom: 0, fontWeight: "600" }}>
                {form.role === "hrd" ? "⚠️ PERINGATAN: Staff HRD memiliki wewenang penuh untuk menyetujui cuti dan mengelola data seluruh pegawai." : "✅ Karyawan hanya diperkenankan mengajukan dan memonitor data cuti miliknya sendiri secara privat."}
              </p>
            </div>

            <div className="resp-form-actions animate-fade-in" style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: T.cardBorder, paddingTop: 28 }}>
              <Button disableRipple variant="bordered" onPress={() => navigate("/hrd/dashboard")} style={{ fontSize: 13, fontWeight: "700", borderRadius: 12, border: T.cardBorder, color: T.textDark, padding: "0 24px", height: 46 }}>
                Batal
              </Button>
              <Button disableRipple isLoading={loading} onPress={handleSubmit}
                className="glow-btn shadow-[0_4px_15px_rgba(37,99,235,0.25)]"
                style={{ background: T.primary, border: "none", color: "white", fontWeight: "700", fontSize: 13, borderRadius: 12, padding: "0 24px", height: 46 }}>
                Simpan Data Karyawan
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Datalist Options */}
      <datalist id="dept-list">
        {DEPT_OPTIONS.map(opt => <option key={opt} value={opt} />)}
      </datalist>
      <datalist id="pos-list">
        {POS_OPTIONS.map(opt => <option key={opt} value={opt} />)}
      </datalist>
    </div>
  );
}