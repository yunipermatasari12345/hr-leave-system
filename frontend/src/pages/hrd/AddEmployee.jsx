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

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.full_name || !form.department || !form.position) {
      setError("Semua field wajib diisi kecuali nomor HP"); return;
    }
    setLoading(true); setError("");
    try {
      await api.post("/api/hrd/employees", form);
      setSuccess("Karyawan berhasil ditambahkan!");
      setForm({ email: "", password: "", full_name: "", department: "", position: "", phone: "" });
    } catch (e) {
      setError(e.response?.data?.error || "Gagal menambahkan karyawan");
    } finally { setLoading(false); }
  };

  const fields = [
    { label: "Nama Lengkap", field: "full_name", placeholder: "Budi Santoso", type: "text", required: true },
    { label: "Nomor HP", field: "phone", placeholder: "08123456789", type: "text", required: false },
    { label: "Departemen", field: "department", placeholder: "IT, HR, Finance...", type: "text", required: true },
    { label: "Jabatan", field: "position", placeholder: "Engineer, Staff...", type: "text", required: true },
    { label: "Email Login", field: "email", placeholder: "budi@appskep.com", type: "email", required: true },
    { label: "Password", field: "password", placeholder: "Buat password", type: "password", required: true },
  ];

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
              <p style={{ fontSize: 11, margin: 0, color: "#94a3b8" }}>HRD Panel</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 10px" }}>
          <button onClick={() => navigate("/hrd/dashboard")}
            style={{ width: "100%", border: "none", padding: "11px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", background: "transparent", color: "#64748b" }}>
            Kembali ke Dashboard
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: "32px 36px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Tambah Karyawan</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Buat akun baru untuk karyawan</p>
        </div>

        <div style={{ maxWidth: 600, background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>{error}</div>}
          {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>{success}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {fields.map(item => (
              <div key={item.field}>
                <Input
                  type={item.type}
                  label={item.label + (item.required ? " *" : "")}
                  placeholder={item.placeholder}
                  value={form[item.field]}
                  onValueChange={(val) => setForm(prev => ({ ...prev, [item.field]: val }))}
                  variant="bordered"
                  size="sm"
                  classNames={{
                    label: "text-xs font-semibold text-slate-600",
                    inputWrapper: "border-slate-200 hover:border-sky-400 focus-within:!border-sky-500"
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="bordered" onPress={() => navigate("/hrd/dashboard")} style={{ fontSize: 13 }}>Batal</Button>
            <Button isLoading={loading} onPress={handleSubmit}
              style={{ background: "#0ea5e9", color: "white", fontWeight: 600, fontSize: 13 }}>
              Simpan Karyawan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}