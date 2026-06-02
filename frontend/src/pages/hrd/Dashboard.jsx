import { useState, useEffect, useRef } from "react";
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
import {
  leaveRowHasAttachment,
  legacyAttachmentHref,
  fetchLeaveAttachmentWithMeta,
  isImageAttachmentHint,
} from "../../utils/leaveAttachmentFetch";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", full_name: "", department: "", position: "", phone: "", role: "employee" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailEmp, setDetailEmp] = useState(null);

  const [modalAttachmentUrl, setModalAttachmentUrl] = useState(null);
  const [modalAttachmentMime, setModalAttachmentMime] = useState("");
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState(null);
  const [previewAttachmentMime, setPreviewAttachmentMime] = useState("");
  const [successModal, setSuccessModal] = useState({ open: false, title: "", message: "" });
  const modalAttachCleanupRef = useRef(null);
  const previewAttachCleanupRef = useRef(null);

  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const name = localStorage.getItem(STORAGE_KEYS.name) || "HRD Admin";
  const myRole = localStorage.getItem(STORAGE_KEYS.role) || "hrd";

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
    setModalAttachmentUrl(null);
    setModalAttachmentMime("");
    setSelected(leave); setActionType(type); setHrdNote(leave.hrd_note || ""); setModalOpen(true);
  };
  const handleAction = async () => {
    try {
      await leaveApi.updateStatusHR(selected.id, { status: actionType, hrd_note: hrdNote });
      setModalOpen(false); 
      setSuccessModal({ open: true, title: "Status Diperbarui", message: `Pengajuan cuti telah berhasil di-${actionType === 'approved' ? 'setujui' : 'tolak'}.` });
      fetchLeaves(); fetchDashboardStats(); fetchEmployees();
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
    setPreviewAttachmentUrl(null);
    setPreviewAttachmentMime("");
    setSelected(leave);
    setPreviewOpen(true);
  };

  useEffect(() => {
    modalAttachCleanupRef.current?.();
    modalAttachCleanupRef.current = null;
    let cancelled = false;
    let objectURL = null;
    setModalAttachmentUrl(null);
    setModalAttachmentMime("");
    if (!modalOpen || !selected || !leaveRowHasAttachment(selected)) {
      return undefined;
    }
    (async () => {
      try {
        if (selected.has_attachment) {
          const { objectURL: u, contentType } = await fetchLeaveAttachmentWithMeta(
            API_BASE_URL,
            "hrd",
            selected.id,
          );
          objectURL = u;
          modalAttachCleanupRef.current = () => URL.revokeObjectURL(u);
          if (!cancelled) {
            setModalAttachmentUrl(u);
            setModalAttachmentMime(contentType || "");
          }
        } else {
          const href = legacyAttachmentHref(API_BASE_URL, selected);
          if (!cancelled) {
            setModalAttachmentUrl(href);
            setModalAttachmentMime("");
          }
        }
      } catch {
        if (!cancelled) setModalAttachmentUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectURL) URL.revokeObjectURL(objectURL);
      modalAttachCleanupRef.current?.();
      modalAttachCleanupRef.current = null;
    };
  }, [modalOpen, selected?.id, selected?.has_attachment, selected?.attachment_url]);

  useEffect(() => {
    previewAttachCleanupRef.current?.();
    previewAttachCleanupRef.current = null;
    let cancelled = false;
    let objectURL = null;
    setPreviewAttachmentUrl(null);
    setPreviewAttachmentMime("");
    if (!previewOpen || !selected || !leaveRowHasAttachment(selected)) {
      return undefined;
    }
    (async () => {
      try {
        if (selected.has_attachment) {
          const { objectURL: u, contentType } = await fetchLeaveAttachmentWithMeta(
            API_BASE_URL,
            "hrd",
            selected.id,
          );
          objectURL = u;
          previewAttachCleanupRef.current = () => URL.revokeObjectURL(u);
          if (!cancelled) {
            setPreviewAttachmentUrl(u);
            setPreviewAttachmentMime(contentType || "");
          }
        } else {
          const href = legacyAttachmentHref(API_BASE_URL, selected);
          if (!cancelled) {
            setPreviewAttachmentUrl(href);
            setPreviewAttachmentMime("");
          }
        }
      } catch {
        if (!cancelled) setPreviewAttachmentUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectURL) URL.revokeObjectURL(objectURL);
      previewAttachCleanupRef.current?.();
      previewAttachCleanupRef.current = null;
    };
  }, [previewOpen, selected?.id, selected?.has_attachment, selected?.attachment_url]);
  
  const handleDeleteEmployee = async (id, empName) => {
    if (window.confirm(`Yakin ingin menghapus karyawan ${empName}? Data pengajuan cutinya juga mungkin terhapus atau menjadi yatim.`)) {
      try {
        await employeeApi.deleteForHR(id);
        setSuccessModal({ open: true, title: "Karyawan Dihapus", message: `Data karyawan ${empName} telah berhasil dihapus dari sistem.` });
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
      setEditModalOpen(false); 
      setSuccessModal({ open: true, title: "Data Diperbarui", message: "Informasi karyawan telah berhasil diperbarui." });
      fetchEmployees();
    } catch { alert("Gagal update karyawan"); }
  };

  const handleUpdateRole = async (userId, newRole) => {
    const confirmMsg = `Yakin ingin mengubah role karyawan ini menjadi ${newRole.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await employeeApi.updateRole(userId, newRole);
      setSuccessModal({ open: true, title: "Role Diperbarui", message: `Akses karyawan telah berhasil diubah menjadi ${newRole.toUpperCase()}.` });
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal memperbarui role");
    }
  };

  const handleExportExcel = async () => {
    if (leaves.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }
    setIsExporting(true);
    try {
      await exportLeavesWithImages(leaves, API_BASE_URL);
      setSuccessModal({ open: true, title: "Ekspor Berhasil", message: "File Excel premium dengan format lengkap telah berhasil diunduh." });
    } catch (err) {
      console.error(err);
      alert("Gagal mengekspor data Excel");
    } finally {
      setIsExporting(false);
    }
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
      setSuccessModal({ open: true, title: "Cuti Manual Berhasil", message: "Data pengajuan cuti manual telah berhasil disimpan." });
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
    if (!computedReports || computedReports.length === 0) {
      alert("Tidak ada data laporan untuk diekspor.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(computedReports.map(r => ({
      Departemen: (r.department || "N/A").toUpperCase(), 
      "Total Pengajuan Disetujui": r.total_leaves, 
      "Total Hari Cuti": r.total_days
    })));
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Laporan");
    XLSX.writeFile(wb, `Laporan_Rekap_Departemen_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const pending = leaves.filter(l => l.status === "pending");
  const approved = leaves.filter(l => l.status === "approved" || l.status === "disetujui");
  const rejected = leaves.filter(l => l.status === "rejected");

  // Dynamic live computation of department recap reports for 100% real-time synchronization
  const computedReports = (() => {
    const map = {};
    DEPT_OPTIONS.forEach(dept => {
      map[dept.toLowerCase()] = { department: dept, total_leaves: 0, total_days: 0 };
    });

    leaves.forEach(l => {
      const statusVal = (l.status || "").toLowerCase();
      if (statusVal === "approved" || statusVal === "disetujui") {
        const dept = l.employee_department || l.department || "Product";
        const key = dept.toLowerCase();
        if (!map[key]) {
          map[key] = { department: dept, total_leaves: 0, total_days: 0 };
        }
        map[key].total_leaves += 1;
        map[key].total_days += Number(l.total_days || 0);
      }
    });

    return Object.values(map);
  })();

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

  const statusStyle = { pending: { bg: "#fef3c7", color: "#d97706", label: "Menunggu" }, approved: { bg: "#dcfce7", color: "#166534", label: "Disetujui" }, rejected: { bg: "#fee2e2", color: "#991b1b", label: "Ditolak" }, disetujui: { bg: "#dcfce7", color: "#166534", label: "Disetujui" } };

  const MenuItem = ({ id, label, icon, onClick }) => {
    const isActive = activePage === id;
    return (
      <div 
        onClick={() => { 
          if(onClick) onClick(); 
          else setActivePage(id); 
          setIsMobileMenuOpen(false); 
        }} 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          padding: "12px 16px", 
          borderRadius: 12, 
          cursor: "pointer", 
          background: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent", 
          color: isActive ? T.primary : T.textGray, 
          fontWeight: isActive ? "800" : "600", 
          fontSize: 13, 
          transition: "all 0.2s ease", 
          marginBottom: 6,
          border: isActive ? `1px solid rgba(37, 99, 235, 0.15)` : "1px solid transparent"
        }}
        className="premium-menu-item"
      >
        <span style={{ fontSize: 16, opacity: isActive ? 1 : 0.8 }}>{icon}</span> {label}
      </div>
    );
  };

  const handleAddSubmit = async () => {
    if (!addForm.email || !addForm.full_name || !addForm.department || !addForm.position || !addForm.role) {
      setAddError("Semua field wajib diisi kecuali nomor HP!"); return;
    }
    setAddLoading(true); setAddError(""); setAddSuccess("");
    try {
      await employeeApi.createForHR(addForm);
      setAddModalOpen(false);
      setAddForm({ email: "", full_name: "", department: "", position: "", phone: "", role: "employee" });
      setSuccessModal({ open: true, title: "Karyawan Ditambahkan", message: "Akun karyawan baru telah berhasil dibuat dan didaftarkan." });
      fetchEmployees();
    } catch (e) {
      setAddError(e.response?.data?.error || "Gagal menambahkan karyawan");
    } finally { setAddLoading(false); }
  };

  return (
    <div className={`resp-layout font-['Plus_Jakarta_Sans',sans-serif] ${isDarkMode ? "dark" : ""} w-full`} style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.textDark, transition: "background 0.3s, color 0.3s" }}>
      
      {/* SIDEBAR KLASIK (Visually Uplifted to Premium Glassmorphic) */}
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
            <MenuItem id="dashboard" label="Dashboard" icon="❖" />
            <MenuItem id="leaves" label="Pengajuan Cuti" icon="📑" />
            <MenuItem id="calendar" label="Kalender Cuti" icon="📅" />
            <MenuItem id="employees" label="Data Karyawan" icon="👥" />
            <MenuItem id="reports" label="Laporan Ekspor" icon="📊" />
            <MenuItem id="audit" label="Audit Trail" icon="🛡️" />
          </div>

          {/* RINGKASAN DATA COLLAPSIBLE */}
          <div className="sidebar-status" style={{ padding: "0 20px", marginTop: 24 }}>
            <div onClick={() => setIsStatusOpen(!isStatusOpen)} style={{ background: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(241, 245, 249, 0.6)", borderRadius: 16, padding: "16px 20px", border: T.cardBorder, cursor: "pointer", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🏢</span>
                  <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Ringkasan Data</p>
                </div>
                <span style={{ fontSize: 12, color: T.textLight, transform: isStatusOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>▼</span>
              </div>
              {isStatusOpen && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: T.textDark }}>
                    <span>Karyawan</span> <b>{employees.length} Orang</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: T.textDark }}>
                    <span>Dep. Aktif</span> <b>{computedReports.length} Depart.</b>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-profile" style={{ marginTop: "auto", padding: "24px", borderTop: T.cardBorder }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "800", boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)" }}>HR</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: "700", color: T.textDark, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                <p style={{ fontSize: 11, fontWeight: "600", color: T.textGray, margin: 0 }}>Administrator HRD</p>
              </div>
            </div>
            <Button disableRipple onPress={handleLogout} style={{ width: "100%", background: "rgba(239, 68, 68, 0.08)", border: "none", color: T.red, fontWeight: "700", fontSize: 13, borderRadius: 10, height: 38 }} onMouseEnter={(e)=>e.currentTarget.style.background="rgba(239, 68, 68, 0.15)"} onMouseLeave={(e)=>e.currentTarget.style.background="rgba(239, 68, 68, 0.08)"}>
              🚪 &nbsp; Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="resp-content" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "40px" }}>
        
        {/* HEADER */}
        <div className="resp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
           <div>
             <h2 style={{ fontSize: 24, fontWeight: "800", color: T.textDark, margin: "0 0 6px 0", letterSpacing: -0.5 }}>
               {activePage === "dashboard" && "Dashboard Overview"}
               {activePage === "leaves" && "Manajemen Pengajuan Cuti"}
               {activePage === "calendar" && "Kalender Penjadwalan Cuti"}
               {activePage === "employees" && "Manajemen Data Karyawan"}
               {activePage === "reports" && "Analisis & Laporan Ekspor"}
               {activePage === "audit" && "Audit Trail & Keamanan"}
             </h2>
             <p style={{ fontSize: 13, color: T.textGray, margin: 0, fontWeight: "600" }}>📅 &nbsp; {todayStr}</p>
           </div>
           <div className="resp-header-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
             
             {/* THEME TOGGLE BUTTON */}
             <button onClick={toggleTheme} style={{ background: T.cardBg, border: T.cardBorder, padding: "8px 16px", borderRadius: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: T.textDark, fontWeight: "700", fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
               <span style={{ fontSize: 16 }}>{isDarkMode ? "☀️" : "🌙"}</span>
               {isDarkMode ? "Light Mode" : "Dark Mode"}
             </button>

             <button style={{ width: 44, height: 44, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: T.textDark }}>
               🔔
               <span style={{ width: 8, height: 8, borderRadius: 4, background: T.red }} />
             </button>

             {activePage === "employees" && (
               <Button disableRipple onPress={() => setAddModalOpen(true)} className="glow-btn shadow-[0_4px_15px_rgba(37,99,235,0.25)]" style={{ background: T.primary, color: "white", fontWeight: "700", borderRadius: 12, height: 44, padding: "0 20px" }}>
                 + Tambah Karyawan
               </Button>
             )}
           </div>
         </div>

         {/* WELCOME BANNER (Dashboard only) */}
         {activePage === "dashboard" && (
           <div className="resp-welcome-banner animate-fade-in-up" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4f46e5 100%)", borderRadius: 20, padding: "36px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, position: "relative", overflow: "hidden", boxShadow: "0 15px 35px rgba(37,99,235,0.2)", flexWrap: "wrap", gap: 20 }}>
             <div style={{ position: "absolute", right: -30, top: -50, opacity: 0.1, fontSize: 250, transform: "rotate(-15deg)", pointerEvents: "none" }}>✨</div>
             
             <div style={{ zIndex: 1, flex: "1 1 300px" }}>
                <p style={{ margin: "0 0 8px 0", color: "#e0f2fe", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5 }}>Sistem Kehadiran & Cuti Terpadu</p>
                <h2 style={{ margin: "0 0 12px 0", color: "white", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
                  Selamat datang kembali, {name.split(' ')[0]}! 👋
                </h2>
                <p style={{ margin: 0, color: "#f0f9ff", fontSize: 14, maxWidth: 520, lineHeight: 1.6, fontWeight: "500" }}>
                  Pantau terus performa dan kehadiran tim. Ada <strong style={{ color: "white", fontWeight: "800" }}>{stats.pending_today || pending.length} pengajuan cuti baru</strong> yang menunggu keputusan dan peninjauan Anda hari ini.
                </p>
             </div>
             
             <div style={{ zIndex: 1 }}>
                <Button disableRipple onPress={() => setAddModalOpen(true)} style={{ background: "white", color: "#2563eb", fontWeight: "800", borderRadius: 12, height: 48, padding: "0 24px", fontSize: 13, border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
                  + Daftarkan Karyawan Baru
                </Button>
             </div>
           </div>
         )}

         {activePage === "dashboard" && (
           <>
             {/* STATS KOTAK (Uplifted with Premium Gradient Accents) */}
             <div className="resp-grid-4" style={{ gap: 20, marginBottom: 32 }}>
               
               <div className="gradient-sky-glow premium-card-hover rounded-2xl animate-fade-in-up" style={{ padding: "24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ zIndex: 2 }}>
                    <p style={{ fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px 0", color: T.textGray }}>Total Karyawan</p>
                    <h3 style={{ fontSize: 36, fontWeight: "900", margin: "0 0 4px 0" }}>{employees.length || 0} <span style={{ fontSize: 14, fontWeight: "600" }}>Orang</span></h3>
                  </div>
                  <div style={{ position: "absolute", right: 16, bottom: 12, fontSize: 44, opacity: 0.15, zIndex: 1 }}>
                    👥
                  </div>
               </div>

               <div className="gradient-emerald-glow premium-card-hover rounded-2xl animate-fade-in-up" style={{ padding: "24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ zIndex: 2 }}>
                    <p style={{ fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px 0", color: T.textGray }}>Cuti Disetujui</p>
                    <h3 style={{ fontSize: 36, fontWeight: "900", margin: "0 0 4px 0" }}>{approved.length || 0} <span style={{ fontSize: 14, fontWeight: "600" }}>Pengajuan</span></h3>
                  </div>
                  <div style={{ position: "absolute", right: 16, bottom: 12, fontSize: 44, opacity: 0.15, zIndex: 1 }}>
                    ✅
                  </div>
               </div>

               <div className="gradient-yellow-glow premium-card-hover rounded-2xl animate-fade-in-up" style={{ padding: "24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ zIndex: 2 }}>
                    <p style={{ fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px 0", color: T.textGray }}>Menunggu Review</p>
                    <h3 style={{ fontSize: 36, fontWeight: "900", margin: "0 0 4px 0" }}>{pending.length || 0} <span style={{ fontSize: 14, fontWeight: "600" }}>Pengajuan</span></h3>
                  </div>
                  <div style={{ position: "absolute", right: 16, bottom: 12, fontSize: 44, opacity: 0.15, zIndex: 1 }}>
                    ⏳
                  </div>
               </div>

               <div className="gradient-red-glow premium-card-hover rounded-2xl animate-fade-in-up" style={{ padding: "24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)" }}>
                  <div style={{ zIndex: 2 }}>
                    <p style={{ fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px 0", color: T.textGray }}>Cuti Ditolak</p>
                    <h3 style={{ fontSize: 36, fontWeight: "900", margin: "0 0 4px 0" }}>{rejected.length || 0} <span style={{ fontSize: 14, fontWeight: "600" }}>Pengajuan</span></h3>
                  </div>
                  <div style={{ position: "absolute", right: 16, bottom: 12, fontSize: 44, opacity: 0.15, zIndex: 1 }}>
                    ❌
                  </div>
               </div>

             </div>

             {/* TWO COLUMN INSIGHTS */}
             <div className="resp-grid-2" style={{ gap: 24, marginBottom: 24 }}>
               
               {/* ANTREAN CUTI TERBARU */}
               <div className="glass-card" style={{ borderRadius: 20, border: T.cardBorder, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.01)" }}>
                 <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <h3 style={{ margin: 0, fontSize: 15, color: T.textDark, fontWeight: "800" }}>⏳ Antrean Cuti Terbaru</h3>
                   {pending.length > 0 && <span className="status-pill status-pending"><span className="status-dot"></span>{pending.length} Menunggu</span>}
                 </div>
                 
                 <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 12, maxHeight: 340, overflowY: "auto" }}>
                   {pending.length === 0 ? (
                     <div style={{ textAlign: "center", padding: "48px 0", color: T.textGray, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 36, marginBottom: 8 }}>🎉</span>
                        <span style={{ fontWeight: "700", color: T.textDark }}>Semua antrean beres!</span>
                        <span>Tidak ada pengajuan cuti tertunda saat ini.</span>
                     </div>
                   ) : pending.map((l) => (
                     <div key={l.id} className="premium-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: T.cardBorder, borderRadius: 16, background: T.cardBg }}>
                       <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                         <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "800", flexShrink: 0 }}>
                           {l.employee_name?.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <p style={{ margin: 0, fontSize: 13, fontWeight: "800", color: T.textDark }}>{l.employee_name} <span style={{ color: T.textGray, fontWeight: "600", fontSize: 11 }}>— {l.leave_type_name || "Cuti"}</span></p>
                           <p style={{ margin: "3px 0 0 0", fontSize: 11, color: T.textGray, fontWeight: "600" }}>{l.start_date?.slice(0,10)} s/d {l.end_date?.slice(0,10)} <span style={{ color: "#2563eb", fontWeight: "800", background: "rgba(37,99,235,0.06)", padding: "2px 6px", borderRadius: 6, marginLeft: 6 }}>{l.total_days} Hari</span></p>
                         </div>
                       </div>

                       <div style={{ display: "flex", gap: 6 }}>
                           <button onClick={() => openAction(l, "detail")} title="Lihat Detail" style={{ width: 34, height: 34, borderRadius: 10, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>👁️</button>
                           <button onClick={() => openAction(l, "approved")} title="Setujui" style={{ width: 34, height: 34, borderRadius: 10, background: T.green, color: "white", border: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>✓</button>
                           <button onClick={() => openAction(l, "rejected")} title="Tolak" style={{ width: 34, height: 34, borderRadius: 10, background: T.red, color: "white", border: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>✕</button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* SEDANG CUTI HARI INI */}
               <div className="glass-card" style={{ borderRadius: 20, border: T.cardBorder, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.01)" }}>
                 <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)" }}>
                   <h3 style={{ margin: 0, fontSize: 15, color: T.textDark, fontWeight: "800" }}>🏖️ Sedang Cuti Hari Ini</h3>
                 </div>
                 <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 12, maxHeight: 340, overflowY: "auto" }}>
                   {(() => {
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     const offToday = approved.filter(l => {
                        const st = new Date(l.start_date); st.setHours(0,0,0,0);
                        const en = new Date(l.end_date); en.setHours(23,59,59,999);
                        return today >= st && today <= en;
                     });
                     if(offToday.length === 0) {
                       return (
                         <div style={{ textAlign: "center", padding: "48px 0", color: T.textGray, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                           <span style={{ fontSize: 36, marginBottom: 8 }}>💼</span>
                           <span style={{ fontWeight: "700", color: T.textDark }}>Semua Staf Hadir</span>
                           <span>Tidak ada karyawan yang mengambil cuti hari ini.</span>
                         </div>
                       );
                     }
                     return offToday.map(l => (
                       <div key={'off'+l.id} className="premium-card-hover" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: T.cardBg, borderRadius: 16, border: T.cardBorder }}>
                         <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "800", flexShrink: 0 }}>
                           {l.employee_name?.charAt(0).toUpperCase()}
                         </div>
                         <div style={{ minWidth: 0, flex: 1 }}>
                           <p style={{ margin: 0, fontSize: 13, fontWeight: "800", color: T.textDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.employee_name}</p>
                           <p style={{ margin: "2px 0 0 0", fontSize: 11, color: T.textGray, fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.leave_type_name} (Sisa {Math.ceil((new Date(l.end_date) - today) / (1000 * 60 * 60 * 24)) + 1} hari)</p>
                         </div>
                         <span className="status-pill status-approved"><span className="status-dot"></span>Cuti Aktif</span>
                       </div>
                     ));
                   })()}
                 </div>
               </div>

             </div>
           </>
         )}

         {activePage === "leaves" && (
            <div className="glass-card animate-fade-in-up" style={{ borderRadius: 20, border: T.cardBorder, overflow: "hidden" }}>
              <div className="resp-hrd-leaves-toolbar" style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "8px 14px", fontSize: 13, background: T.bg, color: T.textDark, outline: "none", fontWeight: "700" }}>
                    <option value="">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Button disableRipple size="sm" onPress={() => setManualModalOpen(true)} className="glow-btn" style={{ background: T.primary, color: "white", fontWeight: "700", height: 38, padding: "0 16px", borderRadius: 10 }}>
                    + Input Cuti Manual
                  </Button>
                  <Button disableRipple size="sm" onClick={exportLeavesToExcel} isDisabled={isExporting} style={{ background: isExporting ? T.bg : "white", border: T.cardBorder, color: T.textDark, fontWeight: "700", display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", borderRadius: 10 }}>
                    {isExporting ? "⏳ Memproses..." : "📊 Ekspor ke Excel"}
                  </Button>
                </div>
              </div>
              
              <div className="resp-table-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Karyawan</th>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Jadwal Cuti</th>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Lampiran</th>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Status</th>
                    <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id} style={{ borderBottom: T.cardBorder }}>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "700" }}>{l.employee_name}<br/><span style={{fontSize: 11, color: T.textGray, fontWeight: "600"}}>{l.employee_department}</span></td>
                      <td style={{ padding: "16px 24px", fontSize: 12, color: T.textGray, fontWeight: "600" }}>{l.start_date.slice(0,10)} s/d {l.end_date.slice(0,10)} <br/><span style={{fontSize: 11, color: T.textLight, fontWeight: "800"}}>({l.total_days} Hari Kerja)</span></td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        {leaveRowHasAttachment(l) ? (
                          <button onClick={() => openPreview(l)}
                            style={{ color: T.primary, fontSize: 12, fontWeight: "800", textDecoration: "none", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}>
                            📎 Lihat Lampiran
                          </button>
                        ) : <span style={{ fontSize: 11, color: T.textLight, fontWeight: "600" }}>-</span>}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <span className={`status-pill status-${l.status === 'disetujui' ? 'approved' : l.status}`}>
                          <span className="status-dot"></span>
                          {statusStyle[l.status]?.label || l.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                         <button onClick={() => openAction(l, "detail")} style={{ padding: "0 12px", height: 32, borderRadius: 8, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: 12 }}>Detail</button>
                         {l.status === 'pending' && (
                           <>
                             <button onClick={() => openAction(l, "approved")} style={{ width: 32, height: 32, borderRadius: 8, background: T.primary, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✓</button>
                             <button onClick={() => openAction(l, "rejected")} style={{ width: 32, height: 32, borderRadius: 8, background: T.red, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✕</button>
                           </>
                         )}
                         <button onClick={() => handleDeleteLeave(l)} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239, 68, 68, 0.08)", color: T.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title="Hapus pengajuan">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && <tr><td colSpan="5" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray, fontWeight: "600" }}>Belum ada pengajuan cuti.</td></tr>}
                </tbody>
              </table>
              </div>
            </div>
         )}

         {activePage === "calendar" && (
            <div className="glass-card animate-fade-in-up" style={{ borderRadius: 20, border: T.cardBorder, minHeight: 600, display: "flex", flexDirection: "column" }}>
              <div className="resp-calendar-toolbar" style={{ padding: "24px 32px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                   <h3 style={{ margin: 0, fontSize: 18, fontWeight: "800", color: T.textDark, letterSpacing: -0.3 }}>Kalender Cuti Perusahaan</h3>
                   <p style={{ margin: "4px 0 0 0", fontSize: 13, color: T.textGray, fontWeight: "600" }}>Visualisasikan absensi cuti seluruh karyawan secara transparan.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <button type="button" onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))} style={{ width: 40, height: 40, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", fontWeight: "bold", color: T.textDark }}>←</button>
                  <span style={{ fontSize: 14, fontWeight: "800", minWidth: 120, textAlign: "center", color: T.textDark }}>
                    {currentMonthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                  </span>
                  <button type="button" onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))} style={{ width: 40, height: 40, borderRadius: 12, border: T.cardBorder, background: T.cardBg, cursor: "pointer", fontWeight: "bold", color: T.textDark }}>→</button>
                  <button type="button" onClick={() => setCurrentMonthDate(new Date())} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: "none", background: T.highlightBg, color: T.primary, cursor: "pointer", fontWeight: "700", fontSize: 13 }}>Hari Ini</button>
                </div>
              </div>
              
              <div className="resp-calendar-scroll" style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column" }}>
                 <div className="resp-calendar-inner">
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, marginBottom: 12 }}>
                   {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map(d => (
                     <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: "800", color: T.textGray, textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
                   ))}
                 </div>
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, flex: 1 }}>
                   {(() => {
                     const year = currentMonthDate.getFullYear();
                     const month = currentMonthDate.getMonth();
                     const firstDay = new Date(year, month, 1).getDay();
                     const daysInMonth = new Date(year, month + 1, 0).getDate();
                     
                     const cells = [];
                     for(let i=0; i<firstDay; i++) cells.push(<div key={`empty-${i}`} style={{ background: T.bg, borderRadius: 12, opacity: 0.3 }}></div>);
                     
                     for(let day=1; day<=daysInMonth; day++) {
                       const dateObj = new Date(year, month, day);
                       dateObj.setHours(0,0,0,0);
                       
                       const isToday = new Date().setHours(0,0,0,0) === dateObj.getTime();
                       
                       const drops = approved.filter(l => {
                          const st = new Date(l.start_date); st.setHours(0,0,0,0);
                          const en = new Date(l.end_date); en.setHours(23,59,59,999);
                          return dateObj >= st && dateObj <= en;
                       });
                       
                       cells.push(
                         <div key={day} className="resp-calendar-cell" style={{ border: drops.length > 0 ? `2px solid ${T.primary}` : T.cardBorder, borderRadius: 12, minHeight: 120, padding: "8px", background: isToday ? "rgba(37,99,235,0.06)" : (drops.length > 0 ? "rgba(37,99,235,0.04)" : T.cardBg), display: "flex", flexDirection: "column", gap: 4, transition: "transform 0.1s", cursor: "pointer" }}
                              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                           <div style={{ fontSize: 14, fontWeight: isToday || drops.length > 0 ? "800" : "700", color: isToday ? T.primary : T.textDark, textAlign: "right", marginBottom: 4 }}>
                             {day}
                           </div>
                           <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 }}>
                             {drops.slice(0, 3).map(l => (
                               <div key={'drop'+l.id} title={`${l.employee_name} - ${l.leave_type_name}`} style={{ background: T.primary, color: "white", fontSize: 9, fontWeight: "800", padding: "4px 6px", borderRadius: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", boxShadow: "0 2px 4px rgba(37,99,235,0.15)" }}>
                                 {l.employee_name.split(' ')[0]} ({l.leave_type_name.substring(0,3)})
                               </div>
                             ))}
                             {drops.length > 3 && (
                               <div style={{ fontSize: 10, fontWeight: "800", color: T.textGray, textAlign: "center", marginTop: "auto" }}>+{drops.length - 3} lainnya</div>
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
            </div>
         )}

         {activePage === "employees" && (
            <div className="glass-card animate-fade-in-up" style={{ borderRadius: 20, border: T.cardBorder, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: "800", color: T.textDark }}>Daftar Karyawan Terdaftar</h3>
              </div>
              <div className="resp-table-wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Nama Lengkap</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Email</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Kontak</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Hak Akses</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} style={{ borderBottom: T.cardBorder }}>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "700" }}>{emp.full_name}<br/><span style={{fontSize: 11, color: T.textGray, fontWeight: "600"}}>{emp.department} · {emp.position}</span></td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray, fontWeight: "600" }}>{emp.email}</td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray, fontWeight: "600" }}>{emp.phone || "0812983198"}</td>
                        <td style={{ padding: "16px 24px" }}>
                           {myRole === "admin" ? (
                             <select 
                               value={emp.role} 
                               onChange={(e) => handleUpdateRole(emp.user_id || emp.id, e.target.value)}
                               style={{ padding: "6px 12px", borderRadius: 8, border: T.cardBorder, fontSize: 12, fontWeight: "700", cursor: "pointer", background: T.bg, color: T.textDark }}
                             >
                               <option value="employee">Pegawai</option>
                               <option value="hrd">Admin (HRD)</option>
                               <option value="admin">Super Admin</option>
                             </select>
                           ) : (
                             <span className={`status-pill status-${emp.role === 'hrd' || emp.role === 'admin' ? 'approved' : 'pending'}`}>
                               <span className="status-dot"></span>
                               {emp.role === "hrd" ? "Admin HR" : emp.role === "admin" ? "Super Admin" : "Pegawai"}
                             </span>
                           )}
                        </td>
                        <td style={{ padding: "16px 24px", display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                          <button onClick={() => openDetail(emp)} style={{ padding: "0 12px", height: 32, borderRadius: 8, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", fontWeight: "700", fontSize: 12 }}>Detail</button>
                          <button onClick={() => openEdit(emp)} style={{ padding: "0 12px", height: 32, borderRadius: 8, background: "rgba(245, 158, 11, 0.08)", color: T.yellow, border: "none", cursor: "pointer", fontWeight: "700", fontSize: 12 }}>Edit</button>
                          <button onClick={() => handleDeleteEmployee(emp.id, emp.full_name)} style={{ padding: "0 12px", height: 32, borderRadius: 8, background: "rgba(239, 68, 68, 0.08)", color: T.red, border: "none", cursor: "pointer", fontWeight: "700", fontSize: 12 }}>Hapus</button>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && <tr><td colSpan="5" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray, fontWeight: "600" }}>Belum ada data karyawan.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
         )}

         {activePage === "reports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }} className="animate-fade-in-up">
              {/* SUMMARY CARDS REPORTS */}
              <div className="resp-grid-3" style={{ gap: 20 }}>
                 <div className="glass-card premium-card-hover" style={{ borderRadius: 20, border: T.cardBorder, padding: 24, borderLeft: `6px solid ${T.primary}` }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, fontWeight: "800", color: T.textGray, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Cuti Disetujui</p>
                    <h3 style={{ margin: 0, fontSize: 24, fontWeight: "900", color: T.textDark }}>{computedReports.reduce((sum, r) => sum + r.total_leaves, 0)} <span style={{fontSize: 14, fontWeight: "600", color: T.textGray}}>Transaksi</span></h3>
                 </div>
                 <div className="glass-card premium-card-hover" style={{ borderRadius: 20, border: T.cardBorder, padding: 24, borderLeft: `6px solid ${T.green}` }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, fontWeight: "800", color: T.textGray, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Hari Istirahat</p>
                    <h3 style={{ margin: 0, fontSize: 24, fontWeight: "900", color: T.textDark }}>{computedReports.reduce((sum, r) => sum + r.total_days, 0)} <span style={{fontSize: 14, fontWeight: "600", color: T.textGray}}>Hari Kerja</span></h3>
                 </div>
                 <div className="glass-card premium-card-hover" style={{ borderRadius: 20, border: T.cardBorder, padding: 24, borderLeft: `6px solid ${T.yellow}` }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: 11, fontWeight: "800", color: T.textGray, textTransform: "uppercase", letterSpacing: 0.5 }}>Dep. Paling Aktif</p>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: "900", color: T.textDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                       {computedReports.length > 0 ? computedReports.reduce((prev, current) => (prev.total_leaves > current.total_leaves) ? prev : current).department : "-"}
                    </h3>
                 </div>
              </div>

              <div className="resp-grid-2" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
                 {/* CHART SECTION */}
                 <div className="glass-card" style={{ borderRadius: 20, border: T.cardBorder, padding: 24 }}>
                    <h3 style={{ margin: "0 0 24px 0", fontSize: 15, fontWeight: "800", color: T.textDark }}>Analisis Cuti per Departemen</h3>
                    <div style={{ height: 300, width: "100%" }}>
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={computedReports}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                             <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: T.textGray, fontSize: 12, fontWeight: "600"}} />
                             <YAxis axisLine={false} tickLine={false} tick={{fill: T.textGray, fontSize: 12, fontWeight: "600"}} />
                             <Tooltip 
                                contentStyle={{ background: T.cardBg, border: T.cardBorder, borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                itemStyle={{ color: T.primary, fontWeight: "bold" }}
                             />
                             <Bar dataKey="total_leaves" fill={T.primary} radius={[6, 6, 0, 0]} barSize={40} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* ACTION CARD */}
                 <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 20, padding: 32, color: "white", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden", border: isDarkMode ? "1px solid #334155" : "none" }}>
                    <div style={{ position: "absolute", right: -20, bottom: -20, fontSize: 120, opacity: 0.08 }}>📊</div>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 }}>Siap untuk Rekap Bulanan?</h3>
                    <p style={{ margin: "0 0 32px 0", fontSize: 13, opacity: 0.8, lineHeight: 1.6, fontWeight: "500" }}>Ekspor seluruh riwayat pengajuan cuti ke format Excel premium untuk memudahkan rekapitulasi gaji dan audit tahunan divisi HR.</p>
                    <Button 
                       disableRipple 
                       onPress={handleExportExcel}
                       isLoading={isExporting}
                       className="glow-btn"
                       style={{ background: T.primary, color: "white", fontWeight: "800", borderRadius: 12, height: 48, fontSize: 14 }}
                    >
                       {isExporting ? "⏳ Memproses Excel..." : "📊 Ekspor Laporan Lengkap (.xlsx)"}
                    </Button>
                 </div>
              </div>

              {/* TABLE SECTION */}
              <div className="glass-card" style={{ borderRadius: 20, border: T.cardBorder, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: "800", color: T.textDark }}>Data Rekapitulasi Departemen</h3>
                  <Button size="sm" onClick={exportReportsToExcel} style={{ background: "transparent", border: T.cardBorder, color: T.textDark, fontWeight: "700", borderRadius: 8, height: 36 }}>Ringkasan Departemen (.xlsx)</Button>
                </div>
                <div className="resp-table-wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Departemen</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Total Pengajuan ACC</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Total Durasi Cuti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedReports.map((r, i) => (
                      <tr key={i} style={{ borderBottom: T.cardBorder }}>
                         <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "700" }}>{r.department}</td>
                         <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray, textAlign: "center", fontWeight: "600" }}>{r.total_leaves} Transaksi</td>
                         <td style={{ padding: "16px 24px", fontSize: 13, color: T.primary, fontWeight: "800", textAlign: "center" }}>{r.total_days} Hari</td>
                      </tr>
                    ))}
                    {computedReports.length === 0 && <tr><td colSpan="3" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray, fontWeight: "600" }}>Tidak ada data rekapitulasi.</td></tr>}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
         )}

         {activePage === "audit" && (
            <div className="glass-card animate-fade-in-up" style={{ borderRadius: 20, border: T.cardBorder, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px dashed rgba(148, 163, 184, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: "800", color: T.textDark }}>Audit Trail Logs</h3>
                <Button disableRipple size="sm" onClick={fetchAuditLogs} style={{ background: T.bg, border: T.cardBorder, color: T.textDark, fontWeight: "700", borderRadius: 8, height: 36 }}>🔄 Segarkan Logs</Button>
              </div>
              <div className="resp-table-wrapper" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Waktu</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Pengguna</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Aksi</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>Path API</th>
                      <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: "800", color: T.textGray, borderBottom: T.cardBorder, background: isDarkMode ? "#1e293b" : "#f8fafc", textTransform: "uppercase", letterSpacing: 0.5 }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: T.cardBorder }}>
                         <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "600" }}>
                           {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                         </td>
                         <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "700" }}>{log.full_name}<br/><span style={{fontSize: 11, color: T.textGray, fontWeight: "500"}}>{log.email}</span></td>
                         <td style={{ padding: "16px 24px", textAlign: "center" }}>
                           <span style={{ 
                             display: "inline-block", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: "800",
                             background: log.action === "GET" ? "rgba(3,105,161,0.08)" : log.action === "POST" ? "rgba(16,185,129,0.08)" : log.action === "PUT" ? "rgba(245,158,11,0.08)" : log.action === "DELETE" ? "rgba(239,68,68,0.08)" : "rgba(148,163,184,0.08)",
                             color: log.action === "GET" ? "#0284c7" : log.action === "POST" ? T.green : log.action === "PUT" ? T.yellow : log.action === "DELETE" ? T.red : T.textGray
                           }}>
                             {log.action}
                           </span>
                         </td>
                         <td style={{ padding: "16px 24px", fontSize: 12, color: T.textGray, fontFamily: "monospace", fontWeight: "600" }}>{log.path}</td>
                         <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray, fontWeight: "600" }}>{log.ip_address || "-"}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", fontSize: 13, color: T.textGray, fontWeight: "600" }}>Belum ada rekaman audit trail logs.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
         )}

       </div>

       {/* MODALS */}
       {modalOpen && selected && (
         <div className="resp-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(5px)", padding: 20 }}>
           <div className="glass-card" style={{ width: "100%", maxWidth: 480, borderRadius: 24, padding: 32, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
               <h3 style={{ margin: 0, fontSize: 20, fontWeight: "800", color: T.textDark, letterSpacing: -0.5 }}>
                 {actionType === "approved" ? "Setujui Pengajuan" : actionType === "rejected" ? "Tolak Pengajuan" : "Detail Pengajuan"}
               </h3>
               <button onClick={() => setModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 14, cursor: "pointer", color: T.textGray, width: 28, height: 28, borderRadius: "50%" }}>✕</button>
             </div>

             <div style={{ background: T.bg, borderRadius: 16, padding: "20px", marginBottom: 24, border: T.cardBorder }}>
               <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 16, fontWeight: "800", color: T.textDark, margin: "0 0 4px 0" }}>{selected.employee_name}</p>
                  <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: 0 }}>{selected.employee_department || "-"}</p>
               </div>
               
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Tipe Cuti</p><p style={{ fontSize: 13, fontWeight: "700", color: T.textDark, margin: 0 }}>{selected.leave_type_name || "Cuti"}</p></div>
                  <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Durasi</p><p style={{ fontSize: 13, fontWeight: "700", color: T.textDark, margin: 0 }}>{selected.total_days} Hari</p></div>
                  <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Periode</p><p style={{ fontSize: 13, fontWeight: "700", color: T.textDark, margin: 0 }}>{selected.start_date?.slice(0, 10)} sd {selected.end_date?.slice(0, 10)}</p></div>
                  <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Status</p><p style={{ fontSize: 13, fontWeight: "800", color: selected.status === "approved" || selected.status === "disetujui" ? T.green : selected.status === "rejected" ? T.red : T.yellow, margin: 0, textTransform: "uppercase" }}>{selected.status}</p></div>
               </div>

               <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed rgba(148,163,184,0.2)" }}>
                  <p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Alasan Cuti</p>
                  <p style={{ fontSize: 13, fontWeight: "600", color: T.textDark, margin: 0, lineHeight: 1.5 }}>{selected.reason || "-"}</p>
               </div>

               {leaveRowHasAttachment(selected) && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed rgba(148,163,184,0.2)" }}>
                     <p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Lampiran Pendukung</p>
                     {modalAttachmentUrl && isImageAttachmentHint({ row: selected, fetchedContentType: modalAttachmentMime }) ? (
                       <div style={{ borderRadius: 12, overflow: "hidden", border: T.cardBorder, background: T.cardBg, padding: 4 }}>
                         <img
                           src={modalAttachmentUrl}
                           alt="Lampiran"
                           style={{ width: "100%", maxHeight: 280, objectFit: "contain", cursor: "zoom-in" }}
                           onClick={() => window.open(modalAttachmentUrl, "_blank")}
                         />
                       </div>
                     ) : modalAttachmentUrl ? (
                       <a href={modalAttachmentUrl} target="_blank" rel="noreferrer"
                         style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px", background: T.cardBg, borderRadius: 12, border: T.cardBorder, color: T.primary, textDecoration: "none", fontSize: 13, fontWeight: "700" }}>
                         📄 Lihat Dokumen Pendukung
                       </a>
                     ) : (
                       <p style={{ margin: 0, fontSize: 12, color: T.textGray, fontWeight: "600" }}>Memuat lampiran...</p>
                     )}
                  </div>
               )}
             </div>

             {actionType !== "detail" && (
               <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: "800", color: T.textGray, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Catatan Peninjauan HRD</label>
                  <textarea placeholder="Tuliskan catatan persetujuan atau penolakan..." value={hrdNote} onChange={(e) => setHrdNote(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, minHeight: 80, resize: "none", boxSizing: "border-box", fontFamily: "inherit", fontWeight: "600", fontSize: 13 }} />
               </div>
             )}

             <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
               {actionType !== "detail" ? (
                 <>
                    <Button disableRipple onPress={() => setModalOpen(false)} style={{ background: "white", border: T.cardBorder, color: T.textDark, borderRadius: 12, height: 44, fontWeight: "700" }}>Batal</Button>
                    <Button disableRipple onPress={handleAction} className="glow-btn" style={{ background: actionType === "approved" ? T.primary : T.red, fontWeight: "700", color: "white", borderRadius: 12, height: 44 }}>{actionType === "approved" ? "Setujui Pengajuan" : "Tolak Pengajuan"}</Button>
                 </>
               ) : (
                 <Button disableRipple onPress={() => setModalOpen(false)} style={{ width: "100%", background: T.bg, color: T.textDark, fontWeight: "700", borderRadius: 12, height: 44 }}>Tutup Detail</Button>
               )}
             </div>
           </div>
         </div>
       )}

       {editModalOpen && (
         <div className="resp-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(5px)", padding: 20 }}>
           <div className="glass-card" style={{ width: "100%", maxWidth: 460, borderRadius: 24, padding: 32, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
               <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0, letterSpacing: -0.5 }}>Edit Karyawan</h2>
               <button onClick={() => setEditModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 14, cursor: "pointer", color: T.textGray, width: 28, height: 28, borderRadius: "50%" }}>✕</button>
             </div>
             
             <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
               <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Nama Lengkap</p><input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, fontWeight: "600" }} /></div>
               <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Departemen</p><input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} list="dept-list" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, fontWeight: "600" }} /></div>
               <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Posisi / Jabatan</p><input value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} list="pos-list" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, fontWeight: "600" }} /></div>
               <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Hak Akses Sistem</p>
                 <select 
                   value={editForm.role} 
                   onChange={e => setEditForm({...editForm, role: e.target.value})} 
                   style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, cursor: "pointer", fontWeight: "700" }}
                 >
                   <option value="employee">Karyawan Biasa</option>
                   <option value="hrd">Staff HRD (Dashboard HRD)</option>
                   <option value="admin">Super Admin (Akses Penuh)</option>
                 </select>
               </div>
             </div>
             
             <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 32 }}>
               <Button disableRipple onClick={() => setEditModalOpen(false)} style={{ flex: 1, background: "white", border: T.cardBorder, color: T.textDark, height: 44, borderRadius: 12, fontWeight: "700" }}>Batal</Button>
               <Button disableRipple onPress={handleEdit} className="glow-btn" style={{ flex: 1, background: T.primary, color: "white", height: 44, borderRadius: 12, fontWeight: "700" }}>Simpan Perubahan</Button>
             </div>
           </div>
         </div>
       )}

       {detailModalOpen && detailEmp && (
          <div className="resp-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(5px)", padding: 20 }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: 540, borderRadius: 24, padding: 32, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                 <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0, letterSpacing: -0.5 }}>Profil Karyawan</h2>
                 <button onClick={() => setDetailModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 14, cursor: "pointer", color: T.textGray, width: 28, height: 28, borderRadius: "50%" }}>✕</button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, background: T.bg, padding: 24, borderRadius: 16, border: T.cardBorder, marginBottom: 24 }}>
                 <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Nama Lengkap</p><p style={{ fontSize: 14, fontWeight: "700", color: T.textDark, margin: 0 }}>{detailEmp.full_name}</p></div>
                 <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Email Login</p><p style={{ fontSize: 14, fontWeight: "700", color: T.textDark, margin: 0 }}>{detailEmp.email}</p></div>
                 <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Nomor HP</p><p style={{ fontSize: 14, fontWeight: "700", color: T.textDark, margin: 0 }}>{detailEmp.phone || "-"}</p></div>
                 <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Departemen</p><p style={{ fontSize: 14, fontWeight: "700", color: T.textDark, margin: 0 }}>{detailEmp.department}</p></div>
                 <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Jabatan</p><p style={{ fontSize: 14, fontWeight: "700", color: T.textDark, margin: 0 }}>{detailEmp.position}</p></div>
                 <div><p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Penggunaan Cuti</p><p style={{ fontSize: 14, fontWeight: "800", color: T.textDark, margin: 0 }}><span style={{color: T.red}}>{detailEmp.used_days} Terpakai</span> · {detailEmp.remaining_days} Sisa</p></div>
              </div>
              
              <Button disableRipple onPress={() => setDetailModalOpen(false)} style={{ width: "100%", background: T.bg, color: T.textDark, fontWeight: "700", height: 44, borderRadius: 12 }}>Tutup Window</Button>
            </div>
          </div>
       )}

       {previewOpen && selected && (
         <div className="resp-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, backdropFilter: "blur(5px)", padding: 20 }}>
           <div className="glass-card" style={{ width: "100%", maxWidth: 500, borderRadius: 24, padding: 32, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
               <div>
                 <h2 style={{ fontSize: 18, fontWeight: "800", color: T.textDark, margin: 0 }}>Pratinjau Lampiran</h2>
                 <p style={{ fontSize: 12, color: T.textGray, margin: 0, fontWeight: "600" }}>Bukti pendukung dari {selected.employee_name}</p>
               </div>
               <button onClick={() => setPreviewOpen(false)} style={{ background: T.bg, border: "none", fontSize: 14, cursor: "pointer", color: T.textGray, width: 28, height: 28, borderRadius: "50%" }}>✕</button>
             </div>
             
             <div style={{ background: T.bg, borderRadius: 16, padding: "12px", border: T.cardBorder, marginBottom: 24 }}>
               {!previewAttachmentUrl ? (
                 <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: T.textGray, fontWeight: "600" }}>Memuat lampiran...</div>
               ) : isImageAttachmentHint({ row: selected, fetchedContentType: previewAttachmentMime }) ? (
                 <div style={{ borderRadius: 12, overflow: "hidden", background: T.cardBg }}>
                   <img 
                     src={previewAttachmentUrl} 
                     alt="Lampiran" 
                     style={{ width: "100%", maxHeight: 400, objectFit: "contain" }}
                   />
                 </div>
               ) : (
                 <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <span style={{ fontSize: 40, display: "block", marginBottom: 16 }}>📄</span>
                    <p style={{ fontSize: 14, color: T.textDark, fontWeight: "800", marginBottom: 16 }}>
                      Dokumen {(selected.attachment_filename || selected.attachment_url || "").split(".").pop()?.toUpperCase() || "FILE"}
                    </p>
                    <a href={previewAttachmentUrl} target="_blank" rel="noreferrer"
                       style={{ background: T.primary, color: "white", padding: "10px 24px", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: "700", display: "inline-block" }}>
                       Buka Dokumen di Tab Baru
                    </a>
                 </div>
               )}
             </div>

             <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a 
                   href={previewAttachmentUrl || "#"}
                   download={selected.attachment_filename || "lampiran-cuti"}
                   className="glow-btn"
                   style={{ flex: 1, textAlign: "center", background: T.primary, color: "white", padding: "12px", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: "800", pointerEvents: previewAttachmentUrl ? "auto" : "none", opacity: previewAttachmentUrl ? 1 : 0.6 }}>
                   📥 Unduh Berkas
                </a>
                <Button disableRipple onClick={() => setPreviewOpen(false)} style={{ flex: 1, background: "white", border: T.cardBorder, color: T.textDark, fontWeight: "700", height: 44, borderRadius: 12 }}>Tutup</Button>
             </div>
           </div>
         </div>
       )}

       {manualModalOpen && (
         <div className="resp-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(5px)", padding: 20 }}>
           <div className="glass-card" style={{ width: "100%", maxWidth: 500, borderRadius: 24, padding: 32, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
               <div>
                 <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0, letterSpacing: -0.5 }}>Input Cuti Manual</h2>
                 <p style={{ margin: "4px 0 0 0", fontSize: 12, color: T.textGray, fontWeight: "600" }}>Saldo akan langsung berkurang dan status langsung disetujui otomatis.</p>
               </div>
               <button onClick={() => setManualModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 14, cursor: "pointer", color: T.textGray, width: 28, height: 28, borderRadius: "50%" }}>✕</button>
             </div>
             
             {manualError && <div style={{ background: "rgba(239,68,68,0.08)", color: T.red, padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: "700", marginBottom: 20, border: "1px solid rgba(239,68,68,0.15)" }}>⚠️ {manualError}</div>}

             <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Pilih Karyawan</p>
                 <input 
                   list="hr-employees" 
                   value={manualForm._empName || ""} 
                   onChange={e => {
                     const val = e.target.value;
                     const found = employees.find(emp => `${emp.full_name} (${emp.department})` === val || emp.full_name === val);
                     setManualForm({...manualForm, _empName: val, employee_id: found ? found.id : ""});
                   }} 
                   placeholder="Ketik nama karyawan..."
                   style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, fontWeight: "600" }} 
                 />
                 <datalist id="hr-employees">
                   {employees.map(emp => <option key={emp.id} value={`${emp.full_name} (${emp.department})`} />)}
                 </datalist>
                 {!manualForm.employee_id && manualForm._empName && <p style={{ color: T.red, fontSize: 11, margin: "4px 0 0 0", fontWeight: "700" }}>⚠️ Karyawan belum terdaftar sistem.</p>}
               </div>

               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Jenis Cuti</p>
                 <input 
                   list="hr-leave-types" 
                   value={manualForm._leaveName || ""} 
                   onChange={e => {
                     const val = e.target.value;
                     const found = leaveTypes.find(t => t.name === val);
                     setManualForm({...manualForm, _leaveName: val, leave_type_id: found ? found.id : ""});
                   }} 
                   placeholder="Pilih jenis cuti..."
                   style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, fontWeight: "600" }} 
                 />
                 <datalist id="hr-leave-types">
                   {leaveTypes.map(t => <option key={t.id} value={t.name} />)}
                 </datalist>
                 {!manualForm.leave_type_id && manualForm._leaveName && <p style={{ color: T.red, fontSize: 11, margin: "4px 0 0 0", fontWeight: "700" }}>⚠️ Jenis cuti tidak valid.</p>}
               </div>

               <div className="resp-grid-2" style={{ gap: 16 }}>
                 <div>
                   <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0" }}>TANGGAL MULAI</p>
                   <input type="date" value={manualForm.start_date} onChange={e => setManualForm({...manualForm, start_date: e.target.value})} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box", fontWeight: "600" }} />
                 </div>
                 <div>
                   <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0" }}>TANGGAL SELESAI</p>
                   <input type="date" value={manualForm.end_date} onChange={e => setManualForm({...manualForm, end_date: e.target.value})} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box", fontWeight: "600" }} />
                 </div>
               </div>

               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Alasan Cuti</p>
                 <textarea value={manualForm.reason} onChange={e => setManualForm({...manualForm, reason: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, minHeight: 80, boxSizing: "border-box", resize: "none", fontFamily: "inherit", fontWeight: "600", fontSize: 13 }} placeholder="Tuliskan keterangan cuti manual..." />
               </div>
             </div>

             <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
               <Button disableRipple onPress={() => setManualModalOpen(false)} style={{ background: "white", border: T.cardBorder, color: T.textDark, height: 44, borderRadius: 12, fontWeight: "700" }}>Batal</Button>
               <Button disableRipple onPress={handleManualSubmit} isLoading={manualLoading} className="glow-btn" style={{ background: T.primary, color: "white", height: 44, borderRadius: 12, fontWeight: "700" }}>Simpan & Setujui</Button>
             </div>
           </div>
         </div>
       )}

       {/* MODAL TAMBAH KARYAWAN */}
       {addModalOpen && (
         <div className="resp-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(5px)", padding: 20 }}>
           <div className="glass-card" style={{ width: "100%", maxWidth: 500, borderRadius: 24, padding: 32, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
               <div>
                 <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0, letterSpacing: -0.5 }}>Tambah Data Karyawan</h2>
                 <p style={{ margin: "4px 0 0 0", fontSize: 12, color: T.textGray, fontWeight: "600" }}>Masukkan info profil dan role absensi pegawai baru.</p>
               </div>
               <button onClick={() => setAddModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 14, cursor: "pointer", color: T.textGray, width: 28, height: 28, borderRadius: "50%" }}>✕</button>
             </div>
             
             {addError && <div style={{ background: "rgba(239,68,68,0.08)", color: T.red, padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: "700", marginBottom: 20, border: "1px solid rgba(239,68,68,0.15)" }}>{addError}</div>}

             <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Nama Lengkap <span style={{ color: T.red }}>*</span></p>
                 <input type="text" value={addForm.full_name} onChange={e => setAddForm({...addForm, full_name: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box", fontWeight: "600" }} placeholder="Contoh: Budi Santoso" />
               </div>
               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Email Login <span style={{ color: T.red }}>*</span></p>
                 <input type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box", fontWeight: "600" }} placeholder="Contoh: budi@appskep.com" />
               </div>
               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Nomor HP</p>
                 <input type="text" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box", fontWeight: "600" }} placeholder="Contoh: 08123456789" />
               </div>
               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Departemen <span style={{ color: T.red }}>*</span></p>
                 <input 
                   list="dept-list"
                   value={addForm.department} 
                   onChange={e => setAddForm({...addForm, department: e.target.value})} 
                   placeholder="Ketik departemen..."
                   style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box", fontWeight: "600" }} 
                 />
                 <datalist id="dept-list">
                   {DEPT_OPTIONS.map(d => <option key={d} value={d} />)}
                 </datalist>
               </div>
               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Jabatan <span style={{ color: T.red }}>*</span></p>
                 <input 
                   list="pos-list"
                   value={addForm.position} 
                   onChange={e => setAddForm({...addForm, position: e.target.value})} 
                   placeholder="Ketik jabatan..."
                   style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box", fontWeight: "600" }} 
                 />
                 <datalist id="pos-list">
                   {POS_OPTIONS.map(p => <option key={p} value={p} />)}
                 </datalist>
               </div>
               <div>
                 <p style={{ fontSize: 11, fontWeight: "800", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Hak Akses Sistem <span style={{ color: T.red }}>*</span></p>
                 <select value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, boxSizing: "border-box", fontWeight: "700" }}>
                   <option value="employee">Karyawan Biasa</option>
                   <option value="hrd">HRD / Admin</option>
                 </select>
               </div>
             </div>

             <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
               <Button disableRipple onClick={() => setAddModalOpen(false)} style={{ flex: 1, background: "white", border: T.cardBorder, color: T.textDark, height: 44, borderRadius: 12, fontWeight: "700" }}>Batal</Button>
               <Button disableRipple onPress={handleAddSubmit} isLoading={addLoading} className="glow-btn" style={{ flex: 1, background: T.primary, color: "white", height: 44, borderRadius: 12, fontWeight: "700" }}>Dafrtarkan Karyawan</Button>
             </div>
           </div>
         </div>
       )}

       {/* SUCCESS MODAL REUSABLE */}
       {successModal.open && (
         <div className="resp-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001, backdropFilter: "blur(6px)", padding: 20 }}>
           <div className="resp-modal-shell animate-bounce-subtle" style={{ background: "white", borderRadius: 28, padding: "40px 32px", width: 400, maxWidth: "100%", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}>
             <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px" }}>
               ✓
             </div>
             <h2 style={{ fontSize: 22, fontWeight: "800", color: "#1e293b", margin: "0 0 12px 0" }}>{successModal.title}</h2>
             <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 32px 0", lineHeight: 1.6 }}>{successModal.message}</p>
             <Button 
               disableRipple 
               onPress={() => setSuccessModal({ ...successModal, open: false })} 
               style={{ width: "100%", background: "#1e293b", color: "white", height: 52, borderRadius: 16, fontWeight: "700", fontSize: 15 }}
             >
               Oke, Mengerti
             </Button>
           </div>
         </div>
       )}
    </div>
  );
}
