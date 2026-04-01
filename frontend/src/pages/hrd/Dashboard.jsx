import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea, Avatar, Divider } from "@heroui/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import { leaveApi } from "../../api/leaveApi";
import { employeeApi } from "../../api/employeeApi";
import { reportingApi } from "../../api/reportingApi";
import { getStr } from "../../lib/format";
import { STORAGE_KEYS } from "../../constants/storage";

export default function HrdDashboard() {
  // Existing States
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hrdNote, setHrdNote] = useState("");
  const [actionType, setActionType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  
  // Edit Employee States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", full_name: "", department: "", position: "", phone: "" });

  // Detail Employee States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailEmp, setDetailEmp] = useState(null);

  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const name = localStorage.getItem(STORAGE_KEYS.name) || "HRD Admin";

  // New Enterprise States
  const [stats, setStats] = useState({ total_employees: 0, pending_today: 0, total_approved: 0, total_rejected: 0, total_pending: 0 });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    if (activePage === "dashboard") {
      fetchDashboardStats();
    }
    fetchLeaves();
    fetchEmployees();
    if (activePage === "reports" || activePage === "master") {
      fetchMasterData();
      fetchReports();
    }
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
      const data = await leaveApi.getAdvancedForHR({
        status: filterStatus,
        department: filterDept,
      });
      setLeaves(data || []);
    } catch {
      setLeaves([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeApi.listForHR();
      setEmployees(data || []);
    } catch {
      setEmployees([]);
    }
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
      await leaveApi.updateStatusHR(selected.id, {
        status: actionType,
        hrd_note: hrdNote,
      });
      setModalOpen(false); fetchLeaves(); fetchDashboardStats(); fetchEmployees();
    } catch { alert("Gagal update status"); }
  };
  
  const handleDeleteEmployee = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus karyawan ${name}? Data pengajuan cutinya juga mungkin terhapus atau menjadi yatim.`)) {
      try {
        await employeeApi.deleteForHR(id);
        fetchEmployees();
        fetchDashboardStats();
      } catch (err) {
        alert("Gagal menghapus karyawan. Pastikan backend berjalan dengan baik.");
      }
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
      setEditModalOpen(false);
      fetchEmployees();
    } catch {
      alert("Gagal update karyawan");
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const exportLeavesToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(leaves.map(l => ({
      ID: l.id,
      Karyawan: l.employee_name,
      Departemen: l.employee_department,
      "Tanggal Mulai": l.start_date?.slice(0, 10),
      "Tanggal Selesai": l.end_date?.slice(0, 10),
      "Total Hari": l.total_days,
      Alasan: l.reason,
      Status: l.status.toUpperCase(),
      "Catatan HRD": l.hrd_note || "-"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pengajuan Cuti");
    XLSX.writeFile(wb, "Data_Pengajuan_Cuti.xlsx");
  };

  const exportReportsToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reports.map(r => ({
      Departemen: r.department.toUpperCase(),
      "Total Pengajuan Disetujui": r.total_leaves,
      "Total Hari Cuti": r.total_days
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Laporan");
    XLSX.writeFile(wb, "Laporan_Rekap_Departemen.xlsx");
  };

  const pending = leaves.filter(l => l.status === "pending");
  const approved = leaves.filter(l => l.status === "approved");
  const rejected = leaves.filter(l => l.status === "rejected");

  const statusBg = { pending: "#fef3c7", approved: "#dcfce7", rejected: "#fee2e2" };
  const statusColor = { pending: "#d97706", approved: "#166534", rejected: "#991b1b" };
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
          background: isActive ? mainBgColor : "transparent",
          color: isActive ? primaryColor : "#64748b",
          padding: "14px 20px",
          borderRadius: 12,
          display: "flex", alignItems: "center", gap: 14,
          cursor: "pointer",
          fontWeight: "600",
          transition: "all 0.2s",
          marginBottom: 4,
          marginRight: 20
        }}
        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = primaryColor; } }}
        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
        >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14 }}>{label}</span>
      </div>
    );
  };

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: mainBgColor, fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: 260, background: sidebarColor, display: "flex", flexDirection: "column", flexShrink: 0, paddingTop: 32, borderRight: "1px solid #e2e8f0" }}>
        <div style={{ padding: "0 24px", marginBottom: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: primaryColor, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
            <svg width="20" height="20" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
          </div>
          <h1 style={{ color: primaryColor, fontSize: 22, fontWeight: "800", margin: 0, letterSpacing: -0.5 }}>Appskep</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 20 }}>
          <MenuItem id="dashboard" label="Dashboard" icon="❖" />
          <MenuItem id="leaves" label="Pengajuan Cuti" icon="📑" />
          <MenuItem id="employees" label="Data Karyawan" icon="👥" />
          <MenuItem id="reports" label="Laporan & Ekspor" icon="📊" />
        </div>

        {/* RINGKASAN PERUSAHAAN COLLAPSIBLE */}
        <div style={{ padding: "0 24px", marginTop: 24 }}>
          <div 
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            style={{ 
              background: "#f8fafc", 
              borderRadius: 16, 
              padding: "16px 20px", 
              border: "1px solid #e2e8f0", 
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <p style={{ fontSize: 11, fontWeight: "700", color: "#475569", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Ringkasan Cuti 2026</p>
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8", transform: isStatusOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>▼</span>
            </div>

            {isStatusOpen && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f0", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                    <p style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase" }}>Admin / Nama</p>
                    <p style={{ fontSize: 13, fontWeight: "800", color: primaryColor, margin: 0 }}>{name}</p>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase" }}>Total Terpakai</p>
                    <p style={{ fontSize: 13, fontWeight: "800", color: primaryColor, margin: 0 }}>
                      {employees.reduce((acc, curr) => acc + (curr.used_days || 0), 0)} <span style={{ fontSize: 10 }}>HARI</span>
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", margin: "0 0 4px 0", textTransform: "uppercase" }}>Total Sisa</p>
                    <p style={{ fontSize: 13, fontWeight: "800", color: elegantAccent, margin: 0 }}>
                      {employees.reduce((acc, curr) => acc + (curr.remaining_days || 0), 0)} <span style={{ fontSize: 10 }}>HARI</span>
                    </p>
                  </div>
                </div>

                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ 
                    width: `${(employees.reduce((acc, curr) => acc + (curr.used_days || 0), 0) / (employees.reduce((acc, curr) => acc + (curr.remaining_days || 0), 0) + employees.reduce((acc, curr) => acc + (curr.used_days || 0), 0) || 1)) * 100}%`, 
                    height: "100%", 
                    background: elegantAccent, 
                    borderRadius: 3 
                  }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "700", color: primaryColor, margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "500", color: "#64748b", margin: 0 }}>Portal HRD</p>
            </div>
          </div>
          <Button disableRipple onPress={handleLogout} style={{ width: "100%", background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: "600", fontSize: 13, padding: "16px 0", borderRadius: 12, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background="#e2e8f0"; e.currentTarget.style.color=primaryColor; }} onMouseLeave={(e) => { e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.color="#64748b"; }}>
            KELUAR
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ padding: "32px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: "800", color: primaryColor, margin: "0 0 6px 0", letterSpacing: -0.5 }}>
              {activePage === "dashboard" ? "DASHBOARD" :
                activePage === "leaves" ? "PENGAJUAN CUTI" :
                  activePage === "reports" ? "LAPORAN & EKSPOR" :
                    "DATA KARYAWAN"}
            </h2>
            <p style={{ fontSize: 13, fontWeight: "600", color: "#64748b", margin: 0 }}>
              {activePage === "dashboard" ? `Selamat datang kembali, ${name}` :
                activePage === "leaves" ? `${leaves.length} pengajuan ditemukan` :
                  activePage === "reports" ? "Rekapitulasi cuti per departemen" :
                    `${employees.length} karyawan terdaftar`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {activePage === "employees" && (
              <Button disableRipple onPress={() => navigate("/hrd/employees/add")} style={{ background: primaryColor, color: "white", fontWeight: "600", fontSize: 13, borderRadius: 12, padding: "0 20px", height: 42, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                + Tambah Karyawan
              </Button>
            )}
            <div style={{ fontSize: 13, fontWeight: "600", color: "#64748b", background: "white", padding: "10px 16px", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              📅 &nbsp; {today}
            </div>
            <div style={{ width: 42, height: 42, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", cursor: "pointer", color: primaryColor, fontSize: 16, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={(e)=>e.currentTarget.style.background="white"}>
              🔔
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>

          {activePage === "dashboard" && (
            <div>
              {/* STATS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 24 }}>
                {[
                  { label: "TOTAL KARYAWAN", value: stats.total_employees },
                  { label: "PENDING HARI INI", value: stats.pending_today, c: "#d97706" },
                  { label: "TOTAL DISETUJUI", value: stats.total_approved, c: "#166534" },
                  { label: "TOTAL DITOLAK", value: stats.total_rejected, c: "#991b1b" },
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 12, fontWeight: "600", color: "#64748b", margin: "0 0 12px 0" }}>{stat.label}</p>
                    <p style={{ fontSize: 32, fontWeight: "800", color: stat.c || primaryColor, margin: 0 }}>{stat.value || 0}</p>
                  </div>
                ))}
              </div>

              {/* CHART */}
              <div style={{ background: "white", borderRadius: 20, padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: "800", color: primaryColor, margin: "0 0 24px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>Grafik Pengajuan (Disetujui) 6 Bulan Terakhir</h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 13, fill: "#64748b", fontWeight: "600" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 13, fill: "#64748b", fontWeight: "600" }} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: "600", fontSize: 13, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                      <Bar dataKey="total" fill={primaryColor} radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RECENT LEAVES (SAME AS BEFORE) */}
              <div style={{ background: "white", borderRadius: 20, padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: "800", color: primaryColor, margin: 0 }}>Pengajuan Terbaru</h3>
                  <button onClick={() => setActivePage("leaves")} style={{ fontSize: 13, fontWeight: "700", color: "#64748b", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.color=primaryColor} onMouseLeave={(e)=>e.currentTarget.style.color="#64748b"}>Lihat Semua &rarr;</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", padding: "0 20px 12px", borderBottom: "1px solid #e2e8f0", fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    <div style={{ width: 40 }}>No</div>
                    <div style={{ flex: 1 }}>Karyawan</div>
                    <div style={{ flex: 1 }}>Departemen</div>
                    <div style={{ flex: 1 }}>Periode</div>
                    <div style={{ width: 100 }}>Status</div>
                    <div style={{ width: 80, textAlign: "right" }}>Aksi</div>
                  </div>
                  {leaves.slice(0, 5).map((leave, i) => (
                    <div key={leave.id} style={{ display: "flex", alignItems: "center", padding: "16px 20px", background: mainBgColor, borderRadius: 14, border: "1px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = mainBgColor; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      <div style={{ width: 40, fontSize: 13, fontWeight: "700", color: "#94a3b8" }}>{i+1}</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: "700", color: primaryColor }}>{leave.employee_name}</span>
                      </div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: "500", color: primaryColor }}>{leave.employee_department}</div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: "600", color: primaryColor }}>{leave.start_date?.slice(0, 10)} &mdash; {leave.end_date?.slice(0, 10)}</div>
                      <div style={{ width: 100 }}>
                        <span style={{ fontSize: 11, fontWeight: "700", padding: "6px 12px", borderRadius: 20, background: statusBg[leave.status], color: statusColor[leave.status] }}>
                          {statusLabel[leave.status] || leave.status}
                        </span>
                      </div>
                      <div style={{ width: 80, display: "flex", justifyContent: "flex-end" }}>
                        {leave.status === "pending" ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={(e) => { e.stopPropagation(); openAction(leave, "approved"); }} style={{ width: 32, height: 32, borderRadius: 10, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 15, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#dcfce7"} onMouseLeave={(e)=>e.currentTarget.style.background="#f0fdf4"} title="Setujui">✓</button>
                            <button onClick={(e) => { e.stopPropagation(); openAction(leave, "rejected"); }} style={{ width: 32, height: 32, borderRadius: 10, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 15, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#fee2e2"} onMouseLeave={(e)=>e.currentTarget.style.background="#fef2f2"} title="Tolak">✕</button>
                          </div>
                        ) : <span style={{ color: "#94a3b8", fontWeight: "600", fontSize: 14 }}>&mdash;</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === "leaves" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              {/* FILTERS */}
              <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: "600", outline: "none", cursor: "pointer", background: "#f8fafc", color: primaryColor, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.borderColor=primaryColor} onMouseLeave={(e)=>e.currentTarget.style.borderColor="#e2e8f0"}>
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: "600", outline: "none", cursor: "pointer", background: "#f8fafc", color: primaryColor, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.borderColor=primaryColor} onMouseLeave={(e)=>e.currentTarget.style.borderColor="#e2e8f0"}>
                  <option value="">Semua Departemen</option>
                  <option value="HRD">HRD</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                </select>
                <Button disableRipple onPress={exportLeavesToExcel} style={{ background: "#f0fdf4", color: "#166534", fontWeight: "700", fontSize: 13, borderRadius: 12, padding: "0 20px", marginLeft: "auto", border: "1px solid #bbf7d0", height: 42, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#dcfce7"} onMouseLeave={(e)=>e.currentTarget.style.background="#f0fdf4"}>
                  📥 Ekspor ke Excel
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", padding: "0 20px 12px", borderBottom: "1px solid #e2e8f0", fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  <div style={{ width: 40 }}>No</div>
                  <div style={{ flex: 1 }}>Karyawan</div>
                  <div style={{ flex: 1 }}>Alasan</div>
                  <div style={{ flex: 1 }}>Periode</div>
                  <div style={{ width: 100 }}>Status</div>
                  <div style={{ width: 180, textAlign: "right" }}>Aksi</div>
                </div>
                {leaves.map((leave, i) => (
                  <div key={leave.id} style={{ display: "flex", alignItems: "center", padding: "16px 20px", background: mainBgColor, borderRadius: 14, border: "1px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = mainBgColor; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ width: 40, fontSize: 13, fontWeight: "700", color: "#94a3b8" }}>{i+1}</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: "700", color: primaryColor }}>{leave.employee_name}</span>
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: "500", color: primaryColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 16 }}>{leave.reason}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: "600", color: primaryColor }}>{leave.start_date?.slice(0, 10)} &mdash; {leave.end_date?.slice(0, 10)}</div>
                    <div style={{ width: 100 }}>
                      <span style={{ fontSize: 11, fontWeight: "700", padding: "6px 12px", borderRadius: 20, background: statusBg[leave.status], color: statusColor[leave.status] }}>
                        {statusLabel[leave.status] || leave.status}
                      </span>
                    </div>
                    <div style={{ width: 180, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      {leave.status === "pending" ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); openAction(leave, "detail"); }} style={{ padding: "0 12px", height: 32, borderRadius: 10, background: "#f1f5f9", color: primaryColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#e2e8f0"} onMouseLeave={(e)=>e.currentTarget.style.background="#f1f5f9"} title="Detail">Detail</button>
                          <button onClick={(e) => { e.stopPropagation(); openAction(leave, "approved"); }} style={{ width: 32, height: 32, borderRadius: 10, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 15, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#dcfce7"} onMouseLeave={(e)=>e.currentTarget.style.background="#f0fdf4"} title="Setujui">✓</button>
                          <button onClick={(e) => { e.stopPropagation(); openAction(leave, "rejected"); }} style={{ width: 32, height: 32, borderRadius: 10, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 15, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#fee2e2"} onMouseLeave={(e)=>e.currentTarget.style.background="#fef2f2"} title="Tolak">✕</button>
                        </>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); openAction(leave, "detail"); }} style={{ padding: "0 12px", height: 32, borderRadius: 10, background: "#f1f5f9", color: primaryColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#e2e8f0"} onMouseLeave={(e)=>e.currentTarget.style.background="#f1f5f9"} title="Detail">Detail</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePage === "reports" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: "800", color: primaryColor, margin: 0 }}>Rekap Cuti Departemen</h3>
                <Button disableRipple onPress={exportReportsToExcel} style={{ background: "#e0e7ff", color: "#3730a3", fontWeight: "700", fontSize: 13, borderRadius: 12, padding: "0 20px", border: "none", height: 42, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#c7d2fe"} onMouseLeave={(e)=>e.currentTarget.style.background="#e0e7ff"}>
                  📥 Download Data (Excel)
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", padding: "0 20px 12px", borderBottom: "1px solid #e2e8f0", fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  <div style={{ flex: 2 }}>Departemen</div>
                  <div style={{ flex: 1, textAlign: "center" }}>Total Pengajuan (ACC)</div>
                  <div style={{ flex: 1, textAlign: "right" }}>Total Durasi Cuti</div>
                </div>
                {reports.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "16px 20px", background: mainBgColor, borderRadius: 14, border: "1px solid transparent" }}>
                    <div style={{ flex: 2, fontSize: 14, fontWeight: "700", color: primaryColor }}>{r.department}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: "600", color: primaryColor, textAlign: "center" }}>{r.total_leaves} Transaksi</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: "600", color: primaryColor, textAlign: "right" }}>{r.total_days} Hari</div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {activePage === "employees" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", padding: "0 20px 12px", borderBottom: "1px solid #e2e8f0", fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  <div style={{ width: 40 }}>No</div>
                  <div style={{ flex: 1.5 }}>Karyawan</div>
                  <div style={{ flex: 1 }}>Departemen</div>
                  <div style={{ width: 100, textAlign: "center" }}>TERPAKAI</div>
                  <div style={{ width: 100, textAlign: "center" }}>SISA CUTI</div>
                  <div style={{ width: 230, textAlign: "right" }}>Aksi</div>
                </div>
                {employees.map((emp, i) => (
                  <div key={emp.id} style={{ display: "flex", alignItems: "center", padding: "16px 20px", background: mainBgColor, borderRadius: 14, border: "1px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = mainBgColor; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ width: 40, fontSize: 13, fontWeight: "700", color: "#94a3b8" }}>{i+1}</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: "700", color: primaryColor }}>{emp.full_name}</span>
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: "500", color: primaryColor }}>{emp.department}</div>
                    <div style={{ width: 100, textAlign: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: "700", color: "#64748b" }}>{emp.used_days} <span style={{ fontSize: 10 }}>HARI</span></span>
                    </div>
                    <div style={{ width: 100, textAlign: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: "800", color: elegantAccent }}>{emp.remaining_days} <span style={{ fontSize: 10, fontWeight: "600", color: "#64748b" }}>HARI</span></span>
                    </div>
                    <div style={{ width: 230, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button onClick={(e) => { e.stopPropagation(); openDetail(emp); }} style={{ padding: "0 12px", height: 32, borderRadius: 10, background: "#f1f5f9", color: primaryColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#e2e8f0"} onMouseLeave={(e)=>e.currentTarget.style.background="#f1f5f9"} title="Detail">Detail</button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(emp); }} style={{ padding: "0 12px", height: 32, borderRadius: 10, background: primaryColor, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#334155"} onMouseLeave={(e)=>e.currentTarget.style.background=primaryColor} title="Edit">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id, emp.full_name); }} style={{ width: 32, height: 32, borderRadius: 10, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 12, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#fee2e2"} onMouseLeave={(e)=>e.currentTarget.style.background="#fef2f2"} title="Hapus">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ACTION VIEW */}
      {modalOpen && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 440, maxWidth: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: "800", color: primaryColor, margin: 0 }}>
                {actionType === "approved" ? "Setujui Pengajuan" : actionType === "rejected" ? "Tolak Pengajuan" : "Detail Pengajuan"}
              </h2>
              {actionType === "detail" && (
                <button onClick={() => setModalOpen(false)} style={{ background: "#f1f5f9", border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, color: primaryColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#e2e8f0"} onMouseLeave={(e)=>e.currentTarget.style.background="#f1f5f9"}>✕</button>
              )}
            </div>
            
            <div style={{ background: mainBgColor, borderRadius: 16, padding: "20px", marginBottom: 24, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: "800", color: primaryColor, margin: 0 }}>{selected.employee_name}</p>
                  <p style={{ fontSize: 13, fontWeight: "600", color: "#64748b", margin: "4px 0 0 0" }}>{selected.employee_department?.toUpperCase()} · {selected.employee_position?.toUpperCase()}</p>
                </div>
              </div>
              <Divider style={{ margin: "16px 0", background: "#e2e8f0", height: 1 }} />
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Alasan Cuti</p>
                <p style={{ fontSize: 14, fontWeight: "600", color: primaryColor, margin: 0 }}>{selected.reason}</p>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Periode</p>
                  <p style={{ fontSize: 14, fontWeight: "600", color: primaryColor, margin: 0 }}>{selected.start_date?.slice(0, 10)} — {selected.end_date?.slice(0, 10)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Durasi</p>
                  <p style={{ fontSize: 14, fontWeight: "600", color: primaryColor, margin: 0 }}>{selected.total_days} Hari</p>
                </div>
              </div>
            </div>

            {actionType !== "detail" ? (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>Catatan HRD</label>
                <textarea
                  placeholder="Catatan untuk karyawan (opsional)"
                  value={hrdNote}
                  onChange={(e) => setHrdNote(e.target.value)}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: "500", outline: "none", color: primaryColor, background: "#f8fafc", minHeight: 100, resize: "none" }}
                />
              </div>
            ) : (
                <div style={{ background: selected.status === "rejected" ? "#fef2f2" : "#f8fafc", borderRadius: 16, padding: "20px", border: selected.status === "rejected" ? "1px solid #fca5a5" : "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: 11, fontWeight: "700", color: selected.status === "rejected" ? "#dc2626" : "#64748b", margin: "0 0 8px 0", textTransform: "uppercase" }}>Catatan dari HRD</p>
                  <p style={{ fontSize: 14, fontWeight: "600", color: selected.status === "rejected" ? "#991b1b" : primaryColor, margin: 0, fontStyle: selected.hrd_note ? "normal" : "italic", opacity: selected.hrd_note ? 1 : 0.6 }}>
                    {selected.hrd_note || "Belum ada catatan."}
                  </p>
                </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 32 }}>
              {actionType !== "detail" ? (
                <>
                  <Button disableRipple variant="bordered" onPress={() => setModalOpen(false)} style={{ fontSize: 13, fontWeight: "700", borderRadius: 12, border: "1px solid #e2e8f0", color: "#64748b", padding: "0 20px", height: 44, width: "100%", flex: 1 }}>Batal</Button>
                  <Button disableRipple onPress={handleAction} style={{ background: actionType === "approved" ? "#16a34a" : "#dc2626", border: "none", fontWeight: "700", fontSize: 13, color: "white", borderRadius: 12, padding: "0 20px", height: 44, flex: 1 }}>
                    {actionType === "approved" ? "Setujui" : "Tolak"}
                  </Button>
                </>
              ) : (
                  <Button disableRipple onPress={() => setModalOpen(false)} style={{ flex: 1, width: "100%", background: "#f1f5f9", color: primaryColor, fontWeight: "700", fontSize: 13, borderRadius: 12, height: 44, border: "none" }}>
                    Tutup
                  </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL EDIT KARYAWAN */}
      {editModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 440, maxWidth: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: "800", color: primaryColor, margin: 0 }}>Edit Karyawan</h2>
              <button onClick={() => setEditModalOpen(false)} style={{ background: "#f1f5f9", border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, color: primaryColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#e2e8f0"} onMouseLeave={(e)=>e.currentTarget.style.background="#f1f5f9"}>✕</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: "700", color: "#64748b", margin: "0 0 8px 0", textTransform: "uppercase" }}>Nama Lengkap</p>
                <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: "600", outline: "none", fontSize: 13, background: "#f8fafc", color: primaryColor }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: "700", color: "#64748b", margin: "0 0 8px 0", textTransform: "uppercase" }}>Departemen</p>
                <input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: "600", outline: "none", fontSize: 13, background: "#f8fafc", color: primaryColor }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: "700", color: "#64748b", margin: "0 0 8px 0", textTransform: "uppercase" }}>Jabatan</p>
                <input value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: "600", outline: "none", fontSize: 13, background: "#f8fafc", color: primaryColor }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: "700", color: "#64748b", margin: "0 0 8px 0", textTransform: "uppercase" }}>Nomor HP</p>
                <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: "600", outline: "none", fontSize: 13, background: "#f8fafc", color: primaryColor }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 32 }}>
              <Button disableRipple onClick={() => setEditModalOpen(false)} style={{ flex: 1, background: "white", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: "700", borderRadius: 12, height: 48 }}>Batal</Button>
              <Button disableRipple onPress={handleEdit} style={{ flex: 1, background: primaryColor, border: "none", fontWeight: "700", fontSize: 13, color: "white", borderRadius: 12, height: 48 }}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL KARYAWAN & RIWAYAT CUTI */}
      {detailModalOpen && detailEmp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 640, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: "800", color: primaryColor, margin: 0 }}>Profil Karyawan</h2>
                <p style={{ fontSize: 13, fontWeight: "600", color: "#64748b", margin: "4px 0 0 0" }}>ID Karyawan: #{detailEmp.id}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: "#f1f5f9", border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, color: primaryColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#e2e8f0"} onMouseLeave={(e)=>e.currentTarget.style.background="#f1f5f9"}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: 10 }}>
              {/* Profil Info */}
              <div style={{ background: mainBgColor, borderRadius: 16, padding: "20px", marginBottom: 32, border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Nama Lengkap</p>
                  <p style={{ fontSize: 14, fontWeight: "700", color: primaryColor, margin: 0 }}>{detailEmp.full_name}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Nomor HP</p>
                  <p style={{ fontSize: 14, fontWeight: "700", color: primaryColor, margin: 0 }}>{detailEmp.phone || "-"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Departemen</p>
                  <p style={{ fontSize: 14, fontWeight: "700", color: primaryColor, margin: 0, textTransform: "uppercase" }}>{detailEmp.department}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "700", color: "#64748b", margin: "0 0 6px 0", textTransform: "uppercase" }}>Jabatan</p>
                  <p style={{ fontSize: 14, fontWeight: "700", color: primaryColor, margin: 0, textTransform: "uppercase" }}>{detailEmp.position}</p>
                </div>
              </div>

              {/* Riwayat Cuti */}
              <h3 style={{ fontSize: 16, fontWeight: "800", color: primaryColor, margin: "0 0 16px 0" }}>RIWAYAT PENGAJUAN CUTI</h3>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "flex", padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  <div style={{ flex: 2 }}>Periode</div>
                  <div style={{ flex: 1 }}>Durasi</div>
                  <div style={{ flex: 1, textAlign: "right" }}>Status</div>
                </div>
                {leaves.filter(l => l.employee_id === detailEmp.id).length === 0 ? (
                  <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 14, fontWeight: "600", color: "#94a3b8" }}>
                    Belum ada riwayat cuti.
                  </div>
                ) : (
                  leaves.filter(l => l.employee_id === detailEmp.id).map(l => (
                    <div key={l.id} style={{ display: "flex", padding: "16px 20px", borderBottom: "1px solid #e2e8f0", fontSize: 13, fontWeight: "600", color: primaryColor, alignItems: "center", background: "white" }}>
                      <div style={{ flex: 2 }}>{l.start_date?.slice(0, 10)} — {l.end_date?.slice(0, 10)}</div>
                      <div style={{ flex: 1 }}>{l.total_days} Hari</div>
                      <div style={{ flex: 1, textAlign: "right" }}>
                        <span style={{ fontSize: 11, fontWeight: "700", padding: "6px 12px", borderRadius: 20, background: statusBg[l.status], color: statusColor[l.status] }}>
                          {statusLabel[l.status] || l.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div style={{ marginTop: 32 }}>
              <Button disableRipple onPress={() => setDetailModalOpen(false)} style={{ width: "100%", background: "#f1f5f9", color: primaryColor, fontWeight: "700", fontSize: 13, borderRadius: 12, height: 48, border: "none" }}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}