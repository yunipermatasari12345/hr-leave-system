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
    <div onClick={() => navigate(id === 'dashboard' ? "/hrd/dashboard" : "/hrd/employees/add")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: id === "add_employee" ? "#eff6ff" : "transparent", color: id === "add_employee" ? "#1d4ed8" : T.textGray, fontWeight: id === "add_employee" ? "600" : "500", fontSize: 14, transition: "background 0.2s", marginBottom: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR KLASIK */}
      <div style={{ width: 260, background: T.sidebar, borderRight: T.cardBorder, display: "flex", flexDirection: "column", flexShrink: 0, paddingTop: 32 }}>
        <div style={{ padding: "0 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ color: T.primary, fontSize: 22, fontWeight: "800", margin: 0, textTransform: "uppercase", letterSpacing: -0.5 }}>Appskep</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
          <MenuItem id="dashboard" label="Dashboard Utama" icon="❖" />
          <MenuItem id="add_employee" label="Tambah Karyawan" icon="👤" />
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: T.cardBorder }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold" }}>HR</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "500", color: T.textGray, margin: 0 }}>Administrator HRD</p>
            </div>
          </div>
          <Button disableRipple onPress={() => { localStorage.clear(); navigate("/login"); }} style={{ width: "100%", background: "transparent", border: "none", color: T.textGray, fontWeight: "600", fontSize: 13, justifyContent: "flex-start", padding: 0 }} onMouseEnter={(e)=>e.currentTarget.style.color=T.red} onMouseLeave={(e)=>e.currentTarget.style.color=T.textGray}>
            <span style={{ marginRight: 8, fontSize: 16 }}>🚪</span> Keluar
          </Button>
        </div>
      </div>

      {/* Form Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ padding: "40px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: "0 0 8px 0" }}>Tambahkan Karyawan Baru</h2>
            <p style={{ fontSize: 13, color: T.textGray, margin: 0 }}>Buat data base dan akses login karyawan yang baru masuk.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: T.textGray }}>📅 &nbsp; {today}</div>
            <Button disableRipple onPress={() => navigate("/hrd/dashboard")} style={{ background: "white", border: T.cardBorder, color: T.textDark, fontWeight: "600", borderRadius: 8, height: 40, padding: "0 20px" }}>
              Batal
            </Button>
          </div>
        </div>

        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>
          <div style={{ maxWidth: 800, background: "white", borderRadius: 12, border: T.cardBorder, padding: 32 }}>

            {error && <div style={{ background: "#fef2f2", color: T.red, padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: "500", marginBottom: 24 }}>{error}</div>}
            {success && <div style={{ background: "#f0fdf4", color: T.green, padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: "500", marginBottom: 24 }}>{success}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              {fields.map(item => (
                <div key={item.field}>
                  <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
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
                        borderRadius: 10, 
                        border: T.cardBorder, 
                        outline: "none", 
                        color: T.textDark, 
                        background: T.bg, 
                        fontSize: 14,
                        fontWeight: "500",
                        transition: "all 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = T.primary}
                      onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
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
                        inputWrapper: "border border-slate-200 bg-slate-50 shadow-none hover:border-slate-300 focus-within:!border-blue-600 focus-within:!bg-white rounded-lg",
                        input: "text-slate-700 text-sm font-medium"
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Role Selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                Role / Jabatan Sistem <span style={{ color: T.red }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, role: "employee" }))}
                  style={{
                    flex: 1, padding: "14px 20px", borderRadius: 10, cursor: "pointer", fontWeight: "600", fontSize: 14,
                    border: form.role === "employee" ? `2px solid ${T.primary}` : `2px solid #e5e7eb`,
                    background: form.role === "employee" ? "#eff6ff" : "white",
                    color: form.role === "employee" ? T.primary : T.textGray,
                    transition: "all 0.2s"
                  }}
                >
                  👤 Karyawan (Employee)
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, role: "hrd" }))}
                  style={{
                    flex: 1, padding: "14px 20px", borderRadius: 10, cursor: "pointer", fontWeight: "600", fontSize: 14,
                    border: form.role === "hrd" ? `2px solid #7c3aed` : `2px solid #e5e7eb`,
                    background: form.role === "hrd" ? "#f5f3ff" : "white",
                    color: form.role === "hrd" ? "#7c3aed" : T.textGray,
                    transition: "all 0.2s"
                  }}
                >
                  🛡️ Staff HRD
                </button>
              </div>
              <p style={{ fontSize: 12, color: T.textLight, marginTop: 8, marginBottom: 0 }}>
                {form.role === "hrd" ? "⚠️ Staff HRD dapat mengakses dashboard dan mengelola data karyawan." : "✅ Karyawan hanya dapat mengajukan dan melihat cuti mereka sendiri."}
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: T.cardBorder, paddingTop: 24 }}>
              <Button disableRipple variant="bordered" onPress={() => navigate("/hrd/dashboard")} style={{ fontSize: 14, fontWeight: "600", borderRadius: 8, border: T.cardBorder, color: T.textDark, padding: "0 24px", height: 44 }}>
                Batal
              </Button>
              <Button disableRipple isLoading={loading} onPress={handleSubmit}
                style={{ background: T.primary, border: "none", color: "white", fontWeight: "600", fontSize: 14, borderRadius: 8, padding: "0 24px", height: 44 }}>
                Simpan Karyawan
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