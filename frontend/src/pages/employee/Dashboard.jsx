import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Avatar } from "@heroui/react";
import { leaveApi } from "../../api/leaveApi";
import { STORAGE_KEYS } from "../../constants/storage";

export default function EmployeeDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [detailLeave, setDetailLeave] = useState(null);
  
  // Filters for History
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const navigate = useNavigate();
  const name = localStorage.getItem(STORAGE_KEYS.name) || "Karyawan";
  const dept = localStorage.getItem(STORAGE_KEYS.department) || "Dept. General";
  const pos = localStorage.getItem(STORAGE_KEYS.position) || "Employee";

  useEffect(() => { 
    fetchLeaves(); 
    fetchBalances();
    fetchNotifications();
    fetchLeaveTypes();
  }, []);

  const fetchLeaves = async () => {
    try {
      const data = await leaveApi.getMyLeaves();
      setLeaves(data || []);
    } catch {
      setLeaves([]);
    }
  };

  const fetchBalances = async () => {
    try {
      const data = await leaveApi.getMyBalances();
      setBalances(data || []);
    } catch {
      setBalances([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await leaveApi.getMyNotifications();
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const data = await leaveApi.getTypes();
      setLeaveTypes(data || []);
    } catch {
      setLeaveTypes([]);
    }
  };

  const markNotifRead = async (id) => {
    try {
      await leaveApi.readNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openDetail = (l) => {
    setDetailLeave(l);
    setDetailModalOpen(true);
  };

  const total = leaves.length;
  const approved = leaves.filter(l => l.status === "approved").length;
  const rejected = leaves.filter(l => l.status === "rejected").length;
  const pending = leaves.filter(l => l.status === "pending").length;

  const statusBg = { pending: "#fffbeb", approved: "#f0fdf4", rejected: "#fef2f2" };
  const statusLabel = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

  const mainBgColor = "#ffffff";
  const sidebarColor = "#1a73e8";

  const MenuItem = ({ id, label, icon }) => {
    const isActive = activePage === id;
    return (
      <div
        onClick={() => setActivePage(id)}
        style={{
          background: isActive ? mainBgColor : "transparent",
          color: isActive ? "#000000" : "#ffffff",
          padding: "14px 20px",
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
          position: "relative",
          display: "flex", alignItems: "center", gap: 14,
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
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14 }}>{label}</span>
      </div>
    );
  };

  const getReturnDate = () => {
    const approvedLeaves = leaves.filter(l => l.status === "approved" || l.status === "disetujui");
    if (!approvedLeaves.length) return "-";
    // Sort by end_date descending to find the latest
    const sorted = [...approvedLeaves].sort((a,b) => new Date(b.end_date) - new Date(a.end_date));
    const latestLeave = sorted[0];
    const returnDate = new Date(latestLeave.end_date);
    returnDate.setDate(returnDate.getDate() + 1); // kembali kerja = end_date + 1
    
    return returnDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredLeaves = leaves.filter(l => {
    const d = new Date(l.start_date);
    const mMatch = filterMonth === "" || (d.getMonth() + 1).toString() === filterMonth;
    const yMatch = filterYear === "" || d.getFullYear().toString() === filterYear;
    return mMatch && yMatch;
  });

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: mainBgColor, fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: 240, background: sidebarColor, display: "flex", flexDirection: "column", flexShrink: 0, paddingTop: 32 }}>
        <div style={{ padding: "0 24px", marginBottom: 40, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <svg width="20" height="20" fill="none" stroke={sidebarColor} strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
          </div>
          <h1 style={{ color: "white", fontSize: 20, fontWeight: "bold", margin: 0, letterSpacing: -0.5 }}>Appskep</h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 20 }}>
          <MenuItem id="dashboard" label="Dashboard" icon="❖" />
          <MenuItem id="leaves" label="Riwayat Cuti" icon="📄" />
          <MenuItem id="info" label="Informasi Cuti" icon="💡" />
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: "2px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Avatar name={name} size="sm" style={{ background: "white", color: "#000", fontWeight: "bold", border: "2px solid white" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "bold", color: "white", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "white", margin: 0, opacity: 0.9 }}>{pos.toUpperCase()} | {dept}</p>
            </div>
          </div>
          <Button disableRipple onPress={handleLogout} style={{ width: "100%", background: "white", border: "none", color: "#000", fontWeight: "bold", fontSize: 13, padding: "16px 0", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            KELUAR
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ padding: "32px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: "bold", color: "#000000", margin: "0 0 6px 0", letterSpacing: -0.5 }}>
              {activePage === "dashboard" ? "DASHBOARD" : (activePage === "leaves" ? "RIWAYAT CUTI" : "INFORMASI CUTI")}
            </h2>
            <p style={{ fontSize: 13, fontWeight: "bold", color: "#000000", margin: 0 }}>
              {activePage === "dashboard" ? `SELAMAT DATANG KEMBALI, ${name.toUpperCase()}` : (activePage === "leaves" ? `${leaves.length} PENGAJUAN DITEMUKAN` : "SISA KUOTA DAN JADWAL MASUK")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#000000", background: "white", padding: "10px 16px", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              📅 &nbsp; {today.toUpperCase()}
            </div>
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{ width: 40, height: 40, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", cursor: "pointer", color: "#000", fontSize: 16, position: "relative" }}>
                🔔
                {unreadCount > 0 && (
                  <div style={{ position: "absolute", top: -2, right: -2, background: "#ef4444", color: "white", fontSize: 10, fontWeight: "bold", minWidth: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                    {unreadCount}
                  </div>
                )}
              </div>
              
              {notifDropdownOpen && (
                <div style={{ position: "absolute", right: 0, top: 48, width: 320, background: "white", borderRadius: 16, border: "2px solid #000", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 1000, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>Notifikasi</p>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{unreadCount} Baris Baru</span>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotifRead(n.id)}
                          style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: n.is_read ? "transparent" : "#f0f9ff", transition: "all 0.2s" }}
                        >
                          <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "#0f172a", fontWeight: n.is_read ? "normal" : "bold" }}>{n.message}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <p style={{ padding: 20, textAlign: "center", fontSize: 12, color: "#64748b", margin: 0 }}>Tidak ada notifikasi.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Avatar name={name} size="md" style={{ background: "#000", color: "white", fontWeight: "bold", cursor: "pointer", width: 40, height: 40 }} />
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>

          {activePage === "dashboard" && (
            <div>
              {/* STATS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "TOTAL PENGAJUAN", value: total },
                  { label: "TOTAL DITERIMA", value: approved },
                  { label: "TOTAL DITOLAK", value: rejected },
                  { label: "TOTAL PENDING", value: pending },
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                    <p style={{ fontSize: 12, fontWeight: "bold", color: "#000000", margin: "0 0 10px 0" }}>{stat.label}</p>
                    <p style={{ fontSize: 32, fontWeight: "bold", color: "#000000", margin: 0 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* RECENT LEAVES */}
              <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: "bold", color: "#000", margin: 0 }}>PENGAJUAN TERAKHIR</h3>
                  <Button disableRipple onPress={() => setCreateModalOpen(true)} style={{ background: "#000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, padding: "0 20px", height: 38 }}>
                    + AJUKAN CUTI
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", padding: "0 20px 10px", borderBottom: "2px solid #000", fontSize: 12, fontWeight: "bold", color: "#000" }}>
                    <div style={{ flex: 1 }}>PERIODE & ALASAN</div>
                    <div style={{ width: 100 }}>DURASI</div>
                    <div style={{ width: 150 }}>STATUS & AKSI</div>
                  </div>
                  {leaves.slice(0, 5).map((leave, i) => (
                    <div key={leave.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: mainBgColor, borderRadius: 14, border: "2px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "white", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          📅
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: "bold", color: "#000", margin: "0 0 4px 0" }}>{leave.start_date?.slice(0, 10)} &nbsp;—&nbsp; {leave.end_date?.slice(0, 10)}</p>
                          <p style={{ fontSize: 12, fontWeight: "bold", color: "#000", margin: 0 }}>ALASAN: {leave.reason.toUpperCase()}</p>
                        </div>
                      </div>
                      <div style={{ width: 100, fontSize: 13, fontWeight: "bold", color: "#000" }}>{leave.total_days} HARI</div>
                      <div style={{ width: 150, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: "bold", padding: "6px 12px", borderRadius: 16, background: statusBg[leave.status], border: "2px solid #000", color: "#000" }}>
                          {statusLabel[leave.status].toUpperCase()}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); openDetail(leave); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#f59e0b", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }} title="Detail">DETAIL</button>
                      </div>
                    </div>
                  ))}
                  {leaves.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <p style={{ color: "#000", fontSize: 13, fontWeight: "bold", margin: "0 0 16px 0", opacity: 0.6 }}>BELUM ADA PENGAJUAN CUTI</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePage === "leaves" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", fontSize: 13, background: "white", outline: "none" }}
                  >
                    <option value="">SEMUA BULAN</option>
                    {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                      <option key={m} value={(i + 1).toString()}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                  <select 
                    value={filterYear} 
                    onChange={(e) => setFilterYear(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", fontSize: 13, background: "white", outline: "none" }}
                  >
                    {[2023, 2024, 2025, 2026].map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
                <Button disableRipple onPress={() => setCreateModalOpen(true)} style={{ background: "#000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, padding: "0 20px", height: 38 }}>
                  + AJUKAN CUTI
                </Button>
              </div>
              {/* LIST */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", padding: "0 20px 10px", borderBottom: "2px solid #000", fontSize: 12, fontWeight: "bold", color: "#000" }}>
                  <div style={{ width: 40 }}>NO</div>
                  <div style={{ flex: 1 }}>KARYAWAN</div>
                  <div style={{ flex: 1 }}>ALASAN</div>
                  <div style={{ flex: 1 }}>PERIODE</div>
                  <div style={{ width: 150 }}>STATUS & AKSI</div>
                </div>
                {filteredLeaves.map((leave) => (
                    <div key={leave.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", background: mainBgColor, borderRadius: 14, border: "2px solid transparent", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ width: 40, fontSize: 13, fontWeight: "bold", color: "#000" }}>#{leave.id}</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={name} style={{ background: "white", border: "2px solid #000", color: "#000", fontWeight: "bold", width: 32, height: 32 }} />
                        <span style={{ fontSize: 13, fontWeight: "bold", color: "#000" }}>{name}</span>
                      </div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 16 }}>{leave.reason.toUpperCase()}</div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000" }}>{leave.start_date?.slice(0, 10)} &mdash; {leave.end_date?.slice(0, 10)}</div>
                      <div style={{ width: 150, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: "bold", padding: "6px 12px", borderRadius: 16, background: statusBg[leave.status], border: "2px solid #000", color: "#000" }}>
                          {statusLabel[leave.status].toUpperCase()}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); openDetail(leave); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#f59e0b", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }} title="Detail">DETAIL</button>
                      </div>
                    </div>
                ))}
                {leaves.length === 0 && <p style={{ textAlign: "center", color: "#000", fontWeight: "bold", fontSize: 13, padding: 32, margin: 0, opacity: 0.6 }}>BELUM ADA RIWAYAT CUTI</p>}
              </div>
            </div>
          )}

          {activePage === "info" && (
            <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "flex-start" }}>
              
              {/* KOLOM 1: SISA CUTI */}
              <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 20 }}>
                {balances && balances.length > 0 ? (
                  balances.map((b, i) => (
                    <div key={i} style={{ background: "white", borderRadius: 20, padding: 30, border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f59e0b", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: "bold" }}>🎟️</div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: "bold", color: "#64748b" }}>KUOTA TAHUN {b.year}</p>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: "#000" }}>Cuti Tahunan</h3>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
                        <span style={{ fontSize: 56, fontWeight: "bold", color: "#000", lineHeight: 1 }}>{b.remaining_days}</span>
                        <span style={{ fontSize: 16, fontWeight: "bold", color: "#64748b" }}>/ {b.total_days} HARI SISA</span>
                      </div>
                      
                      <div style={{ width: "100%", height: 12, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(b.used_days / b.total_days) * 100}%`, background: "#000", borderRadius: 10 }}></div>
                      </div>
                      <p style={{ margin: "10px 0 0 0", fontSize: 12, fontWeight: "bold", color: "#64748b", textAlign: "right" }}>Telah Digunakan: {b.used_days} Hari</p>
                    </div>
                  ))
                ) : (
                  <div style={{ background: "white", borderRadius: 20, padding: 30, border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: "bold", color: "#64748b" }}>Data Saldo Cuti Belum Tersedia.</p>
                  </div>
                )}
              </div>

              {/* KOLOM 2: JADWAL KEMBALI */}
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ background: "#d1e7f3ff", borderRadius: 20, padding: 30, border: "2px solid #000", boxShadow: "8px 8px 0 0 #000", position: "relative", overflow: "hidden" }}>
                  <p style={{ fontSize: 13, fontWeight: "bold", color: "#0f172a", margin: "0 0 10px 0", letterSpacing: 1 }}>JADWAL KEMBALI BEKERJA</p>
                  <h2 style={{ fontSize: 24, fontWeight: "900", color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                    {getReturnDate() === "-" ? "BELUM ADA JADWAL" : getReturnDate().toUpperCase()}
                  </h2>
                  <p style={{ fontSize: 12, fontWeight: "600", color: "rgba(15, 23, 42, 0.8)", margin: "16px 0 0 0", lineHeight: 1.5 }}>
                    Berdasarkan estimasi hari kerja berikutnya setelah tanggal berakhirnya cuti Anda.
                  </p>
                  <div style={{ position: "absolute", right: -20, bottom: -20, fontSize: 120, opacity: 0.1, pointerEvents: "none" }}>🗓️</div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODAL DETAIL PENGAJUAN */}
      {detailModalOpen && detailLeave && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, border: "3px solid #000", padding: "32px", width: 480, maxWidth: "100%", boxShadow: `8px 8px 0 0 ${sidebarColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: "bold", color: "#000", margin: 0 }}>DETAIL PENGAJUAN CUTI</h2>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#64748b", margin: "4px 0 0 0" }}>Tanggal Permohonan: {detailLeave.created_at?.slice(0, 10) || "-"}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 20, fontWeight: "bold", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ background: mainBgColor, borderRadius: 16, padding: "20px", marginBottom: 20, border: "2px solid #000" }}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", margin: "0 0 4px 0" }}>ALASAN CUTI</p>
                <p style={{ fontSize: 14, fontWeight: "bold", color: "#000", margin: 0 }}>{detailLeave.reason}</p>
              </div>
              <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", margin: "0 0 4px 0" }}>PERIODE CUTI</p>
                  <p style={{ fontSize: 14, fontWeight: "bold", color: "#000", margin: 0 }}>{detailLeave.start_date?.slice(0, 10)} — {detailLeave.end_date?.slice(0, 10)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", margin: "0 0 4px 0" }}>DURASI</p>
                  <p style={{ fontSize: 14, fontWeight: "bold", color: "#000", margin: 0 }}>{detailLeave.total_days} HARI</p>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", margin: "0 0 4px 0" }}>STATUS PERSETUJUAN</p>
                <span style={{ fontSize: 12, fontWeight: "bold", padding: "6px 16px", borderRadius: 16, background: statusBg[detailLeave.status], border: "2px solid #000", color: "#000", display: "inline-block", marginTop: 4 }}>
                  {statusLabel[detailLeave.status].toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ background: detailLeave.status === "rejected" ? "#fef2f2" : "#f8fafc", borderRadius: 16, padding: "20px", border: "2px solid #000" }}>
              <p style={{ fontSize: 11, fontWeight: "bold", color: detailLeave.status === "rejected" ? "#dc2626" : "#64748b", margin: "0 0 8px 0" }}>CATATAN DARI HRD</p>
              <p style={{ fontSize: 14, fontWeight: "bold", color: "#000", margin: 0, fontStyle: detailLeave.hrd_note ? "normal" : "italic", opacity: detailLeave.hrd_note ? 1 : 0.6 }}>
                {detailLeave.hrd_note || "Belum ada catatan."}
              </p>
            </div>

            <div style={{ marginTop: 24 }}>
              <Button disableRipple onPress={() => setDetailModalOpen(false)} style={{ width: "100%", background: "#000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, height: 44 }}>
                TUTUP
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUKAN CUTI BARU */}
      {createModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, border: "3px solid #000", padding: "32px", width: 500, maxWidth: "100%", boxShadow: `8px 8px 0 0 ${sidebarColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: "bold", color: "#000", margin: 0 }}>FORUM PENGAJUAN CUTI</h2>
              <button onClick={() => setCreateModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 20, fontWeight: "bold", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const payload = {
                leave_type_id: parseInt(fd.get("type")),
                start_date: fd.get("start"),
                end_date: fd.get("end"),
                reason: fd.get("reason"),
              };
              try {
                await leaveApi.createRequest(payload);
                setCreateModalOpen(false);
                fetchLeaves();
              } catch (err) {
                alert("Gagal mengirim pengajuan. Periksa sisa kuota atau tanggal.");
              }
            }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>JENIS CUTI</label>
                <select name="type" required style={{ width: "100%", padding: "12px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", outline: "none" }}>
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>TGL MULAI</label>
                  <input type="date" name="start" required style={{ width: "100%", padding: "12px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", outline: "none" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>TGL BERAKHIR</label>
                  <input type="date" name="end" required style={{ width: "100%", padding: "12px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", outline: "none" }} />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>ALASAN CUTI</label>
                <textarea name="reason" required placeholder="Tulis alasan lengkap..." style={{ width: "100%", padding: "12px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", outline: "none", minHeight: 100, resize: "none" }} />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <Button disableRipple onClick={() => setCreateModalOpen(false)} style={{ flex: 1, background: "white", border: "2px solid #000", color: "#000", fontWeight: "bold", borderRadius: 10, height: 48 }}>BATAL</Button>
                <Button type="submit" disableRipple style={{ flex: 1, background: sidebarColor, color: "white", fontWeight: "bold", borderRadius: 10, height: 48, border: "2px solid #000" }}>KIRIM PENGAJUAN</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}