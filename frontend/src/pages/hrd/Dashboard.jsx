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
      setModalOpen(false); fetchLeaves(); fetchDashboardStats();
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

        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 20 }}>
          <MenuItem id="dashboard" label="Dashboard" icon="❖" />
          <MenuItem id="leaves" label="Pengajuan Cuti" icon="📑" />
          <MenuItem id="employees" label="Data Karyawan" icon="👥" />
          <MenuItem id="reports" label="Laporan & Ekspor" icon="📊" />

        </div>

        <div style={{ marginTop: "auto", padding: "24px", borderTop: "2px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: "bold", color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "white", margin: 0, opacity: 0.9 }}>Portal HRD</p>
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
              {activePage === "dashboard" ? "DASHBOARD" :
                activePage === "leaves" ? "PENGAJUAN CUTI" :
                  activePage === "reports" ? "LAPORAN & EKSPOR" :
                    "DATA KARYAWAN"}
            </h2>
            <p style={{ fontSize: 13, fontWeight: "bold", color: "#000000", margin: 0 }}>
              {activePage === "dashboard" ? `SELAMAT DATANG KEMBALI, ${name.toUpperCase()}` :
                activePage === "leaves" ? `${leaves.length} PENGAJUAN DITEMUKAN` :
                  activePage === "reports" ? "REKAPITULASI CUTI PER DEPARTEMEN" :
                    `${employees.length} KARYAWAN TERDAFTAR`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {activePage === "employees" && (
              <Button disableRipple onPress={() => navigate("/hrd/employees/add")} style={{ background: "#000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 20, padding: "0 16px", height: 38 }}>
                + TAMBAH KARYAWAN
              </Button>
            )}
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#000000", background: "white", padding: "10px 16px", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              📅 &nbsp; {today.toUpperCase()}
            </div>
            <div style={{ width: 40, height: 40, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", cursor: "pointer", color: "#000", fontSize: 16 }}>
              🔔
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, padding: "0 40px 40px", overflowX: "hidden", overflowY: "auto" }}>

          {activePage === "dashboard" && (
            <div>
              {/* STATS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
                {[
                  { label: "TOTAL KARYAWAN", value: stats.total_employees },
                  { label: "PENDING HARI INI", value: stats.pending_today, c: "#f59e0b" },
                  { label: "TOTAL DISETUJUI", value: stats.total_approved, c: "#10b981" },
                  { label: "TOTAL DITOLAK", value: stats.total_rejected, c: "#ef4444" },
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: "white", borderRadius: 16, padding: "20px", border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                    <p style={{ fontSize: 12, fontWeight: "bold", color: "#000", margin: "0 0 10px 0" }}>{stat.label}</p>
                    <p style={{ fontSize: 32, fontWeight: "bold", color: stat.c || "#000", margin: 0 }}>{stat.value || 0}</p>
                  </div>
                ))}
              </div>

              {/* CHART */}
              <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: "bold", color: "#000", margin: "0 0 20px 0" }}>GRAFIK PENGAJUAN (DISETUJUI) 6 BULAN TERAKHIR</h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: "bold", fill: "#000" }} />
                      <YAxis tick={{ fontSize: 12, fontWeight: "bold", fill: "#000" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid #000", fontWeight: "bold", fontSize: 12 }} />
                      <Bar dataKey="total" fill="#1a73e8" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RECENT LEAVES (SAME AS BEFORE) */}
              <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: "bold", color: "#000", margin: 0 }}>PENGAJUAN TERBARU</h3>
                  <button onClick={() => setActivePage("leaves")} style={{ fontSize: 13, fontWeight: "bold", color: "#000", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>LIHAT SEMUA</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", padding: "0 16px 10px", borderBottom: "2px solid #000", fontSize: 12, fontWeight: "bold", color: "#000" }}>
                    <div style={{ width: 40 }}>NO</div>
                    <div style={{ flex: 1 }}>KARYAWAN</div>
                    <div style={{ flex: 1 }}>DEPARTEMEN</div>
                    <div style={{ flex: 1 }}>PERIODE</div>
                    <div style={{ width: 100 }}>STATUS</div>
                    <div style={{ width: 80, textAlign: "right" }}>AKSI</div>
                  </div>
                  {leaves.slice(0, 5).map((leave, i) => (
                    <div key={leave.id} style={{ display: "flex", alignItems: "center", padding: "14px 16px", background: mainBgColor, borderRadius: 14, border: "2px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ width: 40, fontSize: 13, fontWeight: "bold", color: "#000" }}>#{leave.id}</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: "bold", color: "#000" }}>{leave.employee_name}</span>
                      </div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000", textTransform: "uppercase" }}>{leave.employee_department}</div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000" }}>{leave.start_date?.slice(0, 10)} &mdash; {leave.end_date?.slice(0, 10)}</div>
                      <div style={{ width: 100 }}>
                        <span style={{ fontSize: 11, fontWeight: "bold", padding: "6px 12px", borderRadius: 16, background: statusBg[leave.status], border: "2px solid #000", color: "#000" }}>
                          {statusLabel[leave.status]?.toUpperCase() || leave.status}
                        </span>
                      </div>
                      <div style={{ width: 80, display: "flex", justifyContent: "flex-end" }}>
                        {leave.status === "pending" ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={(e) => { e.stopPropagation(); openAction(leave, "approved"); }} style={{ width: 30, height: 30, borderRadius: 8, background: "#10b981", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✓</button>
                            <button onClick={(e) => { e.stopPropagation(); openAction(leave, "rejected"); }} style={{ width: 30, height: 30, borderRadius: 8, background: "#ef4444", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✕</button>
                          </div>
                        ) : <span style={{ color: "#000", fontWeight: "bold", fontSize: 14 }}>&mdash;</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === "leaves" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              {/* FILTERS */}
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "10px 16px", borderRadius: 12, border: "2px solid #000", fontSize: 12, fontWeight: "bold", outline: "none", cursor: "pointer", background: mainBgColor }}>
                  <option value="">SEMUA STATUS</option>
                  <option value="pending">PENDING</option>
                  <option value="approved">DISETUJUI</option>
                  <option value="rejected">DITOLAK</option>
                </select>
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={{ padding: "10px 16px", borderRadius: 12, border: "2px solid #000", fontSize: 12, fontWeight: "bold", outline: "none", cursor: "pointer", background: mainBgColor }}>
                  <option value="">SEMUA DEPARTEMEN</option>
                  <option value="HRD">HRD</option>
                  <option value="IT">IT</option>
                  <option value="Finance">FINANCE</option>
                  <option value="Marketing">MARKETING</option>
                </select>
                <Button disableRipple onPress={exportLeavesToExcel} style={{ background: "#10b981", color: "white", fontWeight: "bold", fontSize: 12, borderRadius: 12, padding: "0 16px", marginLeft: "auto", border: "2px solid #000" }}>
                  📥 EXPORT KE EXCEL
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", padding: "0 16px 10px", borderBottom: "2px solid #000", fontSize: 12, fontWeight: "bold", color: "#000" }}>
                  <div style={{ width: 40 }}>NO</div>
                  <div style={{ flex: 1 }}>KARYAWAN</div>
                  <div style={{ flex: 1 }}>ALASAN</div>
                  <div style={{ flex: 1 }}>PERIODE</div>
                  <div style={{ width: 100 }}>STATUS</div>
                  <div style={{ width: 230, textAlign: "right" }}>AKSI</div>
                </div>
                {leaves.map((leave, i) => (
                  <div key={leave.id} style={{ display: "flex", alignItems: "center", padding: "14px 16px", background: mainBgColor, borderRadius: 14, border: "2px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ width: 40, fontSize: 13, fontWeight: "bold", color: "#000" }}>#{leave.id}</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: "bold", color: "#000" }}>{leave.employee_name}</span>
                    </div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 16 }}>{leave.reason.toUpperCase()}</div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000" }}>{leave.start_date?.slice(0, 10)} &mdash; {leave.end_date?.slice(0, 10)}</div>
                    <div style={{ width: 100 }}>
                      <span style={{ fontSize: 11, fontWeight: "bold", padding: "6px 12px", borderRadius: 16, background: statusBg[leave.status], border: "2px solid #000", color: "#000" }}>
                        {statusLabel[leave.status]?.toUpperCase() || leave.status}
                      </span>
                    </div>
                    <div style={{ width: 230, display: "flex", justifyContent: "flex-end", gap: 6 }}>
                      {leave.status === "pending" ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); openAction(leave, "detail"); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#f59e0b", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }}>DETAIL</button>
                          <button onClick={(e) => { e.stopPropagation(); openAction(leave, "approved"); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#10b981", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }}>SETUJUI</button>
                          <button onClick={(e) => { e.stopPropagation(); openAction(leave, "rejected"); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#ef4444", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }}>TOLAK</button>
                        </>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); openAction(leave, "detail"); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#f59e0b", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }}>DETAIL</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePage === "reports" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: "bold", color: "#000", margin: 0 }}>REKAP CUTI DEPARTEMEN</h3>
                <Button disableRipple onPress={exportReportsToExcel} style={{ background: "#2563eb", color: "white", fontWeight: "bold", fontSize: 12, borderRadius: 12, padding: "0 16px", border: "2px solid #000" }}>
                  📥 DOWNLOAD PDF / EXCEL
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", padding: "0 16px 10px", borderBottom: "2px solid #000", fontSize: 12, fontWeight: "bold", color: "#000" }}>
                  <div style={{ flex: 2 }}>DEPARTEMEN</div>
                  <div style={{ flex: 1, textAlign: "center" }}>TOTAL PENGAJUAN (ACC)</div>
                  <div style={{ flex: 1, textAlign: "right" }}>TOTAL DURASI CUTI</div>
                </div>
                {reports.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "14px 16px", background: mainBgColor, borderRadius: 14, border: "2px solid transparent" }}>
                    <div style={{ flex: 2, fontSize: 13, fontWeight: "bold", color: "#000", textTransform: "uppercase" }}>{r.department}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: "bold", color: "#000", textAlign: "center" }}>{r.total_leaves} DATA TRANSAKSI</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: "bold", color: "#000", textAlign: "right" }}>{r.total_days} HARI TOTAL</div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {activePage === "employees" && (
            <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", padding: "0 16px 10px", borderBottom: "2px solid #000", fontSize: 12, fontWeight: "bold", color: "#000" }}>
                  <div style={{ width: 40 }}>NO</div>
                  <div style={{ flex: 1 }}>KARYAWAN</div>
                  <div style={{ flex: 1 }}>DEPARTEMEN</div>
                  <div style={{ flex: 1 }}>JABATAN</div>
                  <div style={{ width: 100 }}>STATUS</div>
                  <div style={{ width: 80, textAlign: "right" }}>AKSI</div>
                </div>
                {employees.map((emp, i) => (
                  <div key={emp.id} style={{ display: "flex", alignItems: "center", padding: "14px 16px", background: mainBgColor, borderRadius: 14, border: "2px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ width: 40, fontSize: 13, fontWeight: "bold", color: "#000" }}>#{emp.id}</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: "bold", color: "#000" }}>{emp.full_name}</span>
                    </div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000", textTransform: "uppercase" }}>{emp.department}</div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: "#000", textTransform: "uppercase" }}>{emp.position}</div>
                    <div style={{ width: 100 }}>
                      <span style={{ fontSize: 11, fontWeight: "bold", padding: "6px 12px", borderRadius: 16, background: "#f0fdf4", border: "2px solid #000", color: "#000" }}>AKTIF</span>
                    </div>
                    <div style={{ width: 200, display: "flex", justifyContent: "flex-end", gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); openDetail(emp); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#f59e0b", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }}>DETAIL</button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(emp); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#1a73e8", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }}>EDIT</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id, emp.full_name); }} style={{ padding: "0 10px", height: 30, borderRadius: 8, background: "#ef4444", color: "white", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }}>HAPUS</button>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, border: "3px solid #000", padding: 32, width: 420, maxWidth: "90vw", boxShadow: `8px 8px 0 0 ${sidebarColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: "bold", color: "#000", margin: 0 }}>
                {actionType === "approved" ? "SETUJUI PENGAJUAN" : actionType === "rejected" ? "TOLAK PENGAJUAN" : "DETAIL PENGAJUAN"}
              </h2>
              {actionType === "detail" && (
                <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 20, fontWeight: "bold", cursor: "pointer", margin: "-4px -8px 0 0" }}>✕</button>
              )}
            </div>
            
            <div style={{ background: mainBgColor, borderRadius: 16, padding: "16px", marginBottom: 20, border: "2px solid #000" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: "bold", color: "#000", margin: 0 }}>{selected.employee_name}</p>
                  <p style={{ fontSize: 13, fontWeight: "bold", color: "#000", margin: "4px 0 0 0" }}>{selected.employee_department?.toUpperCase()} · {selected.employee_position?.toUpperCase()}</p>
                </div>
              </div>
              <Divider style={{ margin: "12px 0", background: "#000", height: 2 }} />
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: "bold", color: "#000", margin: "0 0 4px 0" }}>ALASAN CUTI</p>
                <p style={{ fontSize: 13, fontWeight: "bold", color: "#000", margin: 0 }}>{selected.reason}</p>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: "#000", margin: "0 0 4px 0" }}>PERIODE</p>
                  <p style={{ fontSize: 13, fontWeight: "bold", color: "#000", margin: 0 }}>{selected.start_date?.slice(0, 10)} — {selected.end_date?.slice(0, 10)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: "#000", margin: "0 0 4px 0" }}>DURASI</p>
                  <p style={{ fontSize: 13, fontWeight: "bold", color: "#000", margin: 0 }}>{selected.total_days} HARI</p>
                </div>
              </div>
            </div>

            {actionType !== "detail" ? (
              <Textarea
                label="CATATAN HRD"
                placeholder="Catatan untuk karyawan (opsional)"
                value={hrdNote}
                onValueChange={setHrdNote}
                variant="bordered"
                minRows={3}
                classNames={{ label: "text-xs font-bold text-black", inputWrapper: "border-black border-2 rounded-xl" }}
              />
            ) : (
                <div style={{ background: selected.status === "rejected" ? "#fef2f2" : "#f8fafc", borderRadius: 16, padding: "16px", border: "2px solid #000" }}>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: selected.status === "rejected" ? "#dc2626" : "#000", margin: "0 0 8px 0" }}>CATATAN DARI HRD</p>
                  <p style={{ fontSize: 13, fontWeight: "bold", color: "#000", margin: 0, fontStyle: selected.hrd_note ? "normal" : "italic", opacity: selected.hrd_note ? 1 : 0.6 }}>
                    {selected.hrd_note || "Belum ada catatan."}
                  </p>
                </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              {actionType !== "detail" ? (
                <>
                  <Button disableRipple variant="bordered" onPress={() => setModalOpen(false)} style={{ fontSize: 13, fontWeight: "bold", borderRadius: 10, border: "2px solid #000", color: "#000", padding: "0 20px", height: 40 }}>BATAL</Button>
                  <Button disableRipple onPress={handleAction} style={{ background: actionType === "approved" ? "#10b981" : "#ef4444", border: "2px solid #000", fontWeight: "bold", fontSize: 13, color: "white", borderRadius: 10, padding: "0 20px", height: 40 }}>
                    {actionType === "approved" ? "SETUJUI" : "TOLAK"}
                  </Button>
                </>
              ) : (
                  <Button disableRipple onPress={() => setModalOpen(false)} style={{ background: "#000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, height: 40, padding: "0 20px" }}>
                    TUTUP
                  </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL EDIT KARYAWAN */}
      {editModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, border: "3px solid #000", padding: 32, width: 420, maxWidth: "90vw", boxShadow: `8px 8px 0 0 ${sidebarColor}` }}>
            <h2 style={{ fontSize: 18, fontWeight: "bold", color: "#000", margin: "0 0 20px 0" }}>EDIT KARYAWAN</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#000", margin: "0 0 6px 0" }}>NAMA LENGKAP</p>
                <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", outline: "none", fontSize: 13 }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#000", margin: "0 0 6px 0" }}>DEPARTEMEN</p>
                <input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", outline: "none", fontSize: 13 }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#000", margin: "0 0 6px 0" }}>JABATAN</p>
                <input value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", outline: "none", fontSize: 13 }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#000", margin: "0 0 6px 0" }}>NOMOR HP</p>
                <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "2px solid #000", fontWeight: "bold", outline: "none", fontSize: 13 }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <Button disableRipple variant="bordered" onPress={() => setEditModalOpen(false)} style={{ fontSize: 13, fontWeight: "bold", borderRadius: 10, border: "2px solid #000", color: "#000", padding: "0 20px", height: 40 }}>BATAL</Button>
              <Button disableRipple onPress={handleEdit} style={{ background: "#10b981", border: "2px solid #000", fontWeight: "bold", fontSize: 13, color: "white", borderRadius: 10, padding: "0 20px", height: 40 }}>
                SIMPAN
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL KARYAWAN & RIWAYAT CUTI */}
      {detailModalOpen && detailEmp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, border: "3px solid #000", padding: "32px", width: 640, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: `8px 8px 0 0 ${sidebarColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: "bold", color: "#000", margin: 0 }}>PROFIL KARYAWAN</h2>
                <p style={{ fontSize: 13, fontWeight: "bold", color: "#64748b", margin: "4px 0 0 0" }}>ID Karyawan: #{detailEmp.id}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 20, fontWeight: "bold", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: 10 }}>
              {/* Profil Info */}
              <div style={{ background: mainBgColor, borderRadius: 16, padding: "20px", marginBottom: 24, border: "2px solid #000", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", margin: "0 0 4px 0" }}>NAMA LENGKAP</p>
                  <p style={{ fontSize: 14, fontWeight: "bold", color: "#000", margin: 0 }}>{detailEmp.full_name}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", margin: "0 0 4px 0" }}>NOMOR HP</p>
                  <p style={{ fontSize: 14, fontWeight: "bold", color: "#000", margin: 0 }}>{detailEmp.phone || "-"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", margin: "0 0 4px 0" }}>DEPARTEMEN</p>
                  <p style={{ fontSize: 14, fontWeight: "bold", color: "#000", margin: 0, textTransform: "uppercase" }}>{detailEmp.department}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", margin: "0 0 4px 0" }}>JABATAN</p>
                  <p style={{ fontSize: 14, fontWeight: "bold", color: "#000", margin: 0, textTransform: "uppercase" }}>{detailEmp.position}</p>
                </div>
              </div>

              {/* Riwayat Cuti */}
              <h3 style={{ fontSize: 16, fontWeight: "bold", color: "#000", margin: "0 0 12px 0" }}>RIWAYAT PENGAJUAN CUTI</h3>
              <div style={{ border: "2px solid #000", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", padding: "12px 16px", background: "#f8fafc", borderBottom: "2px solid #000", fontSize: 11, fontWeight: "bold", color: "#000" }}>
                  <div style={{ flex: 2 }}>PERIODE</div>
                  <div style={{ flex: 1 }}>DURASI</div>
                  <div style={{ flex: 1, textAlign: "right" }}>STATUS</div>
                </div>
                {leaves.filter(l => l.employee_id === detailEmp.id).length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", fontSize: 13, fontWeight: "bold", color: "#64748b" }}>
                    Belum ada riwayat cuti.
                  </div>
                ) : (
                  leaves.filter(l => l.employee_id === detailEmp.id).map(l => (
                    <div key={l.id} style={{ display: "flex", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 12, fontWeight: "bold", color: "#000", alignItems: "center" }}>
                      <div style={{ flex: 2 }}>{l.start_date?.slice(0, 10)} — {l.end_date?.slice(0, 10)}</div>
                      <div style={{ flex: 1 }}>{l.total_days} HARI</div>
                      <div style={{ flex: 1, textAlign: "right" }}>
                        <span style={{ fontSize: 10, padding: "4px 8px", borderRadius: 12, background: statusBg[l.status], border: "2px solid #000" }}>
                          {statusLabel[l.status]?.toUpperCase() || l.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div style={{ marginTop: 20 }}>
              <Button disableRipple onPress={() => setDetailModalOpen(false)} style={{ width: "100%", background: "#000", color: "white", fontWeight: "bold", fontSize: 13, borderRadius: 10, height: 44 }}>
                TUTUP
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}