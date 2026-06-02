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

  const MenuItem = ({ id, label, icon }) => (
    <div onClick={() => { navigate(id === 'dashboard' ? "/dashboard" : "/leaves/new"); setIsMobileMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: id === "new_leave" ? "#eff6ff" : "transparent", color: id === "new_leave" ? "#1d4ed8" : T.textGray, fontWeight: id === "new_leave" ? "600" : "500", fontSize: 14, transition: "background 0.2s", marginBottom: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
    </div>
  );

  return (
    <div className="resp-layout font-['Plus_Jakarta_Sans',sans-serif]" style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      {/* SIDEBAR PREMIUM */}
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
            <MenuItem id="new_leave" label="Ajukan Cuti Baru" icon="➕" />
          </div>

          <div className="sidebar-profile" style={{ marginTop: "auto", padding: "24px", borderTop: T.cardBorder }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "800", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.25)" }}>
                {name.substring(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: "700", color: T.textDark, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                <p style={{ fontSize: 11, fontWeight: "600", color: T.textGray, margin: 0 }}>{pos} · {dept}</p>
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
            <h2 style={{ fontSize: 24, fontWeight: "800", color: T.textDark, margin: "0 0 6px 0", letterSpacing: -0.5 }}>Formulir Pengajuan Cuti</h2>
            <p style={{ fontSize: 13, color: T.textGray, margin: 0, fontWeight: "500" }}>Isi form di bawah secara lengkap untuk mengajukan cuti baru ke HRD.</p>
          </div>
          <div className="resp-header-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: T.textGray, fontWeight: "600" }}>📅 &nbsp; {today}</div>
            <Button disableRipple onPress={() => navigate("/dashboard")} style={{ background: "white", border: T.cardBorder, color: T.textDark, fontWeight: "700", borderRadius: 12, height: 40, padding: "0 20px" }}>
              Batal
            </Button>
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