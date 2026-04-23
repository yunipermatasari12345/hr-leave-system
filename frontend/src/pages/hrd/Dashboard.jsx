import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from "react-router-dom";
import { Button, Divider } from "@heroui/react";
import * as XLSX from "xlsx";
import { exportLeavesWithImages } from "../../utils/excelExport";
import { leaveApi } from "../../api/leaveApi";
import { employeeApi } from "../../api/employeeApi";
import { reportingApi } from "../../api/reportingApi";
import { auditApi } from "../../api/auditApi";
import { STORAGE_KEYS } from "../../constants/storage";
import { API_BASE_URL } from "../../constants/config";

export default function HrdDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hrdNote, setHrdNote] = useState("");
  const [actionType, setActionType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" });
  const [manualFile, setManualFile] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");
  
  const DEPT_OPTIONS = ["Product", "Bisnis", "Kreatif"];
  const POS_OPTIONS = ["Coordinator of appsgizi", "Marketing", "Admin Officer", "Co Manager", "Manager"];

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", full_name: "", department: "", position: "", phone: "", role: "" });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailEmp, setDetailEmp] = useState(null);

  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const name = localStorage.getItem(STORAGE_KEYS.name) || "HRD Admin";

  // Lock scroll background saat ada modal terbuka
  useEffect(() => {
    const anyModalOpen = modalOpen || editModalOpen || detailModalOpen || previewOpen || manualModalOpen;
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen, editModalOpen, detailModalOpen, previewOpen, manualModalOpen]);

  const [stats, setStats] = useState({ total_employees: 0, pending_today: 0, total_approved: 0, total_rejected: 0, total_pending: 0 });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      if (activePage === "dashboard") fetchDashboardStats();
      fetchLeaves();
      fetchEmployees();
      if (activePage === "reports" || activePage === "master" || activePage === "leaves") {
        fetchMasterData();
      }
      if (activePage === "reports" || activePage === "master") {
        fetchReports();
      }
      // Selalu ambil data audit terbaru di balik layar
      fetchAuditLogs();
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [activePage, filterStatus, filterDept]);

  const fetchDashboardStats = async () => {
    try {
      const statsData = await reportingApi.dashboardStats();
      setStats(statsData || {});
      const monthData = await reportingApi.monthlyLeaveStats();
      setMonthlyStats(monthData || []);
    } catch {}
  };

  const fetchLeaves = async () => {
    try {
      const data = await leaveApi.getAdvancedForHR({ status: filterStatus, department: filterDept });
      setLeaves(data || []);
    } catch { setLeaves([]); }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeApi.listForHR();
      setEmployees(data || []);
    } catch { setEmployees([]); }
  };

  const fetchMasterData = async () => {
    try {
      const d = await reportingApi.departments();
      setDepartments(d || []);
      const p = await reportingApi.positions();
      setPositions(p || []);
      const lt = await leaveApi.getTypes();
      setLeaveTypes(lt || []);
    } catch {}
  };

  const fetchReports = async () => {
    try {
      const data = await reportingApi.leaveRecapPerDepartment();
      setReports(data || []);
    } catch {}
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await auditApi.getAuditLogs();
      setAuditLogs(data || []);
    } catch {}
  };

  const openAction = (leave, type) => {
    setSelected(leave); setActionType(type); setHrdNote(leave.hrd_note || ""); setModalOpen(true);
  };
  const handleAction = async () => {
    try {
      await leaveApi.updateStatusHR(selected.id, { status: actionType, hrd_note: hrdNote });
      setModalOpen(false); fetchLeaves(); fetchDashboardStats(); fetchEmployees();
    } catch { alert("Gagal update status"); }
  };

  const handleDeleteLeave = async (leave) => {
    const confirmMsg = leave.status === 'approved' 
      ? `Yakin ingin menghapus pengajuan dari ${leave.employee_name}? Saldo cuti (${leave.total_days} hari) akan DIKEMBALIKAN otomatis.`
      : `Yakin ingin menghapus pengajuan dari ${leave.employee_name}?`;

    if (!window.confirm(confirmMsg)) return;
    try {
      await leaveApi.deleteLeave(leave.id);
      fetchLeaves(); 
      fetchDashboardStats(); 
      fetchEmployees(); // Sinkronkan daftar karyawan agar saldo terbaru muncul
    } catch { alert("Gagal menghapus pengajuan cuti."); }
  };

  const openPreview = (leave) => {
    setSelected(leave);
    setPreviewOpen(true);
  };
  
  const handleDeleteEmployee = async (id, empName) => {
    if (window.confirm(`Yakin ingin menghapus karyawan ${empName}? Data pengajuan cutinya juga mungkin terhapus atau menjadi yatim.`)) {
      try {
        await employeeApi.deleteForHR(id);
        fetchEmployees(); fetchDashboardStats();
      } catch (err) { alert("Gagal menghapus karyawan."); }
    }
  };

  const openEdit = (emp) => {
    setEditForm({ id: emp.id, full_name: emp.full_name, department: emp.department, position: emp.position, phone: emp.phone || "", role: emp.role || "employee" });
    setEditModalOpen(true);
  };

  const openDetail = (emp) => {
    setDetailEmp(emp);
    setDetailModalOpen(true);
  };

  const handleEdit = async () => {
    try {
      await employeeApi.updateForHR(editForm.id, editForm);
      setEditModalOpen(false); fetchEmployees();
    } catch { alert("Gagal update karyawan"); }
  };

  const handleManualSubmit = async () => {
    if (!manualForm.employee_id || !manualForm.leave_type_id || !manualForm.start_date || !manualForm.end_date || !manualForm.reason) {
      setManualError("Semua field wajib diisi!"); return;
    }
    setManualLoading(true); setManualError("");
    try {
      const formData = new FormData();
      Object.keys(manualForm).forEach(k => formData.append(k, manualForm[k]));
      if (manualFile) formData.append("attachment", manualFile);
      await leaveApi.createManualLeaveHR(formData);
      setManualModalOpen(false);
      setManualForm({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" });
      setManualFile(null);
      fetchLeaves();
      fetchDashboardStats();
      fetchEmployees();
    } catch (e) {
      setManualError(e.response?.data?.error || "Gagal memasukkan cuti manual");
    } finally {
      setManualLoading(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const exportLeavesToExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportLeavesWithImages(leaves, API_BASE_URL);
    } catch (err) {
      console.error(err);
      alert("Gagal mengekspor data dengan gambar. Pastikan koneksi internet stabil.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportReportsToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reports.map(r => ({
      Departemen: r.department.toUpperCase(), "Total Pengajuan Disetujui": r.total_leaves, "Total Hari Cuti": r.total_days
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Rekap Laporan");
    XLSX.writeFile(wb, "Laporan_Rekap_Departemen.xlsx");
  };

  const pending = leaves.filter(l => l.status === "pending");
  const approved = leaves.filter(l => l.status === "approved" || l.status === "disetujui");
  const rejected = leaves.filter(l => l.status === "rejected");
  const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const activeTabStyle = { bg: "#eff6ff", text: "#1d4ed8" };
  
  const savedTheme = localStorage.getItem("hr_theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [isDarkMode, setIsDarkMode] = useState(savedTheme ? savedTheme === "dark" : systemDark);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("hr_theme", next ? "dark" : "light");
  };

  const mode = isDarkMode ? "dark" : "light";
  const T = { 
    bg: mode === "dark" ? "#0f172a" : "#f8fafc", 
    sidebar: mode === "dark" ? "#1e293b" : "white", 
    cardBg: mode === "dark" ? "#1e293b" : "white",
    cardBorder: mode === "dark" ? "1px solid #334155" : "1px solid #e5e7eb", 
    textDark: mode === "dark" ? "#f8fafc" : "#1f2937", 
    textGray: mode === "dark" ? "#94a3b8" : "#64748b", 
    textLight: mode === "dark" ? "#475569" : "#94a3b8", 
    primary: "#2563eb", 
    red: "#ef4444", 
    green: "#10b981", 
    yellow: mode === "dark" ? "#d97706" : "#f59e0b",
    highlightBg: mode === "dark" ? "#1e3a8a" : "#eff6ff"
  };

  const statusStyle = { pending: { bg: "#fef3c7", color: "#d97706", label: "Menunggu" }, approved: { bg: "#dcfce7", color: "#166534", label: "Disetujui" }, rejected: { bg: "#fee2e2", color: "#991b1b", label: "Ditolak" } };

  const MenuItem = ({ id, label, icon, onClick }) => (
    <div onClick={() => onClick ? onClick() : setActivePage(id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: activePage === id ? activeTabStyle.bg : "transparent", color: activePage === id ? activeTabStyle.text : T.textGray, fontWeight: activePage === id ? "600" : "500", fontSize: 14, transition: "background 0.2s", marginBottom: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR KLASIK */}
      <div style={{ width: 260, background: T.sidebar, borderRight: T.cardBorder, display: "flex", flexDirection: "column", flexShrink: 0, paddingTop: 32 }}>
        <div style={{ padding: "0 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 1 }}>
          <img src="/logo.png" alt="Logo" style={{ height: 80, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display='none'; }} />
          <h1 style={{ color: "#03070cff", fontSize: 28, fontWeight: "900", margin: 0, letterSpacing: -0.3 }}>appskep</h1>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
          <MenuItem id="dashboard" label="Dashboard" icon="❖" />
          <MenuItem id="leaves" label="Pengajuan Cuti" icon="📑" />
          <MenuItem id="calendar" label="Kalender Cuti" icon="📅" />
          <MenuItem id="employees" label="Data Karyawan" icon="👥" />
          <MenuItem id="reports" label="Laporan Ekspor" icon="📊" />
          <MenuItem id="audit" label="Audit Trail" icon="🛡️" />
        </div>

        {/* RINGKASAN PERUSAHAAN (Optional) */}
        <div style={{ padding: "0 20px", marginTop: 24 }}>
          <div onClick={() => setIsStatusOpen(!isStatusOpen)} style={{ background: T.bg, borderRadius: 12, padding: "16px 20px", border: T.cardBorder, cursor: "pointer", transition: "all 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🏢</span>
                <p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Ringkasan Data</p>
              </div>
              <span style={{ fontSize: 12, color: T.textLight, transform: isStatusOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>▼</span>
            </div>
            {isStatusOpen && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: T.textDark }}><span>Karyawan</span> <b>{employees.length} Orang</b></div>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: T.textDark }}><span>Dep. Aktif</span> <b>{reports.length} Depart.</b></div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: T.cardBorder }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold" }}>HR</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "500", color: T.textGray, margin: 0 }}>Administrator HRD</p>
            </div>
          </div>
          <Button disableRipple onPress={handleLogout} style={{ width: "100%", background: "transparent", border: "none", color: T.textGray, fontWeight: "600", fontSize: 13, justifyContent: "flex-start", padding: 0 }} onMouseEnter={(e)=>e.currentTarget.style.color=T.red} onMouseLeave={(e)=>e.currentTarget.style.color=T.textGray}>
            <span style={{ marginRight: 8, fontSize: 16 }}>🚪</span> Keluar
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT KLASIK (Layout Kanan) */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        
        {/* HEADER KLASIK */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
           <div>
             <h2 style={{ fontSize: 24, fontWeight: "700", color: T.textDark, margin: "0 0 8px 0" }}>Halo HRD, {name.split(' ')[0]}!</h2>
             <p style={{ fontSize: 13, color: T.textGray, margin: 0 }}>📅 &nbsp; {todayStr}</p>
           </div>
           
           <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
             {/* THEME TOGGLE BUTTON */}
             <button onClick={toggleTheme} style={{ background: T.cardBg, border: T.cardBorder, padding: "8px 16px", borderRadius: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: T.textDark, fontWeight: "600", fontSize: 13, boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
               <span style={{ fontSize: 16 }}>{isDarkMode ? "☀️" : "🌙"}</span>
               {isDarkMode ? "Mode Terang" : "Mode Gelap"}
             </button>

             {/* ADD EMPLOYEE BUTTON */}
             {activePage === "dashboard" && (
                <Button disableRipple onPress={() => navigate("/hrd/employees/add")} style={{ background: T.primary, color: "white", fontWeight: "600", borderRadius: 8, height: 40, padding: "0 20px" }}>
                  + Tambahkan Karyawan Baru
                </Button>
             )}
           </div>
        </div>

        {activePage === "dashboard" && (
          <>
            {/* STATS KOTAK 4 KLASIK DENGAN DESAIN TALENTA */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 40 }}>
              <div style={{ background: T.cardBg, padding: 24, borderRadius: 12, border: T.cardBorder, transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                   onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)"; }}
                   onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; }}>
                 <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 12px 0", textTransform: "uppercase" }}>Menunggu Persetujuan</p>
                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <p style={{ fontSize: 32, fontWeight: "700", color: T.textDark, margin: 0 }}>{pending.length}</p>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⏳</div>
                 </div>
              </div>
              <div style={{ background: T.cardBg, padding: 24, borderRadius: 12, border: T.cardBorder, transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                   onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)"; }}
                   onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; }}>
                 <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 12px 0", textTransform: "uppercase" }}>Disetujui</p>
                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <p style={{ fontSize: 32, fontWeight: "700", color: T.textDark, margin: 0 }}>{approved.length}</p>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✓</div>
                 </div>
              </div>
              <div style={{ background: T.cardBg, padding: 24, borderRadius: 12, border: T.cardBorder, transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                   onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)"; }}
                   onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; }}>
                 <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 12px 0", textTransform: "uppercase" }}>Ditolak</p>
                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <p style={{ fontSize: 32, fontWeight: "700", color: T.textDark, margin: 0 }}>{rejected.length}</p>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✕</div>
                 </div>
              </div>
              <div style={{ background: T.cardBg, padding: 24, borderRadius: 12, border: T.cardBorder, transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                   onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)"; }}
                   onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; }}>
                 <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 12px 0", textTransform: "uppercase" }}>Total Karyawan</p>
                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <p style={{ fontSize: 32, fontWeight: "700", color: T.textDark, margin: 0 }}>{employees.length}</p>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👥</div>
                 </div>
              </div>
            </div>

            {/* INSIGHTS & ANALYTICS SECTION */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 40 }}>
              {/* ANTREAN CUTI TERBARU */}
              <div style={{ background: T.cardBg, borderRadius: 16, border: T.cardBorder, padding: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: "700", color: T.textDark }}>Antrean Cuti Terbaru ⏳</h3>
                  {pending.length > 0 && <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "700" }}>{pending.length} Menunggu</span>}
                </div>
                
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, maxHeight: 310, paddingRight: 4 }}>
                  {pending.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: T.textGray, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                       <span style={{ fontSize: 32, marginBottom: 8 }}>🎉</span>
                       <span style={{ fontWeight: "600", color: T.textDark }}>Semua antrean beres!</span>
                       <span>Tidak ada pengajuan cuti saat ini.</span>
                    </div>
                  ) : pending.map((l, idx) => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: T.cardBorder, borderRadius: 12, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "700", flexShrink: 0 }}>
                          {l.employee_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: "700", color: T.textDark }}>{l.employee_name} <span style={{ color: T.textLight, fontWeight: "normal" }}>— {l.leave_type_name || "Cuti"}</span></p>
                          <p style={{ margin: "2px 0 0 0", fontSize: 12, color: T.textGray }}>{l.start_date?.slice(0,10)} sd {l.end_date?.slice(0,10)} <span style={{ color: "#92400e", fontWeight: "600", background: "#fef3c7", padding: "2px 6px", borderRadius: 6, marginLeft: 4 }}>{l.total_days} Hari</span></p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openAction(l, "detail")} title="Lihat Detail" style={{ width: 34, height: 34, borderRadius: 8, background: "#f1f5f9", color: T.textDark, border: "none", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.1s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>👁️</button>
                          <button onClick={() => openAction(l, "approved")} title="Setujui" style={{ width: 34, height: 34, borderRadius: 8, background: "#10b981", color: "white", border: "none", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.1s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>✓</button>
                          <button onClick={() => openAction(l, "rejected")} title="Tolak" style={{ width: 34, height: 34, borderRadius: 8, background: T.red, color: "white", border: "none", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.1s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>✕</button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
              {/* WHO IS OFF TODAY */}
              <div style={{ background: T.cardBg, borderRadius: 16, border: T.cardBorder, padding: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: "700", color: T.textDark }}>Sedang Cuti Hari Ini 🏖️</h3>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                  {(() => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const offToday = approved.filter(l => {
                       const st = new Date(l.start_date); st.setHours(0,0,0,0);
                       const en = new Date(l.end_date); en.setHours(23,59,59,999);
                       return today >= st && today <= en;
                    });
                    if(offToday.length === 0) return <div style={{ textAlign: "center", padding: "40px 0", color: T.textGray, fontSize: 13 }}>Tidak ada yang cuti hari ini.</div>;
                    return offToday.map(l => (
                      <div key={'off'+l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", background: T.bg, borderRadius: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "700", flexShrink: 0 }}>
                          {l.employee_name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: "700", color: T.textDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.employee_name}</p>
                          <p style={{ margin: "2px 0 0 0", fontSize: 12, color: T.textGray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.leave_type_name} (Sisa {Math.ceil((new Date(l.end_date) - today) / (1000 * 60 * 60 * 24)) + 1} hr)</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>


          </>
        )}

        {activePage === "leaves" && (
           <div style={{ background: T.cardBg, borderRadius: 12, border: T.cardBorder }}>
             <div style={{ padding: "20px 24px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <h3 style={{ margin: 0, fontSize: 18, fontWeight: "700", color: T.textDark }}>Semua Pengajuan Cuti</h3>
               <div style={{ display: "flex", gap: 12 }}>
                 <Button disableRipple size="sm" onPress={() => setManualModalOpen(true)} style={{ background: T.primary, color: "white", fontWeight: "700", height: 38, padding: "0 16px", borderRadius: 10 }}>
                   + Input Cuti Manual
                 </Button>
                 <Button disableRipple size="sm" onClick={exportLeavesToExcel} isDisabled={isExporting} style={{ background: isExporting ? T.bg : "white", border: T.cardBorder, color: T.textDark, fontWeight: "700", display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", borderRadius: 10 }}>
                   {isExporting ? "⏳ Sedang Memproses..." : "📊 Ekspor ke Excel"}
                 </Button>
               </div>
             </div>
             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
               <thead>
                 <tr>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Karyawan</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Jadwal Cuti</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Lampiran</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Status</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Aksi</th>
                 </tr>
               </thead>
               <tbody>
                 {leaves.map(l => (
                   <tr key={l.id} style={{ borderBottom: T.cardBorder }}>
                     <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "500" }}>{l.employee_name}<br/><span style={{fontSize: 11, color: T.textLight}}>{l.employee_department}</span></td>
                     <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray }}>{l.start_date.slice(0,10)} sd {l.end_date.slice(0,10)} <br/><span style={{fontSize: 11, color: T.textLight}}>({l.total_days} Hari)</span></td>
                     <td style={{ padding: "16px 24px", textAlign: "center" }}>
                       {l.attachment_url ? (
                         <button onClick={() => openPreview(l)}
                           style={{ color: T.primary, fontSize: 12, fontWeight: "600", textDecoration: "none", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}>
                           📎 Lihat
                         </button>
                       ) : <span style={{ fontSize: 11, color: T.textLight }}>-</span>}
                     </td>
                     <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <span style={{ display: "inline-block", background: statusStyle[l.status]?.bg || "#f3f4f6", color: statusStyle[l.status]?.color || "#374151", padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
                          {statusStyle[l.status]?.label || l.status}
                        </span>
                     </td>
                     <td style={{ padding: "16px 24px", display: "flex", gap: 8, justifyContent: "center" }}>
                        <button onClick={() => openAction(l, "detail")} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12 }}>Detail</button>
                        {l.status === 'pending' && (
                          <>
                            <button onClick={() => openAction(l, "approved")} style={{ width: 32, height: 32, borderRadius: 6, background: T.textDark, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✓</button>
                            <button onClick={() => openAction(l, "rejected")} style={{ width: 32, height: 32, borderRadius: 6, background: T.red, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✕</button>
                          </>
                        )}
                        <button onClick={() => handleDeleteLeave(l)} style={{ width: 32, height: 32, borderRadius: 6, background: "#fff1f2", color: T.red, border: `1px solid #fecdd3`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title="Hapus pengajuan">🗑️</button>
                     </td>
                   </tr>
                 ))}
                 {leaves.length === 0 && <tr><td colSpan="4" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray }}>Belum ada data.</td></tr>}
               </tbody>
             </table>
           </div>
        )}

        {activePage === "calendar" && (
           <div style={{ background: T.cardBg, borderRadius: 16, border: T.cardBorder, minHeight: 600, display: "flex", flexDirection: "column", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
             <div style={{ padding: "24px 32px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: "800", color: T.textDark }}>Kalender Cuti Perusahaan</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: 14, color: T.textGray }}>Visualisasi jadwal karyawan yang sedang libur / cuti</p>
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                 <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))} style={{ width: 40, height: 40, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", fontWeight: "bold" }}>←</button>
                 <span style={{ fontSize: 16, fontWeight: "700", width: 140, textAlign: "center" }}>
                   {currentMonthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                 </span>
                 <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))} style={{ width: 40, height: 40, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", fontWeight: "bold" }}>→</button>
                 <button onClick={() => setCurrentMonthDate(new Date())} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: "none", background: T.bg, color: T.textDark, cursor: "pointer", fontWeight: "600", fontSize: 13 }}>Hari Ini</button>
               </div>
             </div>
             
             <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, marginBottom: 12 }}>
                  {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: "700", color: T.textGray, textTransform: "uppercase" }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, flex: 1 }}>
                  {(() => {
                    const year = currentMonthDate.getFullYear();
                    const month = currentMonthDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    
                    const cells = [];
                    for(let i=0; i<firstDay; i++) cells.push(<div key={`empty-${i}`} style={{ background: T.bg, borderRadius: 12, opacity: 0.5 }}></div>);
                    
                    for(let day=1; day<=daysInMonth; day++) {
                      const dateObj = new Date(year, month, day);
                      dateObj.setHours(0,0,0,0);
                      
                      const isToday = new Date().setHours(0,0,0,0) === dateObj.getTime();
                      
                      // Filter cuti approved yang ngelewatin tanggal ini
                      const drops = approved.filter(l => {
                         const st = new Date(l.start_date); st.setHours(0,0,0,0);
                         const en = new Date(l.end_date); en.setHours(23,59,59,999);
                         return dateObj >= st && dateObj <= en;
                      });
                      
                      cells.push(
                        <div key={day} style={{ borderRadius: 12, minHeight: 120, padding: "8px", background: isToday ? "#eff6ff" : "white", border: isToday ? `2px solid ${T.primary}` : T.cardBorder, display: "flex", flexDirection: "column", gap: 4, transition: "transform 0.1s", cursor: "pointer" }}
                             onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                             onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                          <div style={{ fontSize: 14, fontWeight: isToday ? "800" : "600", color: isToday ? T.primary : T.textDark, textAlign: "right", marginBottom: 4 }}>
                            {day}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 }}>
                            {drops.slice(0, 3).map(l => (
                              <div key={'drop'+l.id} title={`${l.employee_name} - ${l.leave_type_name}`} style={{ background: "#dbeafe", color: "#1e40af", fontSize: 10, fontWeight: "600", padding: "4px 6px", borderRadius: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "default" }}>
                                {l.employee_name.split(' ')[0]} ({l.leave_type_name.substring(0,3)})
                              </div>
                            ))}
                            {drops.length > 3 && (
                              <div style={{ fontSize: 10, fontWeight: "700", color: T.textGray, textAlign: "center", marginTop: "auto" }}>+{drops.length - 3} lainnya</div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
             </div>
           </div>
        )}

        {activePage === "employees" && (
           <div style={{ background: T.cardBg, borderRadius: 12, border: T.cardBorder }}>
             <div style={{ padding: "20px 24px", borderBottom: T.cardBorder }}>
               <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Data Karyawan Aktif</h3>
             </div>
             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
               <thead>
                 <tr>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Nama & Informasi</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Jabatan Sistem</th><th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Penggunaan Cuti</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Aksi</th>
                 </tr>
               </thead>
               <tbody>
                 {employees.map(emp => (
                   <tr key={emp.id} style={{ borderBottom: T.cardBorder }}>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "500" }}>{emp.full_name}<br/><span style={{fontSize: 11, color: T.textGray}}>{emp.department} · {emp.position}</span><br/><span style={{fontSize: 10, color: T.textLight}}>{emp.email}</span></td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <span style={{ display: "inline-block", background: emp.role === "hrd" ? "#e0e7ff" : "#f1f5f9", color: emp.role === "hrd" ? "#4338ca" : "#64748b", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                            {emp.role === "hrd" ? "Staff HRD" : "Karyawan"}
                          </span>
                       </td>
                       <td style={{ padding: "16px 24px", textAlign: "center" }}>
                         <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                           <span style={{ fontSize: 13, color: T.red, fontWeight: "700" }}>{emp.used_days} Terpakai</span>
                           <span style={{ fontSize: 11, color: T.textDark, fontWeight: "600" }}>{emp.remaining_days} Tersisa</span>
                         </div>
                       </td>

                      <td style={{ padding: "16px 24px", display: "flex", gap: 8, justifyContent: "center" }}>
                         <button onClick={(e) => { e.stopPropagation(); openDetail(emp); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12 }}>Detail</button>
                         <button onClick={(e) => { e.stopPropagation(); openEdit(emp); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.textDark, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12 }}>Edit</button>
                         <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id, emp.full_name); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.red, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>🗑️</button>
                      </td>
                   </tr>
                 ))}
                 {employees.length === 0 && <tr><td colSpan="4" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray }}>Tidak ada karyawan.</td></tr>}
               </tbody>
             </table>
           </div>
        )}

        {activePage === "reports" && (
           <div style={{ background: T.cardBg, borderRadius: 12, border: T.cardBorder }}>
             <div style={{ padding: "20px 24px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Analisis Rekapitulasi</h3>
               <Button size="sm" onClick={exportReportsToExcel} style={{ background: T.cardBg, border: T.cardBorder, color: T.textDark, fontWeight: "600", borderRadius: 6 }}>Export (XLSX)</Button>
             </div>
             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
               <thead>
                 <tr>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Departemen</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Total Pengajuan ACC</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Total Durasi Cuti</th>
                 </tr>
               </thead>
               <tbody>
                 {reports.map((r, i) => (
                   <tr key={i} style={{ borderBottom: T.cardBorder }}>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: T.textDark, fontWeight: "600" }}>{r.department}</td>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray, textAlign: "center" }}>{r.total_leaves} Transaksi</td>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: T.primary, fontWeight: "600", textAlign: "center" }}>{r.total_days} Hari</td>
                   </tr>
                 ))}
                 {reports.length === 0 && <tr><td colSpan="3" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray }}>Tidak ada data.</td></tr>}
               </tbody>
             </table>
           </div>
        )}

        {activePage === "audit" && (
           <div style={{ background: T.cardBg, borderRadius: 12, border: T.cardBorder }}>
             <div style={{ padding: "20px 24px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                 <h3 style={{ margin: 0, fontSize: 18, fontWeight: "700", color: T.textDark }}>Sistem Audit Trail</h3>
                 <p style={{ margin: "4px 0 0 0", fontSize: 13, color: T.textGray }}>Memantau riwayat aktivitas semua pengguna di dalam sistem</p>
               </div>
               <Button disableRipple size="sm" onClick={fetchAuditLogs} style={{ background: T.bg, border: T.cardBorder, color: T.textDark, fontWeight: "600", borderRadius: 8, height: 38 }}>🔄 Segarkan</Button>
             </div>
             <div style={{ overflowX: "auto" }}>
               <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                 <thead>
                   <tr>
                     <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Waktu</th>
                     <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Pengguna</th>
                     <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Aksi</th>
                     <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Path API</th>
                     <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>IP Address</th>
                   </tr>
                 </thead>
                 <tbody>
                   {auditLogs.map((log, idx) => (
                     <tr key={idx} style={{ borderBottom: T.cardBorder, transition: "background 0.1s" }}
                         onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                         onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                     >
                        <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark }}>
                          {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "600" }}>{log.full_name}<br/><span style={{fontSize: 11, color: T.textGray, fontWeight: "normal"}}>{log.email}</span></td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <span style={{ 
                            display: "inline-block", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: "700",
                            background: log.action === "GET" ? "#e0f2fe" : log.action === "POST" ? "#dcfce7" : log.action === "PUT" ? "#fef3c7" : log.action === "DELETE" ? "#fee2e2" : "#f1f5f9",
                            color: log.action === "GET" ? "#0284c7" : log.action === "POST" ? "#16a34a" : log.action === "PUT" ? "#d97706" : log.action === "DELETE" ? "#dc2626" : "#475569"
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray, fontFamily: "monospace" }}>{log.path}</td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray }}>{log.ip_address || "-"}</td>
                     </tr>
                   ))}
                   {auditLogs.length === 0 && <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", fontSize: 14, color: T.textGray }}>Belum ada rekaman audit.</td></tr>}
                 </tbody>
               </table>
             </div>
           </div>
        )}

      </div>

      {/* MODALS */}
      {modalOpen && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: T.cardBg, borderRadius: 24, width: 460, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.06)" }}>
             {/* Header — tetap di atas */}
             <div style={{ padding: "24px 32px 20px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0 }}>
                   {actionType === "approved" ? "Setujui Pengajuan" : actionType === "rejected" ? "Tolak Pengajuan" : "Detail Pengajuan"}
                 </h2>
                 <button onClick={() => setModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, cursor: "pointer" }}>✕</button>
               </div>
             </div>
             {/* Konten — bisa di-scroll */}
             <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
               <div style={{ background: T.bg, borderRadius: 16, padding: "20px", marginBottom: 24 }}>
                 <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 16, fontWeight: "800", color: T.textDark, margin: "0 0 4px 0" }}>{selected.employee_name}</p>
                    <p style={{ fontSize: 13, fontWeight: "500", color: T.textGray, margin: 0 }}>{selected.employee_department || "-"}</p>
                 </div>
                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Tipe Cuti</p><p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: 0 }}>{selected.leave_type_name || "Cuti"}</p></div>
                    <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Durasi</p><p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: 0 }}>{selected.total_days} Hari</p></div>
                    <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Periode</p><p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: 0 }}>{selected.start_date?.slice(0, 10)} sd {selected.end_date?.slice(0, 10)}</p></div>
                    <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Status</p><p style={{ fontSize: 13, fontWeight: "600", color: selected.status === "approved" ? T.green : selected.status === "rejected" ? T.red : T.yellow, margin: 0, textTransform: "uppercase" }}>{selected.status}</p></div>
                 </div>
                 <div style={{ marginTop: 16, paddingTop: 16, borderTop: T.cardBorder }}>
                    <p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Alasan Cuti</p>
                    <p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: 0, lineHeight: 1.5 }}>{selected.reason || "-"}</p>
                 </div>
                 {selected.attachment_url && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: T.cardBorder }}>
                      <p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Lampiran Pendukung</p>
                      {selected.attachment_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <div style={{ borderRadius: 12, overflow: "hidden", border: T.cardBorder, background: T.cardBg, padding: 4 }}>
                          <img
                            src={`${API_BASE_URL}${selected.attachment_url}`}
                            alt="Lampiran"
                            style={{ width: "100%", maxHeight: 280, objectFit: "contain", cursor: "zoom-in" }}
                            onClick={() => window.open(`${API_BASE_URL}${selected.attachment_url}`, '_blank')}
                          />
                        </div>
                      ) : (
                        <a href={`${API_BASE_URL}${selected.attachment_url}`} target="_blank" rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px", background: T.cardBg, borderRadius: 12, border: T.cardBorder, color: T.primary, textDecoration: "none", fontSize: 13, fontWeight: "600" }}>
                          📄 Lihat Dokumen Pendukung
                        </a>
                      )}
                    </div>
                 )}
               </div>
               {actionType !== "detail" && (
                 <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: "700", color: T.textGray, marginBottom: 8, textTransform: "uppercase" }}>Catatan Tambahan</label>
                    <textarea placeholder="Opsional" value={hrdNote} onChange={(e) => setHrdNote(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, minHeight: 80, resize: "none", boxSizing: "border-box" }} />
                 </div>
               )}
             </div>
             {/* Footer — tetap di bawah */}
             <div style={{ padding: "20px 32px 24px", borderTop: "1px solid #e5e7eb", flexShrink: 0, display: "flex", gap: 12 }}>
               {actionType !== "detail" ? (
                 <>
                    <Button disableRipple variant="bordered" onPress={() => setModalOpen(false)} style={{ fontSize: 13, fontWeight: "700", borderRadius: 12, border: T.cardBorder, color: T.textGray, height: 44, flex: 1 }}>Batal</Button>
                    <Button disableRipple onPress={handleAction} style={{ background: actionType === "approved" ? T.green : T.red, fontWeight: "700", fontSize: 13, color: "white", borderRadius: 12, height: 44, flex: 1 }}>{actionType === "approved" ? "Setujui!" : "Tolak"}</Button>
                 </>
               ) : (
                 <Button disableRipple onPress={() => setModalOpen(false)} style={{ flex: 1, background: T.bg, color: T.textDark, fontWeight: "700", fontSize: 13, borderRadius: 12, height: 44 }}>Tutup</Button>
               )}
             </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: T.cardBg, borderRadius: 24, padding: "32px", width: 440, maxWidth: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0 }}>Edit Karyawan</h2>
              <button onClick={() => setEditModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, cursor: "pointer"}}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div><p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Nama Lengkap</p><input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg }} /></div>
              <div><p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Departemen</p><input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} list="dept-list" style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg }} /></div>
              <div><p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Posisi / Jabatan</p><input value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} list="pos-list" style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg }} /></div>
              <div>
                <p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Jabatan Sistem (Role)</p>
                <select 
                  value={editForm.role} 
                  onChange={e => setEditForm({...editForm, role: e.target.value})} 
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, cursor: "pointer" }}
                >
                  <option value="employee">Karyawan (Akses Biasa)</option>
                  <option value="hrd">Staff HRD (Akses Dashboard HRD)</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 32 }}>
              <Button disableRipple onClick={() => setEditModalOpen(false)} style={{ flex: 1, background: T.cardBg, border: T.cardBorder, color: T.textGray, height: 48, borderRadius: 12, fontWeight: "600" }}>Batal</Button>
              <Button disableRipple onPress={handleEdit} style={{ flex: 1, background: T.primary, color: "white", height: 48, borderRadius: 12, fontWeight: "600" }}>Simpan Data</Button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && detailEmp && (
         <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
           <div style={{ background: T.cardBg, borderRadius: 24, padding: "32px", width: 640, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0 }}>Profil Karyawan</h2>
                <button onClick={() => setDetailModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, cursor: "pointer"}}>✕</button>
             </div>
             <div style={{ flex: 1, overflowY: "auto", paddingRight: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: T.bg, padding: 20, borderRadius: 16 }}>
                   <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Nama Lengkap</p><p style={{ fontSize: 14, fontWeight: "600", color: T.textDark, margin: 0 }}>{detailEmp.full_name}</p></div>
                   <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Email Login</p><p style={{ fontSize: 14, fontWeight: "600", color: T.textDark, margin: 0 }}>{detailEmp.email}</p></div>
                   <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Nomor HP</p><p style={{ fontSize: 14, fontWeight: "600", color: T.textDark, margin: 0 }}>{detailEmp.phone || "-"}</p></div>
                   <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Departemen</p><p style={{ fontSize: 14, fontWeight: "600", color: T.textDark, margin: 0 }}>{detailEmp.department}</p></div>
                   <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Jabatan</p><p style={{ fontSize: 14, fontWeight: "600", color: T.textDark, margin: 0 }}>{detailEmp.position}</p></div>
                   <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Penggunaan Cuti</p><p style={{ fontSize: 14, fontWeight: "700", color: T.textDark, margin: 0 }}><span style={{color: T.red}}>{detailEmp.used_days} Terpakai</span> &nbsp;·&nbsp; {detailEmp.remaining_days} Sisa</p></div>
                </div>
             </div>
             <Button disableRipple onPress={() => setDetailModalOpen(false)} style={{ marginTop: 24, width: "100%", background: T.bg, color: T.textDark, fontWeight: "700", height: 48, borderRadius: 12 }}>Tutup Window</Button>
           </div>
         </div>
      )}

      {previewOpen && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: T.cardBg, borderRadius: 24, padding: "32px", width: 500, maxWidth: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: "800", color: T.textDark, margin: 0 }}>Pratinjau Lampiran</h2>
                <p style={{ fontSize: 12, color: T.textGray, margin: 0 }}>Bukti pendukung dari {selected.employee_name}</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} style={{ background: T.bg, border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, cursor: "pointer"}}>✕</button>
            </div>
            
            <div style={{ background: T.bg, borderRadius: 16, padding: "12px", border: T.cardBorder }}>
              {selected.attachment_url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <div style={{ borderRadius: 12, overflow: "hidden", background: T.cardBg }}>
                  <img 
                    src={`${API_BASE_URL}${selected.attachment_url}`} 
                    alt="Lampiran" 
                    style={{ width: "100%", maxHeight: 400, objectFit: "contain" }}
                  />
                </div>
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                   <span style={{ fontSize: 40, display: "block", marginBottom: 16 }}>📄</span>
                   <p style={{ fontSize: 14, color: T.textDark, fontWeight: "600", marginBottom: 16 }}>Dokumen File ({selected.attachment_url?.split('.').pop().toUpperCase()})</p>
                   <a href={`${API_BASE_URL}${selected.attachment_url}`} target="_blank" rel="noreferrer"
                      style={{ background: T.primary, color: "white", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: "700", display: "inline-block" }}>
                      Buka Dokumen di Tab Baru
                   </a>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
               <a 
                  href={`${API_BASE_URL}${selected.attachment_url}`} 
                  download 
                  style={{ flex: 1, textAlign: "center", background: T.primary, color: "white", padding: "12px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: "700" }}>
                  📥 Simpan File Ke Komputer
               </a>
               <Button disableRipple onClick={() => setPreviewOpen(false)} style={{ flex: 1, background: T.bg, color: T.textDark, fontWeight: "700", height: 44, borderRadius: 10 }}>Tutup</Button>
            </div>
          </div>
        </div>
      )}

      {manualModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: T.cardBg, borderRadius: 24, padding: "32px", width: 500, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0 }}>Input Cuti Manual</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: 12, color: T.textGray }}>Cuti akan otomatis memotong kuota hrd dengan status disetujui.</p>
              </div>
              <button onClick={() => setManualModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, cursor: "pointer"}}>✕</button>
            </div>
            
            {manualError && <div style={{ background: "#fef2f2", color: T.red, padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: "500", marginBottom: 20 }}>{manualError}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Pilih / Ketik Karyawan</p>
                <input 
                  list="hr-employees" 
                  value={manualForm._empName || ""} 
                  onChange={e => {
                    const val = e.target.value;
                    const found = employees.find(emp => `${emp.full_name} (${emp.department})` === val || emp.full_name === val);
                    setManualForm({...manualForm, _empName: val, employee_id: found ? found.id : ""});
                  }} 
                  placeholder="Mulai ketik nama karyawan..."
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg }} 
                />
                <datalist id="hr-employees">
                  {employees.map(emp => <option key={emp.id} value={`${emp.full_name} (${emp.department})`} />)}
                </datalist>
                {!manualForm.employee_id && manualForm._empName && <p style={{ color: T.red, fontSize: 11, margin: "4px 0 0 0" }}>⚠️ Karyawan tidak terdaftar. Wajib daftar dulu!</p>}
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Tipe / Ketik Cuti</p>
                <input 
                  list="hr-leave-types" 
                  value={manualForm._leaveName || ""} 
                  onChange={e => {
                    const val = e.target.value;
                    const found = leaveTypes.find(t => t.name === val);
                    setManualForm({...manualForm, _leaveName: val, leave_type_id: found ? found.id : ""});
                  }} 
                  placeholder="Mulai ketik tipe cuti..."
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg }} 
                />
                <datalist id="hr-leave-types">
                  {leaveTypes.map(t => <option key={t.id} value={t.name} />)}
                </datalist>
                {!manualForm.leave_type_id && manualForm._leaveName && <p style={{ color: T.red, fontSize: 11, margin: "4px 0 0 0" }}>⚠️ Tipe cuti tidak valid. Harus sesuai daftar!</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0" }}>TGL MULAI</p>
                  <input type="date" value={manualForm.start_date} onChange={e => setManualForm({...manualForm, start_date: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box" }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0" }}>TGL SELESAI</p>
                  <input type="date" value={manualForm.end_date} onChange={e => setManualForm({...manualForm, end_date: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Alasan Cuti</p>
                <textarea value={manualForm.reason} onChange={e => setManualForm({...manualForm, reason: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, minHeight: 80, boxSizing: "border-box", resize: "none" }} placeholder="Alasan cuti..." />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
              <Button disableRipple onClick={() => setManualModalOpen(false)} style={{ flex: 1, background: T.cardBg, border: T.cardBorder, color: T.textGray, height: 48, borderRadius: 12, fontWeight: "600" }}>Batal</Button>
              <Button disableRipple onPress={handleManualSubmit} isLoading={manualLoading} style={{ flex: 1, background: T.primary, color: "white", height: 48, borderRadius: 12, fontWeight: "600" }}>Simpan & Setujui Otomatis</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}