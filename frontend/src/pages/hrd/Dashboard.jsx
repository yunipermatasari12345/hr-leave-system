import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, Textarea, Avatar, Divider } from "@heroui/react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  return config;
});

function getStr(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && "String" in val) return val.String || "";
  return String(val);
}

export default function HrdDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hrdNote, setHrdNote] = useState("");
  const [actionType, setActionType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "HRD";

  useEffect(() => { fetchLeaves(); fetchEmployees(); }, []);

  const fetchLeaves = async () => {
    try { const res = await api.get("/api/hrd/leaves"); setLeaves(res.data || []); }
    catch { setLeaves([]); }
  };
  const fetchEmployees = async () => {
    try { const res = await api.get("/api/hrd/employees"); setEmployees(res.data || []); }
    catch { setEmployees([]); }
  };
  const openAction = (leave, type) => {
    setSelected(leave); setActionType(type); setHrdNote(""); setModalOpen(true);
  };
  const handleAction = async () => {
    try {
      await api.put(`/api/hrd/leaves/${selected.id}/status`, { status: actionType, hrd_note: hrdNote });
      setModalOpen(false); fetchLeaves();
    } catch { alert("Gagal update status"); }
  };
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const pending = leaves.filter(l => l.status === "pending");
  const approved = leaves.filter(l => l.status === "approved");
  const rejected = leaves.filter(l => l.status === "rejected");

  const statusColor = { pending: "warning", approved: "success", rejected: "danger" };
  const statusLabel = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "leaves", label: "Pengajuan Cuti" },
    { id: "employees", label: "Karyawan" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: "#0f172a" }}>Appskep HR</p>
              <p style={{ fontSize: 11, margin: 0, color: "#94a3b8" }}>HRD Panel</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              style={{
                width: "100%", border: "none", padding: "11px 16px", borderRadius: 8, fontSize: 13,
                fontWeight: activePage === item.id ? 700 : 500, cursor: "pointer", textAlign: "left", marginBottom: 2,
                background: activePage === item.id ? "#eff6ff" : "transparent",
                color: activePage === item.id ? "#0ea5e9" : "#64748b",
                borderLeft: activePage === item.id ? "3px solid #0ea5e9" : "3px solid transparent",
              }}>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Avatar name={name} size="sm" style={{ background: "#0ea5e9", color: "white", fontWeight: 700 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{name}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>HRD Admin</p>
            </div>
          </div>
          <Button size="sm" variant="flat" color="danger" onPress={handleLogout} className="w-full" style={{ fontSize: 12 }}>
            Keluar
          </Button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "32px 36px", overflow: "auto" }}>

        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Dashboard</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Selamat datang, {name}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Pengajuan", value: leaves.length, color: "#0ea5e9", bg: "#eff6ff" },
                { label: "Menunggu Review", value: pending.length, color: "#f59e0b", bg: "#fffbeb" },
                { label: "Disetujui", value: approved.length, color: "#10b981", bg: "#f0fdf4" },
                { label: "Ditolak", value: rejected.length, color: "#ef4444", bg: "#fef2f2" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "white", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: stat.color }} />
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0 0", fontWeight: 500 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>Pengajuan Terbaru</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leaves.slice(0, 5).map(leave => (
                  <LeaveCard key={leave.id} leave={leave} statusColor={statusColor} statusLabel={statusLabel}
                    onApprove={() => openAction(leave, "approved")} onReject={() => openAction(leave, "rejected")} />
                ))}
                {leaves.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32, margin: 0 }}>Belum ada pengajuan cuti</p>}
              </div>
            </div>
          </div>
        )}

        {/* LEAVES */}
        {activePage === "leaves" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Pengajuan Cuti</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Total {leaves.length} pengajuan</p>
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leaves.map(leave => (
                  <LeaveCard key={leave.id} leave={leave} statusColor={statusColor} statusLabel={statusLabel}
                    onApprove={() => openAction(leave, "approved")} onReject={() => openAction(leave, "rejected")} />
                ))}
                {leaves.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32, margin: 0 }}>Belum ada pengajuan</p>}
              </div>
            </div>
          </div>
        )}

        {/* EMPLOYEES */}
        {activePage === "employees" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Karyawan</h1>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Total {employees.length} karyawan</p>
              </div>
              <Button onPress={() => navigate("/hrd/employees/add")} color="primary"
                style={{ background: "#0ea5e9", fontWeight: 600, fontSize: 13 }}>
                + Tambah Karyawan
              </Button>
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: "8px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              {employees.map((emp, i) => (
                <div key={emp.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
                    <Avatar name={emp.full_name} size="md" style={{ background: "#0ea5e9", color: "white", fontWeight: 700, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: "#0f172a", margin: 0, fontSize: 14 }}>{emp.full_name}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>{emp.position} · {emp.department}</p>
                    </div>
                    <Chip size="sm" color="success" variant="flat">Aktif</Chip>
                  </div>
                  {i < employees.length - 1 && <Divider />}
                </div>
              ))}
              {employees.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32, margin: 0 }}>Belum ada data karyawan</p>}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: 460, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>
              {actionType === "approved" ? "Setujui Pengajuan Cuti" : "Tolak Pengajuan Cuti"}
            </h2>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Avatar name={selected.employee_name} size="sm" style={{ background: "#0ea5e9", color: "white", fontWeight: 700 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{selected.employee_name}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{selected.employee_department} · {selected.employee_position}</p>
                </div>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                {selected.start_date?.slice(0,10)} sampai {selected.end_date?.slice(0,10)}
                <span style={{ fontWeight: 600, color: "#0f172a", marginLeft: 6 }}>({selected.total_days} hari)</span>
              </p>
            </div>
            <Textarea placeholder="Catatan untuk karyawan (opsional)"
              value={hrdNote} onValueChange={setHrdNote} variant="bordered" minRows={3}
              label="Catatan HRD"
              classNames={{ label: "text-xs font-semibold text-slate-600", inputWrapper: "border-slate-200" }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <Button variant="bordered" onPress={() => setModalOpen(false)} style={{ fontSize: 13 }}>Batal</Button>
              <Button onPress={handleAction} color={actionType === "approved" ? "success" : "danger"}
                style={{ fontWeight: 600, fontSize: 13, color: "white" }}>
                {actionType === "approved" ? "Setujui" : "Tolak"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaveCard({ leave, statusColor, statusLabel, onApprove, onReject }) {
  const hrdNote = getStr(leave.hrd_note);
  return (
    <div style={{ border: "1px solid #f1f5f9", borderRadius: 12, padding: "14px 16px", background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Chip size="sm" color={statusColor[leave.status] || "default"} variant="flat">
              {statusLabel[leave.status] || leave.status}
            </Chip>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{leave.employee_name}</span>
            <span style={{ fontSize: 11, color: "#cbd5e1" }}>#{leave.id}</span>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px 0" }}>{leave.employee_department} · {leave.employee_position}</p>
          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 2px 0" }}>
            {leave.start_date?.slice(0,10)} — {leave.end_date?.slice(0,10)}
            <Chip size="sm" variant="flat" color="default" style={{ marginLeft: 8, fontSize: 11 }}>{leave.total_days} hari</Chip>
          </p>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{leave.reason}</p>
          {hrdNote && <p style={{ fontSize: 12, color: "#0ea5e9", margin: "4px 0 0 0", fontWeight: 500 }}>Catatan: {hrdNote}</p>}
        </div>
        {leave.status === "pending" && (
          <div style={{ display: "flex", gap: 6, marginLeft: 16, flexShrink: 0 }}>
            <Button size="sm" color="success" variant="flat" onPress={onApprove} style={{ fontSize: 12, fontWeight: 600 }}>Setujui</Button>
            <Button size="sm" color="danger" variant="flat" onPress={onReject} style={{ fontSize: 12, fontWeight: 600 }}>Tolak</Button>
          </div>
        )}
      </div>
    </div>
  );
}