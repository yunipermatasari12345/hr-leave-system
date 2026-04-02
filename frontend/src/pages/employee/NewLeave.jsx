import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea } from "@heroui/react";
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

  const name = localStorage.getItem(STORAGE_KEYS.name) || "Karyawan";
  const dept = localStorage.getItem(STORAGE_KEYS.department) || "Grup Umum";
  const pos = localStorage.getItem(STORAGE_KEYS.position) || "Seksi Staff";

  const T = { bg: "#f8fafc", sidebar: "white", cardBorder: "1px solid #e5e7eb", textDark: "#1f2937", textGray: "#64748b", textLight: "#94a3b8", primary: "#2563eb", red: "#ef4444", green: "#10b981", yellow: "#f59e0b" };

  useEffect(() => {
    leaveApi.getTypes().then((data) => setLeaveTypes(data || [])).catch(() => {});
  }, []);

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
    setLoading(true); setError(""); setSuccess("");
    try {
      const formData = new FormData();
      formData.append("leave_type_id", form.leave_type_id);
      formData.append("start_date", form.start_date);
      formData.append("end_date", form.end_date);
      formData.append("reason", form.reason);
      if (attachmentFile) {
        formData.append("attachment", attachmentFile);
      }
      await leaveApi.createRequest(formData);
      setSuccess("Pengajuan berhasil dikirim! Menunggu persetujuan HRD.");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (e) {
      setError(e.response?.data?.error || "Gagal mengajukan cuti");
    } finally { setLoading(false); }
  };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const MenuItem = ({ id, label, icon }) => (
    <div onClick={() => navigate(id === 'dashboard' ? "/dashboard" : "/leaves/new")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: id === "new_leave" ? "#eff6ff" : "transparent", color: id === "new_leave" ? "#1d4ed8" : T.textGray, fontWeight: id === "new_leave" ? "600" : "500", fontSize: 14, transition: "background 0.2s", marginBottom: 4 }}>
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
          <MenuItem id="new_leave" label="Ajukan Cuti Baru" icon="➕" />
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: T.cardBorder }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.yellow, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold" }}>{name.substring(0,2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "500", color: T.textGray, margin: 0 }}>{pos} · {dept}</p>
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
            <h2 style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: "0 0 8px 0" }}>Formulir Pengajuan Cuti</h2>
            <p style={{ fontSize: 13, color: T.textGray, margin: 0 }}>Isi form di bawah untuk mengajukan cuti baru ke HRD.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: T.textGray }}>📅 &nbsp; {today}</div>
            <Button disableRipple onPress={() => navigate("/dashboard")} style={{ background: "white", border: T.cardBorder, color: T.textDark, fontWeight: "600", borderRadius: 8, height: 40, padding: "0 20px" }}>
              Batal
            </Button>
          </div>
        </div>

        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>
          <div style={{ maxWidth: 700, background: "white", borderRadius: 12, border: T.cardBorder, padding: 32 }}>

            {error && <div style={{ background: "#fef2f2", color: T.red, padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: "500", marginBottom: 24 }}>{error}</div>}
            {success && <div style={{ background: "#f0fdf4", color: T.green, padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: "500", marginBottom: 24 }}>{success}</div>}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                Jenis Cuti <span style={{ color: T.red }}>*</span>
              </label>
              <select value={form.leave_type_id}
                onChange={(e) => setForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
                style={{ width: "100%", border: T.cardBorder, borderRadius: 8, padding: "12px 14px", fontSize: 14, color: T.textDark, background: "#f8fafc", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
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
                <input type="date" min={todayIsoStr} value={form.start_date}
                  onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                  style={{ width: "100%", border: T.cardBorder, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.textDark, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#f8fafc" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                  Tanggal Selesai <span style={{ color: T.red }}>*</span>
                </label>
                <input type="date" min={form.start_date || todayIsoStr} value={form.end_date}
                  onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                  style={{ width: "100%", border: T.cardBorder, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.textDark, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#f8fafc" }} />
              </div>
            </div>

            {totalDays() > 0 && (
              <div style={{ background: "#eef2ff", color: T.primary, padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 24, fontWeight: "600" }}>
                Total Durasi: {totalDays()} Hari Kerja <span style={{ fontSize: 11, fontWeight: "400", opacity: 0.8 }}>(Sabtu &amp; Minggu libur)</span>
              </div>
            )}

            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                Alasan Cuti <span style={{ color: T.red }}>*</span>
              </label>
              <Textarea
                placeholder="Tulis alasan secara jelas dan detail..."
                value={form.reason}
                onValueChange={(val) => setForm(prev => ({ ...prev, reason: val }))}
                variant="bordered"
                minRows={4}
                classNames={{
                  inputWrapper: "border border-slate-200 rounded-lg bg-slate-50 shadow-none hover:border-slate-300 focus-within:!border-blue-600 focus-within:!bg-white",
                  input: "text-slate-700 text-sm font-medium"
                }}
              />
            </div>

            {/* Upload Lampiran (Opsional) */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: "600", color: T.textDark, display: "block", marginBottom: 8 }}>
                Lampiran Pendukung <span style={{ fontSize: 12, fontWeight: "400", color: T.textGray }}>(Opsional — Foto/Surat dokter, PDF, dll)</span>
              </label>
              <div
                onClick={() => document.getElementById("file-upload-input").click()}
                style={{ border: `2px dashed ${attachmentFile ? T.primary : "#cbd5e1"}`, borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: attachmentFile ? "#eef2ff" : "#f8fafc", transition: "all 0.2s" }}
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
                    <p style={{ margin: "0 0 4px 0", fontSize: 13, color: T.textGray }}>🖼️ &nbsp; Klik untuk pilih file</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.textLight }}>JPG, PNG, PDF, DOC — Maks. 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: T.cardBorder, paddingTop: 24 }}>
              <Button disableRipple variant="bordered" onPress={() => navigate("/dashboard")} style={{ fontSize: 14, fontWeight: "600", borderRadius: 8, border: T.cardBorder, color: T.textDark, padding: "0 24px", height: 44 }}>
                Batal
              </Button>
              <Button disableRipple isLoading={loading} onPress={handleSubmit}
                style={{ background: T.primary, border: "none", color: "white", fontWeight: "600", fontSize: 14, borderRadius: 8, padding: "0 24px", height: 44 }}>
                Kirim Pengajuan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}