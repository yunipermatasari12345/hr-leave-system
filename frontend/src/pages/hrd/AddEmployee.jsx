import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Avatar } from "@heroui/react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  return config;
});

export default function AddEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", department: "", position: "", phone: "" });

  const name = localStorage.getItem("name") || "HRD Admin";
  const mainBgColor = "#eef4fb";
  const sidebarColor = "#1a73e8";

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.full_name || !form.department || !form.position) {
      setError("SEMUA FIELD WAJIB DIISI KECUALI NOMOR HP"); return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.post("/api/hrd/employees", form);
      setSuccess("KARYAWAN BERHASIL DITAMBAHKAN!");
      setForm({ email: "", password: "", full_name: "", department: "", position: "", phone: "" });
    } catch (e) {
      setError(e.response?.data?.error?.toUpperCase() || "GAGAL MENAMBAHKAN KARYAWAN");
    } finally { setLoading(false); }
  };

  const fields = [
    { label: "NAMA LENGKAP", field: "full_name", placeholder: "Budi Santoso", type: "text", required: true },
    { label: "NOMOR HP", field: "phone", placeholder: "08123456789", type: "text", required: false },
    { label: "DEPARTEMEN", field: "department", placeholder: "IT, HR, Finance...", type: "text", required: true },
    { label: "JABATAN", field: "position", placeholder: "Engineer, Staff...", type: "text", required: true },
    { label: "EMAIL LOGIN", field: "email", placeholder: "budi@appskep.com", type: "email", required: true },
    { label: "PASSWORD", field: "password", placeholder: "Buat password", type: "password", required: true },
  ];

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const MenuItem = ({ id, label, icon, isActive }) => {
    return (
      <div
        onClick={() => navigate("/hrd/dashboard")}
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
        <span style={{ fontSize: 13 }}>{label}</span>
      </div>
    );
  };

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

        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 20 }}>
          <MenuItem id="dashboard" label="Dashboard" icon="❖" isActive={false} />
          <MenuItem id="leaves" label="Pengajuan Cuti" icon="📑" isActive={false} />
          <MenuItem id="employees" label="Data Karyawan" icon="👥" isActive={true} />
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: "2px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Avatar name={name} size="sm" style={{ background: "white", border: "2px solid white", color: "#000", fontWeight: "bold" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "bold", color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "white", margin: 0, opacity: 0.9 }}>Portal HRD</p>
            </div>
          </div>
          <Button disableRipple onPress={() => { localStorage.clear(); navigate("/login"); }} style={{ width: "100%", background: "white", border: "none", color: "#000", fontWeight: "bold", fontSize: 13, padding: "16px 0", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            KELUAR
          </Button>
        </div>
      </div>

      {/* Form Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ padding: "32px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: "bold", color: "#000000", margin: "0 0 6px 0", letterSpacing: -0.5 }}>
              TAMBAH KARYAWAN
            </h2>
            <p style={{ fontSize: 13, fontWeight: "bold", color: "#000000", margin: 0 }}>
              BUAT AKUN BARU UNTUK KARYAWAN
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button disableRipple onPress={() => navigate("/hrd/dashboard")} style={{ background: "white", border: "2px solid #000", color: "#000", fontWeight: "bold", fontSize: 12, borderRadius: 20, padding: "0 16px", height: 38 }}>
              KEMBALI KE DASHBOARD
            </Button>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#000000", background: "white", padding: "10px 16px", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              📅 &nbsp; {today.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>
          <div style={{ maxWidth: 800, background: "white", borderRadius: 20, border: "2px solid #e2e8f0", padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>

            {error && <div style={{ background: "#fef2f2", border: "2px solid #000", color: "#000", padding: "12px 16px", borderRadius: 12, fontSize: 12, fontWeight: "bold", marginBottom: 20 }}>{error}</div>}
            {success && <div style={{ background: "#f0fdf4", border: "2px solid #000", color: "#000", padding: "12px 16px", borderRadius: 12, fontSize: 12, fontWeight: "bold", marginBottom: 20 }}>{success}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              {fields.map(item => (
                <div key={item.field}>
                  <p style={{ fontSize: 12, fontWeight: "bold", color: "#000", margin: "0 0 6px 0" }}>{item.label} {item.required && <span style={{ color: "#ef4444" }}>*</span>}</p>
                  <Input
                    type={item.type}
                    placeholder={item.placeholder}
                    value={form[item.field]}
                    onValueChange={(val) => setForm(prev => ({ ...prev, [item.field]: val }))}
                    variant="bordered"
                    size="md"
                    classNames={{
                      inputWrapper: "border-2 border-slate-300 hover:border-black focus-within:!border-black bg-white rounded-xl shadow-none",
                      input: "font-bold text-black text-sm"
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Button disableRipple variant="bordered" onPress={() => navigate("/hrd/dashboard")} style={{ fontSize: 13, fontWeight: "bold", borderRadius: 10, border: "2px solid #000", color: "#000", padding: "0 24px", height: 44 }}>
                BATAL
              </Button>
              <Button disableRipple isLoading={loading} onPress={handleSubmit}
                style={{ background: "#1a73e8", border: "2px solid #000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, padding: "0 24px", height: 44 }}>
                SIMPAN KARYAWAN
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}