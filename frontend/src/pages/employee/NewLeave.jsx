import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea } from "@heroui/react";
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
  const [form, setForm] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });

  useEffect(() => {
    api.get("/api/leave-types").then(res => setLeaveTypes(res.data || [])).catch(() => {});
  }, []);

  const totalDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const diff = Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1;
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
      setSuccess("Pengajuan berhasil dikirim! Menunggu persetujuan HRD.");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (e) {
      setError(e.response?.data?.error || "Gagal mengajukan cuti");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ width: 220, background: "#0ea5e9", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0, color: "white" }}>APPSKEP HR</p>
          <p style={{ fontSize: 11, margin: "3px 0 0 0", color: "rgba(255,255,255,0.75)" }}>Portal Karyawan</p>
        </div>
        <div style={{ padding: "12px 10px" }}>
          <button onClick={() => navigate("/dashboard")}
            style={{ width: "100%", background: "rgba(255,255,255,0.15)", border: "none", color: "white", padding: "10px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
            Kembali ke Dashboard
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "36px 40px", background: "#f8fafc" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Ajukan Cuti</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Isi form di bawah untuk mengajukan cuti</p>
        </div>

        <div style={{ maxWidth: 560, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 28 }}>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>{error}</div>}
          {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>{success}</div>}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Jenis Cuti <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select value={form.leave_type_id}
              onChange={(e) => setForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
              style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, background: "white", outline: "none", cursor: "pointer", fontFamily: "inherit", color: "#0f172a" }}>
              <option value="">Pilih jenis cuti</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={String(type.id)}>{type.name} (maks. {type.max_days} hari)</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Tanggal Mulai <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="date" value={form.start_date}
                onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Tanggal Selesai <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="date" value={form.end_date}
                onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          </div>

          {totalDays() > 0 && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "8px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
              Total: {totalDays()} hari
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Alasan Cuti <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <Textarea
              placeholder="Jelaskan alasan pengajuan cuti kamu..."
              value={form.reason}
              onValueChange={(val) => setForm(prev => ({ ...prev, reason: val }))}
              variant="bordered"
              minRows={4}
              classNames={{ inputWrapper: "border-gray-200 hover:border-sky-400 focus-within:!border-sky-500" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="bordered" onPress={() => navigate("/dashboard")} style={{ fontSize: 13 }}>Batal</Button>
            <Button isLoading={loading} onPress={handleSubmit}
              style={{ background: "#0ea5e9", color: "white", fontWeight: 600, fontSize: 13 }}>
              Kirim Pengajuan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}