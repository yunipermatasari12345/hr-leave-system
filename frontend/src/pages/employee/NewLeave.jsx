import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea, Avatar } from "@heroui/react";
import { leaveApi } from "../../api/leaveApi";
import { STORAGE_KEYS } from "../../constants/storage";

export default function NewLeave() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });

  const name = localStorage.getItem(STORAGE_KEYS.name) || "Karyawan";
  const mainBgColor = "#eef4fb";
  const sidebarColor = "#1a73e8";

  useEffect(() => {
    leaveApi
      .getTypes()
      .then((data) => setLeaveTypes(data || []))
      .catch(() => {});
  }, []);

  const totalDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const diff = Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async () => {
    if (!form.leave_type_id || !form.start_date || !form.end_date || !form.reason) {
      setError("SEMUA FIELD WAJIB DIISI!"); return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("TANGGAL SELESAI TIDAK BOLEH SEBELUM TANGGAL MULAI!"); return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      await leaveApi.createRequest({
        ...form,
        leave_type_id: parseInt(form.leave_type_id, 10),
      });
      setSuccess("PENGAJUAN BERHASIL DIKIRIM! MENUNGGU PERSETUJUAN HRD");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (e) {
      setError(e.response?.data?.error?.toUpperCase() || "GAGAL MENGAJUKAN CUTI");
    } finally { setLoading(false); }
  };

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const MenuItem = ({ id, label, icon, isActive }) => {
    return (
      <div
        onClick={() => navigate("/dashboard")}
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
          <MenuItem id="leaves" label="Riwayat Cuti" icon="📄" isActive={false} />
          <MenuItem id="new_leave" label="Ajukan Cuti Baru" icon="➕" isActive={true} />
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: "2px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "bold", color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "white", margin: 0, opacity: 0.9 }}>Portal Karyawan</p>
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
              AJUKAN CUTI BARU
            </h2>
            <p style={{ fontSize: 13, fontWeight: "bold", color: "#000000", margin: 0 }}>
              ISI FORM DI BAWAH UNTUK MENGAJUKAN CUTI
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button disableRipple onPress={() => navigate("/dashboard")} style={{ background: "white", border: "2px solid #000", color: "#000", fontWeight: "bold", fontSize: 12, borderRadius: 20, padding: "0 16px", height: 38 }}>
              KEMBALI KE DASHBOARD
            </Button>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#000000", background: "white", padding: "10px 16px", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              📅 &nbsp; {today.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>
          <div style={{ maxWidth: 700, background: "white", borderRadius: 20, border: "2px solid #e2e8f0", padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>

            {error && <div style={{ background: "#fef2f2", border: "2px solid #000", color: "#000", padding: "12px 16px", borderRadius: 12, fontSize: 12, fontWeight: "bold", marginBottom: 20 }}>{error}</div>}
            {success && <div style={{ background: "#f0fdf4", border: "2px solid #000", color: "#000", padding: "12px 16px", borderRadius: 12, fontSize: 12, fontWeight: "bold", marginBottom: 20 }}>{success}</div>}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: "bold", color: "#000", display: "block", marginBottom: 6 }}>
                JENIS CUTI <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select value={form.leave_type_id}
                onChange={(e) => setForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
                style={{ width: "100%", border: "2px solid #000", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: "bold", background: "white", outline: "none", cursor: "pointer", fontFamily: "inherit", color: "#000" }}>
                <option value="">PILIH JENIS CUTI</option>
                {leaveTypes.map(type => (
                  <option key={type.id} value={String(type.id)}>{type.name.toUpperCase()} (MAKS. {type.max_days} HARI)</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: "bold", color: "#000", display: "block", marginBottom: 6 }}>
                  TANGGAL MULAI <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="date" value={form.start_date}
                  onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                  style={{ width: "100%", border: "2px solid #000", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: "bold", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#000" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: "bold", color: "#000", display: "block", marginBottom: 6 }}>
                  TANGGAL SELESAI <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="date" value={form.end_date}
                  onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                  style={{ width: "100%", border: "2px solid #000", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: "bold", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#000" }} />
              </div>
            </div>

            {totalDays() > 0 && (
              <div style={{ background: "#eef4fb", border: "2px solid #000", color: "#000", padding: "10px 14px", borderRadius: 12, fontSize: 13, marginBottom: 20, fontWeight: "bold" }}>
                TOTAL DURASI: {totalDays()} HARI
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: "bold", color: "#000", display: "block", marginBottom: 6 }}>
                ALASAN CUTI <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <Textarea
                placeholder="Tulis alasan secara jelas dan detail..."
                value={form.reason}
                onValueChange={(val) => setForm(prev => ({ ...prev, reason: val }))}
                variant="bordered"
                minRows={4}
                classNames={{
                  inputWrapper: "border-2 border-black rounded-xl bg-white focus-within:!border-black",
                  input: "font-bold text-black text-sm"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifySelf: "flex-end", width: "100%" }}>
              <Button disableRipple variant="bordered" onPress={() => navigate("/dashboard")} style={{ fontSize: 13, fontWeight: "bold", borderRadius: 10, border: "2px solid #000", color: "#000", padding: "0 24px", height: 44, flex: 1 }}>
                BATAL
              </Button>
              <Button disableRipple isLoading={loading} onPress={handleSubmit}
                style={{ background: "#1a73e8", border: "2px solid #000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, padding: "0 24px", height: 44, flex: 1 }}>
                KIRIM PENGAJUAN
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}