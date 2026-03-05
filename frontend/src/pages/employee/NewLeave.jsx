import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  return config;
});

export default function NewLeave() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    leave_type_id: "", start_date: "", end_date: "", reason: ""
  });

  useEffect(() => {
    api.get("/api/leave-types").then(res => setLeaveTypes(res.data || [])).catch(() => {});
  }, []);

  const totalDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const diff = Math.floor((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async () => {
    if (!form.leave_type_id || !form.start_date || !form.end_date || !form.reason) {
      setError("Semua field wajib diisi!"); return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("Tanggal selesai tidak boleh sebelum tanggal mulai!"); return;
    }
    setLoading(true); setError("");
    try {
      await api.post("/api/employee/leaves", { ...form, leave_type_id: parseInt(form.leave_type_id) });
      setSuccess("Pengajuan cuti berhasil dikirim! Menunggu persetujuan HRD.");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (e) {
      setError(e.response?.data?.error || "Gagal mengajukan cuti");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      {/* Sidebar */}
      <div style={{ width: 256, background: "#4338ca", color: "white", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
          <p style={{ fontWeight: "bold", fontSize: 14, margin: 0 }}>HR Leave System</p>
          <p style={{ fontSize: 12, margin: 0, opacity: 0.7 }}>Portal Karyawan</p>
        </div>
        <div style={{ padding: 16 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 14, padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}
          >
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div style={{ flex: 1, padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#111827", margin: 0 }}>Ajukan Cuti</h1>
        <p style={{ color: "#6b7280", marginTop: 4, marginBottom: 24 }}>Isi form di bawah untuk mengajukan cuti</p>

        <div style={{ maxWidth: 640, background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 12, fontSize: 14 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "12px 16px", borderRadius: 12, fontSize: 14 }}>
              ✅ {success}
            </div>
          )}

          {/* Jenis Cuti */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>Jenis Cuti <span style={{ color: "red" }}>*</span></label>
            <select
              value={form.leave_type_id}
              onChange={(e) => setForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
              style={{ border: "2px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "white", outline: "none", cursor: "pointer" }}
            >
              <option value="">-- Pilih jenis cuti --</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={String(type.id)}>
                  {type.name} (maks. {type.max_days} hari)
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>Tanggal Mulai <span style={{ color: "red" }}>*</span></label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                style={{ border: "2px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "white", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>Tanggal Selesai <span style={{ color: "red" }}>*</span></label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                style={{ border: "2px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "white", outline: "none" }}
              />
            </div>
          </div>

          {totalDays() > 0 && (
            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4338ca", padding: "12px 16px", borderRadius: 12, fontSize: 14 }}>
              📅 Total cuti: <strong>{totalDays()} hari</strong>
            </div>
          )}

          {/* Alasan */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>Alasan Cuti <span style={{ color: "red" }}>*</span></label>
            <textarea
              rows={4}
              placeholder="Jelaskan alasan pengajuan cuti kamu..."
              value={form.reason}
              onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
              style={{ border: "2px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "white", outline: "none", resize: "none", fontFamily: "inherit" }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{ padding: "10px 20px", borderRadius: 12, border: "2px solid #e5e7eb", background: "white", color: "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: loading ? "#a5b4fc" : "#4338ca", color: "white", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}