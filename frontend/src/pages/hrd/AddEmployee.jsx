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

  const T = { bg: "#f8fafc", sidebar: "white", cardBorder: "1px solid #e5e7eb", textDark: "#1f2937", textGray: "#64748b", textLight: "#94a3b8", primary: "#2563eb", red: "#ef4444", green: "#10b981", yellow: "#f59e0b" };

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

  const MenuItem = ({ id, label, icon }) => (
    <div onClick={() => { navigate(id === 'dashboard' ? "/hrd/dashboard" : "/hrd/employees/add"); setIsMobileMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: id === "add_employee" ? "#eff6ff" : "transparent", color: id === "add_employee" ? "#1d4ed8" : T.textGray, fontWeight: id === "add_employee" ? "600" : "500", fontSize: 14, transition: "background 0.2s", marginBottom: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
    </div>
  );

  return (
    <div className="resp-layout font-['Plus_Jakarta_Sans',sans-serif]" style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      {/* SIDEBAR KLASIK */}
      <div className="resp-sidebar glass-card" style={{ width: 260, borderRight: T.cardBorder, display: "flex", flexDirection: "column", flexShrink: 0, paddingTop: 32 }}>
        <div className="sidebar-logo" style={{ padding: "0 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 13 }}>AS</div>
            <h1 style={{ color: T.textDark, fontSize: 18, fontWeight: "800", margin: 0, letterSpacing: -0.5 }}>appskep</h1>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: T.textDark }}>
             {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        
        <div className={`sidebar-collapsible ${isMobileMenuOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="sidebar-menu" style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
            <MenuItem id="dashboard" label="Dashboard Utama" icon="❖" />
            <MenuItem id="add_employee" label="Tambah Karyawan" icon="👤" />
          </div>

          <div className="sidebar-profile" style={{ marginTop: "auto", padding: "24px", borderTop: T.cardBorder }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "800", boxShadow: "0 4px 10px rgba(59, 130, 246, 0.25)" }}>HR</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: "700", color: T.textDark, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                <p style={{ fontSize: 11, fontWeight: "600", color: T.textGray, margin: 0 }}>Administrator HRD</p>
              </div>
            </div>
            <Button disableRipple onPress={() => { localStorage.clear(); navigate("/login"); }} style={{ width: "100%", background: "rgba(239, 68, 68, 0.08)", border: "none", color: T.red, fontWeight: "700", fontSize: 13, borderRadius: 10, height: 38 }} onMouseEnter={(e)=>e.currentTarget.style.background="rgba(239, 68, 68, 0.15)"} onMouseLeave={(e)=>e.currentTarget.style.background="rgba(239, 68, 68, 0.08)"}>
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