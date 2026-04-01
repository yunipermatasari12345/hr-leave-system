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
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  
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
  
  const sisaCuti = balances?.reduce((acc, curr) => acc + curr.remaining_days, 0) || 0;
  const totalTerpakai = balances?.reduce((acc, curr) => acc + curr.used_days, 0) || 0;

  const statusBg = { pending: "#fef3c7", approved: "#dcfce7", rejected: "#fce7f3" };
  const statusColor = { pending: "#d97706", approved: "#166534", rejected: "#be185d" };
  const statusLabel = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

  const mainBgColor = "#f8fafc";
  const sidebarColor = "#ffffff";
  const primaryColor = "#0f172a";
  const elegantAccent = "#0d9488";

  const MenuItem = ({ id, label, icon }) => {
    const isActive = activePage === id;
    return (
      <div
        onClick={() => setActivePage(id)}
        style={{
          background: isActive ? "#f0fdfa" : "transparent",
          color: isActive ? elegantAccent : "#64748b",
          padding: "14px 20px",
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          borderLeft: isActive ? `4px solid ${elegantAccent}` : "4px solid transparent",
          display: "flex", alignItems: "center", gap: 14,
          cursor: "pointer",
          fontWeight: "600",
          transition: "all 0.2s",
          marginBottom: 4,
          marginRight: 20
        }}
        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = primaryColor; } }}
        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
        >
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

  const upcomingLeaves = leaves.filter(l => {
    if (l.status !== "approved" && l.status !== "disetujui" && l.status !== "pending") return false;
    const startDate = new Date(l.start_date);
    const now = new Date();
    now.setHours(0,0,0,0);
    return startDate >= now;
  }).sort((a,b) => new Date(a.start_date) - new Date(b.start_date));

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
      <div style={{ width: 260, background: sidebarColor, display: "flex", flexDirection: "column", flexShrink: 0, paddingTop: 32, borderRight: "1px solid #f1f5f9" }}>
        <div style={{ padding: "0 24px", marginBottom: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: elegantAccent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px -1px rgba(13,148,136,0.2)" }}>
            <span style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>A</span>
          </div>
          <h1 style={{ color: primaryColor, fontSize: 20, fontWeight: "800", margin: 0, letterSpacing: -0.5 }}>Appskep</h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 20 }}>
          <MenuItem id="dashboard" label="Dashboard" icon="❖" />
          <MenuItem id="leaves" label="Riwayat Cuti" icon="📄" />
          <MenuItem id="info" label="Informasi Cuti" icon="💡" />
        </div>

        {/* STATUS CUTI COLLAPSIBLE */}
        <div style={{ padding: "0 24px", marginTop: 24 }}>
          <div 
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            style={{ 
              background: "#f8fafc", 
              borderRadius: 16, 
              padding: "16px 20px", 
              border: "1px solid #f1f5f9", 
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <p style={{ fontSize: 12, fontWeight: "700", color: "#475569", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Status Cuti 2026</p>
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8", transform: isStatusOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>▼</span>
            </div>

            {isStatusOpen && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f0", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                    <p style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase" }}>Nama Karyawan</p>
                    <p style={{ fontSize: 13, fontWeight: "800", color: primaryColor, margin: 0 }}>{name}</p>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase" }}>Terpakai</p>
                    <p style={{ fontSize: 13, fontWeight: "800", color: primaryColor, margin: 0 }}>{totalTerpakai} <span style={{ fontSize: 10 }}>HARI</span></p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase" }}>Sisa Cuti</p>
                    <p style={{ fontSize: 13, fontWeight: "800", color: elegantAccent, margin: 0 }}>{sisaCuti} <span style={{ fontSize: 10 }}>HARI</span></p>
                  </div>
                </div>

                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${(totalTerpakai / (sisaCuti + totalTerpakai || 1)) * 100}%`, height: "100%", background: elegantAccent, borderRadius: 3 }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "700", color: primaryColor, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "500", color: "#64748b", margin: 0 }}>{pos.toUpperCase()} | {dept}</p>
            </div>
          </div>
          <Button disableRipple onPress={handleLogout} style={{ width: "100%", background: "transparent", border: "1px solid transparent", color: "#64748b", fontWeight: "600", fontSize: 13, padding: "16px 0", transition: "all 0.2s", justifyContent: "flex-start", paddingLeft: 8 }} onMouseEnter={(e) => { e.currentTarget.style.color=primaryColor; e.currentTarget.style.fontWeight="700" }} onMouseLeave={(e) => { e.currentTarget.style.color="#64748b"; e.currentTarget.style.fontWeight="600" }}>
            <span style={{ marginRight: 8 }}>🚪</span> Logout
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ padding: "32px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: "800", color: primaryColor, margin: "0 0 6px 0", letterSpacing: -0.5 }}>
              {activePage === "dashboard" ? "DASHBOARD" : (activePage === "leaves" ? "RIWAYAT CUTI" : "INFORMASI CUTI")}
            </h2>
            <p style={{ fontSize: 13, fontWeight: "600", color: "#64748b", margin: 0 }}>
              {activePage === "dashboard" ? `Selamat datang kembali, ${name}` : (activePage === "leaves" ? `${leaves.length} pengajuan ditemukan` : "Sisa kuota dan jadwal masuk")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: "600", color: "#64748b", background: "white", padding: "10px 16px", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              📅 &nbsp; {today}
            </div>
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{ width: 42, height: 42, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", cursor: "pointer", color: primaryColor, fontSize: 16, position: "relative", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}>
                🔔
                {unreadCount > 0 && (
                  <div style={{ position: "absolute", top: -2, right: -2, background: "#ef4444", color: "white", fontSize: 10, fontWeight: "bold", minWidth: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                    {unreadCount}
                  </div>
                )}
              </div>
              
              {notifDropdownOpen && (
                <div style={{ position: "absolute", right: 0, top: 48, width: 320, background: "white", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", zIndex: 1000, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontWeight: "700", fontSize: 14, color: primaryColor }}>Notifikasi</p>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: "600" }}>{unreadCount} Baru</span>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotifRead(n.id)}
                          style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: n.is_read ? "transparent" : "#f8fafc", transition: "all 0.2s" }}
                        >
                          <p style={{ margin: "0 0 6px 0", fontSize: 13, color: primaryColor, fontWeight: n.is_read ? "500" : "700" }}>{n.message}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <p style={{ padding: 30, textAlign: "center", fontSize: 13, color: "#94a3b8", margin: 0 }}>Tidak ada notifikasi.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>

          {activePage === "dashboard" && (
            <div>
              {/* STATS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
                {[
                  { label: "SISA CUTI", value: `${sisaCuti} Hari` },
                  { label: "TOTAL PENGAJUAN", value: total },
                  { label: "DISETUJUI", value: approved },
                  { label: "MENUNGGU", value: pending },
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: "white", borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 12, border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.2s" }}
                    onMouseEnter={(e)=>{e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 10px 15px -3px rgba(0,0,0,0.05)"}}
                    onMouseLeave={(e)=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 4px rgba(0,0,0,0.02)"}}
                  >
                    <p style={{ fontSize: 13, fontWeight: "700", color: "#64748b", margin: 0, textTransform: "uppercase" }}>{stat.label}</p>
                    <h3 style={{ fontSize: 28, fontWeight: "800", color: primaryColor, margin: 0 }}>{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* RECENT LEAVES */}
              <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: "800", color: primaryColor, margin: 0 }}>Pengajuan Terakhir</h3>
                  <Button disableRipple onPress={() => setCreateModalOpen(true)} style={{ background: elegantAccent, color: "white", fontWeight: "600", fontSize: 13, borderRadius: 10, padding: "0 20px", height: 38 }}>
                    + Ajukan Cuti Baru
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", padding: "0 20px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    <div style={{ flex: 1 }}>ALASAN CUTI</div>
                    <div style={{ width: 100 }}>DURASI</div>
                    <div style={{ width: 150 }}>STATUS</div>
                    <div style={{ width: 80, textAlign: "right" }}>AKSI</div>
                  </div>
                  {leaves.slice(0, 5).map((leave, i) => (
                    <div key={leave.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "white", borderBottom: "1px solid #f1f5f9", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
                    >
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: elegantAccent }}>
                          📄
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: "700", color: primaryColor, margin: "0 0 4px 0" }}>{leave.reason}</p>
                          <p style={{ fontSize: 12, fontWeight: "500", color: "#64748b", margin: 0 }}>{leave.start_date?.slice(0, 10)} &nbsp;—&nbsp; {leave.end_date?.slice(0, 10)}</p>
                        </div>
                      </div>
                      <div style={{ width: 100, fontSize: 13, fontWeight: "600", color: primaryColor }}>{leave.total_days} Hari</div>
                      <div style={{ width: 150, display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: "600", padding: "6px 16px", borderRadius: 20, background: statusBg[leave.status], color: statusColor[leave.status] }}>
                          {statusLabel[leave.status]}
                        </span>
                      </div>
                      <div style={{ width: 80, textAlign: "right" }}>
                        <button onClick={(e) => { e.stopPropagation(); openDetail(leave); }} style={{ height: 32, background: "transparent", color: elegantAccent, border: "none", cursor: "pointer", fontWeight: "600", fontSize: 13, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.textDecoration="underline"} onMouseLeave={(e)=>e.currentTarget.style.textDecoration="none"} title="Detail">Detail</button>
                      </div>
                    </div>
                  ))}
                  {leaves.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <p style={{ color: "#94a3b8", fontSize: 14, fontWeight: "600", margin: "0 0 16px 0" }}>Belum ada pengajuan cuti</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePage === "leaves" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: "600", fontSize: 13, background: "#f8fafc", color: primaryColor, outline: "none", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e)=>e.currentTarget.style.borderColor=primaryColor} onMouseLeave={(e)=>e.currentTarget.style.borderColor="#e2e8f0"}
                  >
                    <option value="">Semua Bulan</option>
                    {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                      <option key={m} value={(i + 1).toString()}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={filterYear} 
                    onChange={(e) => setFilterYear(e.target.value)}
                    style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: "600", fontSize: 13, background: "#f8fafc", color: primaryColor, outline: "none", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e)=>e.currentTarget.style.borderColor=primaryColor} onMouseLeave={(e)=>e.currentTarget.style.borderColor="#e2e8f0"}
                  >
                    {[2023, 2024, 2025, 2026].map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
                <Button disableRipple onPress={() => setCreateModalOpen(true)} style={{ background: elegantAccent, color: "white", fontWeight: "600", fontSize: 13, borderRadius: 10, padding: "0 20px", height: 40, boxShadow: "0 4px 6px -1px rgba(13,148,136,0.2)" }}>
                  + Ajukan Cuti Baru
                </Button>
              </div>
              
              {/* LIST */}
              <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", padding: "0 20px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    <div style={{ flex: 1 }}>ALASAN CUTI</div>
                    <div style={{ width: 100 }}>DURASI</div>
                    <div style={{ width: 150 }}>STATUS</div>
                    <div style={{ width: 80, textAlign: "right" }}>AKSI</div>
                  </div>
                  {filteredLeaves.map((leave, index) => (
                      <div key={leave.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "white", borderBottom: "1px solid #f1f5f9", transition: "all 0.2s", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
                      >
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: elegantAccent }}>
                            📄
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: "700", color: primaryColor, margin: "0 0 4px 0" }}>{leave.reason}</p>
                            <p style={{ fontSize: 12, fontWeight: "500", color: "#64748b", margin: 0 }}>{leave.start_date?.slice(0, 10)} &nbsp;—&nbsp; {leave.end_date?.slice(0, 10)}</p>
                          </div>
                        </div>
                        <div style={{ width: 100, fontSize: 13, fontWeight: "600", color: primaryColor }}>{leave.total_days} Hari</div>
                        <div style={{ width: 150, display: "flex", alignItems: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: "600", padding: "6px 16px", borderRadius: 20, background: statusBg[leave.status], color: statusColor[leave.status] }}>
                            {statusLabel[leave.status]}
                          </span>
                        </div>
                        <div style={{ width: 80, textAlign: "right" }}>
                           <button onClick={(e) => { e.stopPropagation(); openDetail(leave); }} style={{ height: 32, background: "transparent", color: elegantAccent, border: "none", cursor: "pointer", fontWeight: "600", fontSize: 13, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.textDecoration="underline"} onMouseLeave={(e)=>e.currentTarget.style.textDecoration="none"} title="Detail">Detail</button>
                        </div>
                      </div>
                  ))}
                  {filteredLeaves.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", fontWeight: "600", fontSize: 14, padding: "40px 0", margin: 0 }}>Tidak ada riwayat cuti</p>}
                </div>
              </div>
            </div>
          )}

          {activePage === "info" && (
            <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "flex-start" }}>
              
              {/* KOLOM 1: SISA CUTI */}
              <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 20 }}>
                {balances && balances.length > 0 ? (
                  balances.map((b, i) => (
                    <div key={i} style={{ background: "white", borderRadius: 20, padding: 30, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f8fafc", color: primaryColor, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: "bold" }}>🎟️</div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: "600", color: "#64748b" }}>KUOTA TAHUN {b.year}</p>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: "800", color: primaryColor }}>Cuti Tahunan</h3>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
                        <span style={{ fontSize: 56, fontWeight: "800", color: primaryColor, lineHeight: 1 }}>{b.remaining_days}</span>
                        <span style={{ fontSize: 16, fontWeight: "600", color: "#64748b" }}>/ {b.total_days} Hari Sisa</span>
                      </div>
                      
                      <div style={{ width: "100%", height: 10, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(b.used_days / b.total_days) * 100}%`, background: primaryColor, borderRadius: 10 }}></div>
                      </div>
                      <p style={{ margin: "12px 0 0 0", fontSize: 13, fontWeight: "600", color: "#64748b", textAlign: "right" }}>Telah Digunakan: <span style={{ color: primaryColor }}>{b.used_days} Hari</span></p>
                    </div>
                  ))
                ) : (
                  <div style={{ background: "white", borderRadius: 20, padding: 30, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: "600", color: "#64748b", textAlign: "center" }}>Data Saldo Cuti Belum Tersedia.</p>
                  </div>
                )}
              </div>

              {/* KOLOM 2: JADWAL KEMBALI */}
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ background: "white", borderRadius: 20, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
                  <p style={{ fontSize: 13, fontWeight: "700", color: "#64748b", margin: "0 0 12px 0", letterSpacing: 1, textTransform: "uppercase" }}>Jadwal Kembali Bekerja</p>
                  <h2 style={{ fontSize: 26, fontWeight: "800", color: primaryColor, margin: 0, lineHeight: 1.3 }}>
                    {getReturnDate() === "-" ? "BELUM ADA JADWAL" : getReturnDate()}
                  </h2>
                  <p style={{ fontSize: 13, fontWeight: "500", color: "#94a3b8", margin: "16px 0 0 0", lineHeight: 1.5 }}>
                    Berdasarkan estimasi hari kerja berikutnya setelah tanggal berakhirnya cuti Anda.
                  </p>
                  <div style={{ position: "absolute", right: -20, bottom: -20, fontSize: 140, opacity: 0.05, pointerEvents: "none", transform: "rotate(-10deg)" }}>🗓️</div>
                </div>

                {/* UPCOMING LEAVES */}
                <div style={{ background: "white", borderRadius: 20, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginTop: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: "700", color: "#64748b", margin: "0 0 20px 0", letterSpacing: 1, textTransform: "uppercase" }}>Rencana Cuti Mendatang</p>
                  
                  {upcomingLeaves.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {upcomingLeaves.map(l => (
                        <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", borderRadius: 16, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: "white", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: elegantAccent }}>
                            ✈️
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: "700", color: primaryColor }}>{l.start_date?.slice(0, 10)} &mdash; {l.end_date?.slice(0, 10)}</p>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: "500", color: "#64748b" }}>{l.reason} ({l.total_days} Hari)</p>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: "600", padding: "6px 16px", borderRadius: 20, background: statusBg[l.status], color: statusColor[l.status] }}>{statusLabel[l.status]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "30px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: "600", color: "#94a3b8" }}>Belum ada rencana pengajuan cuti mendatang.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODAL DETAIL PENGAJUAN */}
      {detailModalOpen && detailLeave && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 480, maxWidth: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: "800", color: primaryColor, margin: 0 }}>Detail Pengajuan</h2>
                <p style={{ fontSize: 13, fontWeight: "500", color: "#64748b", margin: "4px 0 0 0" }}>Tanggal Permohonan: {detailLeave.created_at?.slice(0, 10) || "-"}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: "#f1f5f9", border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, color: primaryColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#e2e8f0"} onMouseLeave={(e)=>e.currentTarget.style.background="#f1f5f9"}>✕</button>
            </div>

            <div style={{ background: mainBgColor, borderRadius: 16, padding: "20px", marginBottom: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Alasan Cuti</p>
                <p style={{ fontSize: 14, fontWeight: "600", color: primaryColor, margin: 0 }}>{detailLeave.reason}</p>
              </div>
              <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Periode Cuti</p>
                  <p style={{ fontSize: 14, fontWeight: "600", color: primaryColor, margin: 0 }}>{detailLeave.start_date?.slice(0, 10)} — {detailLeave.end_date?.slice(0, 10)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Durasi</p>
                  <p style={{ fontSize: 14, fontWeight: "600", color: primaryColor, margin: 0 }}>{detailLeave.total_days} Hari</p>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Status Persetujuan</p>
                <span style={{ fontSize: 12, fontWeight: "700", padding: "6px 16px", borderRadius: 20, background: statusBg[detailLeave.status], color: statusColor[detailLeave.status], display: "inline-block", marginTop: 4 }}>
                  {statusLabel[detailLeave.status]}
                </span>
              </div>
            </div>

            <div style={{ background: detailLeave.status === "rejected" ? "#fef2f2" : "#f8fafc", borderRadius: 16, padding: "20px", border: detailLeave.status === "rejected" ? "1px solid #fca5a5" : "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 11, fontWeight: "700", color: detailLeave.status === "rejected" ? "#dc2626" : "#64748b", margin: "0 0 8px 0", textTransform: "uppercase" }}>Catatan dari HRD</p>
              <p style={{ fontSize: 14, fontWeight: "600", color: detailLeave.status === "rejected" ? "#991b1b" : primaryColor, margin: 0, fontStyle: detailLeave.hrd_note ? "normal" : "italic", opacity: detailLeave.hrd_note ? 1 : 0.6 }}>
                {detailLeave.hrd_note || "Belum ada catatan."}
              </p>
            </div>

            <div style={{ marginTop: 32 }}>
              <Button disableRipple onPress={() => setDetailModalOpen(false)} style={{ width: "100%", background: "#f1f5f9", color: primaryColor, fontWeight: "700", fontSize: 13, borderRadius: 12, height: 44, border: "none" }}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUKAN CUTI BARU */}
      {createModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 500, maxWidth: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: "800", color: primaryColor, margin: 0 }}>Form Pengajuan Cuti</h2>
              <button onClick={() => setCreateModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 18, color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.color="#6b7280"} onMouseLeave={(e)=>e.currentTarget.style.color="#9ca3af"}>✕</button>
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
                alert("Gagal mengirim pengajuan. Periksa sisa kuota atau ketepatan tanggal.");
              }
            }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Jenis Cuti</label>
                <select name="type" required style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e7eb", fontWeight: "400", outline: "none", color: "#111827", background: "white", fontSize: 14 }}>
                  <option value="" disabled selected>Pilih jenis cuti</option>
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Tgl Mulai</label>
                  <input type="date" name="start" required style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e7eb", fontWeight: "400", outline: "none", color: "#111827", background: "white", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Tgl Berakhir</label>
                  <input type="date" name="end" required style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e7eb", fontWeight: "400", outline: "none", color: "#111827", background: "white", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Alasan Cuti</label>
                <textarea name="reason" required placeholder="Tuliskan alasan pengajuan Anda di sini..." style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e7eb", fontWeight: "400", outline: "none", color: "#111827", background: "white", minHeight: 120, resize: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Button disableRipple onClick={() => setCreateModalOpen(false)} style={{ background: "#f1f5f9", border: "none", color: "#475569", fontWeight: "600", borderRadius: 8, height: 42, padding: "0 24px" }}>Batal</Button>
                <Button type="submit" disableRipple style={{ background: elegantAccent, color: "white", fontWeight: "600", borderRadius: 8, height: 42, border: "none", padding: "0 24px" }}>Kirim Pengajuan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}