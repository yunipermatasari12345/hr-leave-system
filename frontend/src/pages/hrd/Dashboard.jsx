import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Divider } from "@heroui/react";
import * as XLSX from "xlsx";
import { leaveApi } from "../../api/leaveApi";
import { employeeApi } from "../../api/employeeApi";
import { reportingApi } from "../../api/reportingApi";
import { STORAGE_KEYS } from "../../constants/storage";

export default function HrdDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hrdNote, setHrdNote] = useState("");
  const [actionType, setActionType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", full_name: "", department: "", position: "", phone: "" });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailEmp, setDetailEmp] = useState(null);

  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const name = localStorage.getItem(STORAGE_KEYS.name) || "HRD Admin";

  const [stats, setStats] = useState({ total_employees: 0, pending_today: 0, total_approved: 0, total_rejected: 0, total_pending: 0 });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    const fetchData = () => {
      if (activePage === "dashboard") fetchDashboardStats();
      fetchLeaves();
      fetchEmployees();
      if (activePage === "reports" || activePage === "master") {
        fetchMasterData();
        fetchReports();
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
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

  const openAction = (leave, type) => {
    setSelected(leave); setActionType(type); setHrdNote(leave.hrd_note || ""); setModalOpen(true);
  };
  const handleAction = async () => {
    try {
      await leaveApi.updateStatusHR(selected.id, { status: actionType, hrd_note: hrdNote });
      setModalOpen(false); fetchLeaves(); fetchDashboardStats(); fetchEmployees();
    } catch { alert("Gagal update status"); }
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
    setEditForm({ id: emp.id, full_name: emp.full_name, department: emp.department, position: emp.position, phone: emp.phone || "" });
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

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const exportLeavesToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(leaves.map(l => ({
      ID: l.id, Karyawan: l.employee_name, Departemen: l.employee_department,
      "Tanggal Mulai": l.start_date?.slice(0, 10), "Tanggal Selesai": l.end_date?.slice(0, 10),
      "Total Hari": l.total_days, Alasan: l.reason, Status: l.status.toUpperCase(), "Catatan HRD": l.hrd_note || "-"
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Pengajuan Cuti");
    XLSX.writeFile(wb, "Data_Pengajuan_Cuti.xlsx");
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
  const T = { bg: "#f8fafc", sidebar: "white", cardBorder: "1px solid #e5e7eb", textDark: "#1f2937", textGray: "#64748b", textLight: "#94a3b8", primary: "#2563eb", red: "#ef4444", green: "#10b981", yellow: "#f59e0b" };
  const statusStyle = { pending: { bg: "#fef3c7", color: "#d97706", label: "Menunggu" }, approved: { bg: "#dcfce7", color: "#166534", label: "Disetujui" }, rejected: { bg: "#fee2e2", color: "#991b1b", label: "Ditolak" } };

  const MenuItem = ({ id, label, icon }) => (
    <div onClick={() => setActivePage(id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: activePage === id ? activeTabStyle.bg : "transparent", color: activePage === id ? activeTabStyle.text : T.textGray, fontWeight: activePage === id ? "600" : "500", fontSize: 14, transition: "background 0.2s", marginBottom: 4 }}>
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
          <MenuItem id="employees" label="Data Karyawan" icon="👥" />
          <MenuItem id="reports" label="Laporan Ekspor" icon="📊" />
        </div>

        {/* RINGKASAN PERUSAHAAN (Optional) */}
        <div style={{ padding: "0 20px", marginTop: 24 }}>
          <div onClick={() => setIsStatusOpen(!isStatusOpen)} style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 20px", border: T.cardBorder, cursor: "pointer", transition: "all 0.3s ease" }}>
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
           <Button disableRipple onPress={() => navigate("/hrd/employees/add")} style={{ background: T.primary, color: "white", fontWeight: "600", borderRadius: 8, height: 44, padding: "0 20px" }}>
             + Tambahkan Karyawan Baru
           </Button>
        </div>

        {activePage === "dashboard" && (
          <>
            {/* STATS KOTAK 4 KLASIK DENGAN DESAIN TALENTA */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 40 }}>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: T.cardBorder }}>
                 <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 12px 0", textTransform: "uppercase" }}>Menunggu Persetujuan</p>
                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <p style={{ fontSize: 32, fontWeight: "700", color: T.textDark, margin: 0 }}>{pending.length}</p>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⏳</div>
                 </div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: T.cardBorder }}>
                 <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 12px 0", textTransform: "uppercase" }}>Disetujui</p>
                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <p style={{ fontSize: 32, fontWeight: "700", color: T.textDark, margin: 0 }}>{approved.length}</p>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✓</div>
                 </div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: T.cardBorder }}>
                 <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 12px 0", textTransform: "uppercase" }}>Ditolak</p>
                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <p style={{ fontSize: 32, fontWeight: "700", color: T.textDark, margin: 0 }}>{rejected.length}</p>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✕</div>
                 </div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: T.cardBorder }}>
                 <p style={{ fontSize: 12, fontWeight: "600", color: T.textGray, margin: "0 0 12px 0", textTransform: "uppercase" }}>Total Karyawan</p>
                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <p style={{ fontSize: 32, fontWeight: "700", color: T.textDark, margin: 0 }}>{employees.length}</p>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👥</div>
                 </div>
              </div>
            </div>

            {/* TABEL PENGJUAN (Sama dengan tabel Pengajuan Cuti tapi di Dashboard) */}
            <div style={{ background: "white", borderRadius: 12, border: T.cardBorder }}>
              <div style={{ padding: "20px 24px", borderBottom: T.cardBorder }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Antrean Cuti Terbaru</h3>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Karyawan</th>
                    <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Jadwal Cuti</th>
                    <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Durasi</th>
                    <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(l => (
                     <tr key={l.id} style={{ borderBottom: T.cardBorder }}>
                       <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "500" }}>{l.employee_name}<br/><span style={{fontSize: 11, color: T.textLight}}>{l.employee_department}</span></td>
                       <td style={{ padding: "16px 24px", fontSize: 13, color: T.textGray }}>{l.start_date.slice(0,10)} - {l.end_date.slice(0,10)}</td>
                       <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, textAlign: "center", fontWeight: "600" }}>{l.total_days} Hari</td>
                       <td style={{ padding: "16px 24px", display: "flex", gap: 8, justifyContent: "center" }}>
                          <button onClick={() => openAction(l, "detail")} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12 }}>Detail</button>
                          <button onClick={() => openAction(l, "approved")} style={{ width: 32, height: 32, borderRadius: 6, background: T.textDark, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✓</button>
                          <button onClick={() => openAction(l, "rejected")} style={{ width: 32, height: 32, borderRadius: 6, background: T.red, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✕</button>
                       </td>
                     </tr>
                  ))}
                  {pending.length === 0 && <tr><td colSpan="4" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray }}>Tidak ada antrean cuti baru.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activePage === "leaves" && (
           <div style={{ background: "white", borderRadius: 12, border: T.cardBorder }}>
             <div style={{ padding: "20px 24px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Semua Pengajuan Cuti</h3>
               <Button size="sm" onClick={exportLeavesToExcel} style={{ background: "white", border: T.cardBorder, color: T.textDark, fontWeight: "600", borderRadius: 6 }}>Export (XLSX)</Button>
             </div>
             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
               <thead>
                 <tr>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Karyawan</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Jadwal Cuti</th>
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
                     </td>
                   </tr>
                 ))}
                 {leaves.length === 0 && <tr><td colSpan="4" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray }}>Belum ada data.</td></tr>}
               </tbody>
             </table>
           </div>
        )}

        {activePage === "employees" && (
           <div style={{ background: "white", borderRadius: 12, border: T.cardBorder }}>
             <div style={{ padding: "20px 24px", borderBottom: T.cardBorder }}>
               <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Data Karyawan Aktif</h3>
             </div>
             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
               <thead>
                 <tr>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Nama & Departemen</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Sisa Cuti</th>
                   <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Aksi</th>
                 </tr>
               </thead>
               <tbody>
                 {employees.map(emp => (
                   <tr key={emp.id} style={{ borderBottom: T.cardBorder }}>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: T.textDark, fontWeight: "500" }}>{emp.full_name}<br/><span style={{fontSize: 11, color: T.textGray}}>{emp.department} · {emp.position}</span></td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: T.primary, fontWeight: "700", textAlign: "center" }}>{emp.remaining_days} <span style={{fontSize: 10, color: T.textLight}}>HARI</span></td>
                      <td style={{ padding: "16px 24px", display: "flex", gap: 8, justifyContent: "center" }}>
                         <button onClick={(e) => { e.stopPropagation(); openDetail(emp); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12 }}>Detail</button>
                         <button onClick={(e) => { e.stopPropagation(); openEdit(emp); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.textDark, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12 }}>Edit</button>
                         <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id, emp.full_name); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.red, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>🗑️</button>
                      </td>
                   </tr>
                 ))}
                 {employees.length === 0 && <tr><td colSpan="3" style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.textGray }}>Tidak ada karyawan.</td></tr>}
               </tbody>
             </table>
           </div>
        )}

        {activePage === "reports" && (
           <div style={{ background: "white", borderRadius: 12, border: T.cardBorder }}>
             <div style={{ padding: "20px 24px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Analisis Rekapitulasi</h3>
               <Button size="sm" onClick={exportReportsToExcel} style={{ background: "white", border: T.cardBorder, color: T.textDark, fontWeight: "600", borderRadius: 6 }}>Export (XLSX)</Button>
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

      </div>

      {/* MODALS */}
      {modalOpen && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 440, maxWidth: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0 }}>
                  {actionType === "approved" ? "Setujui Pengajuan" : actionType === "rejected" ? "Tolak Pengajuan" : "Detail Pengajuan"}
                </h2>
                <button onClick={() => setModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, cursor: "pointer"}}>✕</button>
             </div>
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
             </div>
             {actionType !== "detail" && (
                <div style={{ marginBottom: 24 }}>
                   <label style={{ display: "block", fontSize: 12, fontWeight: "700", color: T.textGray, marginBottom: 8, textTransform: "uppercase" }}>Catatan Tambahan</label>
                   <textarea placeholder="Opsional" value={hrdNote} onChange={(e) => setHrdNote(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg, minHeight: 80, resize: "none" }} />
                </div>
             )}
             <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 32 }}>
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
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 440, maxWidth: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: "800", color: T.textDark, margin: 0 }}>Edit Karyawan</h2>
              <button onClick={() => setEditModalOpen(false)} style={{ background: T.bg, border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, cursor: "pointer"}}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div><p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Nama Lengkap</p><input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg }} /></div>
              <div><p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Departemen</p><input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg }} /></div>
              <div><p style={{ fontSize: 12, fontWeight: "700", color: T.textGray, margin: "0 0 8px 0", textTransform: "uppercase" }}>Posisi / Jabatan</p><input value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: T.cardBorder, outline: "none", color: T.textDark, background: T.bg }} /></div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 32 }}>
              <Button disableRipple onClick={() => setEditModalOpen(false)} style={{ flex: 1, background: "white", border: T.cardBorder, color: T.textGray, height: 48, borderRadius: 12, fontWeight: "600" }}>Batal</Button>
              <Button disableRipple onPress={handleEdit} style={{ flex: 1, background: T.primary, color: "white", height: 48, borderRadius: 12, fontWeight: "600" }}>Simpan Data</Button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && detailEmp && (
         <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
           <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 640, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
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
                   <div><p style={{ fontSize: 11, fontWeight: "700", color: T.textGray, margin: "0 0 4px 0", textTransform: "uppercase" }}>Sisa Cuti Tahunan</p><p style={{ fontSize: 14, fontWeight: "700", color: T.primary, margin: 0 }}>{detailEmp.remaining_days} Hari</p></div>
                </div>
             </div>
             <Button disableRipple onPress={() => setDetailModalOpen(false)} style={{ marginTop: 24, width: "100%", background: T.bg, color: T.textDark, fontWeight: "700", height: 48, borderRadius: 12 }}>Tutup Window</Button>
           </div>
         </div>
      )}

    </div>
  );
}