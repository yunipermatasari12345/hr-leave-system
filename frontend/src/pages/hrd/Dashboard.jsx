import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    setSelected(leave);
    setActionType(type);
    setHrdNote("");
  };

  const handleAction = async () => {
    try {
      await api.put(`/api/hrd/leaves/${selected.id}/status`, {
        status: actionType,
        hrd_note: hrdNote,
      });
      setSelected(null);
      fetchLeaves();
    } catch {
      alert("Gagal update status");
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const pending = leaves.filter(l => l.status === "pending");
  const approved = leaves.filter(l => l.status === "approved");
  const rejected = leaves.filter(l => l.status === "rejected");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      {/* Sidebar */}
      <div style={{ width: 256, background: "#4338ca", color: "white", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>🏢</div>
            <div>
              <p style={{ fontWeight: "bold", fontSize: 14, margin: 0 }}>HR Leave System</p>
              <p style={{ fontSize: 12, margin: 0, opacity: 0.7 }}>HRD Panel</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { id: "dashboard", label: "🏠 Dashboard" },
            { id: "leaves", label: "📋 Pengajuan Cuti" },
            { id: "employees", label: "👥 Karyawan" },
          ].map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              style={{
                background: activePage === item.id ? "rgba(255,255,255,0.2)" : "transparent",
                border: "none", color: activePage === item.id ? "white" : "rgba(255,255,255,0.7)",
                padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
                cursor: "pointer", textAlign: "left"
              }}>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>{name}</p>
              <p style={{ fontSize: 12, margin: 0, opacity: 0.7 }}>HRD</p>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, padding: "8px 12px", borderRadius: 8, textAlign: "left" }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 32, overflow: "auto" }}>

        {activePage === "dashboard" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#111827", margin: 0 }}>Dashboard</h1>
            <p style={{ color: "#6b7280", marginTop: 4, marginBottom: 24 }}>Selamat datang, {name}!</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Menunggu Review", value: pending.length, bg: "#fefce8", border: "#fde047", color: "#a16207", icon: "⏳" },
                { label: "Disetujui", value: approved.length, bg: "#f0fdf4", border: "#86efac", color: "#15803d", icon: "✅" },
                { label: "Ditolak", value: rejected.length, bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c", icon: "❌" },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 16, padding: 20 }}>
                  <p style={{ fontSize: 24, margin: "0 0 4px 0" }}>{stat.icon}</p>
                  <p style={{ fontSize: 30, fontWeight: "bold", color: stat.color, margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: 14, color: "#4b5563", margin: "4px 0 0 0" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>Pengajuan Terbaru</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {leaves.slice(0, 5).map(leave => (
                <LeaveCard key={leave.id} leave={leave}
                  onApprove={() => openAction(leave, "approved")}
                  onReject={() => openAction(leave, "rejected")} />
              ))}
              {leaves.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>Belum ada pengajuan cuti</p>}
            </div>
          </div>
        )}

        {activePage === "leaves" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 24 }}>Semua Pengajuan Cuti</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {leaves.map(leave => (
                <LeaveCard key={leave.id} leave={leave}
                  onApprove={() => openAction(leave, "approved")}
                  onReject={() => openAction(leave, "rejected")} />
              ))}
              {leaves.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>Belum ada pengajuan cuti</p>}
            </div>
          </div>
        )}

        {activePage === "employees" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#111827", margin: 0 }}>Data Karyawan</h1>
              <button onClick={() => navigate("/hrd/employees/add")}
                style={{ background: "#4338ca", color: "white", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                + Tambah Karyawan
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {employees.map(emp => (
                <div key={emp.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4338ca", fontWeight: "bold" }}>
                    {emp.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: "#111827", margin: 0 }}>{emp.full_name}</p>
                    <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>{emp.position} · {emp.department}</p>
                  </div>
                </div>
              ))}
              {employees.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>Belum ada data karyawan</p>}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 32, width: 440, maxWidth: "90vw", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontSize: 20, fontWeight: "bold", margin: "0 0 4px 0" }}>
              {actionType === "approved" ? "✅ Setujui Cuti" : "❌ Tolak Cuti"}
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 4px 0" }}>
              👤 <strong>{selected.employee_name}</strong> · {selected.employee_department} · {selected.employee_position}
            </p>
            <p style={{ fontSize: 14, color: "#374151", margin: "0 0 16px 0" }}>
              📅 {selected.start_date?.slice(0,10)} → {selected.end_date?.slice(0,10)} ({selected.total_days} hari)
            </p>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px 0" }}>
              {actionType === "approved"
                ? "Apakah kamu yakin ingin menyetujui pengajuan cuti ini?"
                : "Apakah kamu yakin ingin menolak pengajuan cuti ini?"}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Catatan (opsional)</label>
              <textarea rows={3} placeholder="Tambahkan catatan untuk karyawan..."
                value={hrdNote} onChange={(e) => setHrdNote(e.target.value)}
                style={{ width: "100%", border: "2px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setSelected(null)}
                style={{ padding: "10px 20px", borderRadius: 12, border: "2px solid #e5e7eb", background: "white", color: "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Batal
              </button>
              <button onClick={handleAction}
                style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: actionType === "approved" ? "#16a34a" : "#dc2626", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {actionType === "approved" ? "✅ Setujui" : "❌ Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaveCard({ leave, onApprove, onReject }) {
  const statusConfig = {
    pending: { label: "Menunggu", bg: "#fefce8", color: "#a16207", border: "#fde047" },
    approved: { label: "Disetujui", bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
    rejected: { label: "Ditolak", bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
  };
  const sc = statusConfig[leave.status] || statusConfig.pending;
  const hrdNote = getStr(leave.hrd_note);

  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
              {sc.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              👤 {leave.employee_name || "Karyawan"}
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>ID #{leave.id}</span>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 4px 0" }}>
            🏢 {leave.employee_department} · {leave.employee_position}
          </p>
          <p style={{ fontSize: 14, color: "#374151", margin: "0 0 4px 0" }}>
            📅 {leave.start_date?.slice(0,10)} → {leave.end_date?.slice(0,10)}
            <span style={{ color: "#6b7280", marginLeft: 8 }}>({leave.total_days} hari)</span>
          </p>
          <p style={{ fontSize: 14, color: "#4b5563", margin: 0 }}>📝 {leave.reason}</p>
          {hrdNote && <p style={{ fontSize: 14, color: "#4338ca", margin: "4px 0 0 0" }}>💬 Catatan HRD: {hrdNote}</p>}
        </div>
        {leave.status === "pending" && (
          <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
            <button onClick={onApprove}
              style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 10, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Setujui
            </button>
            <button onClick={onReject}
              style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 10, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Tolak
            </button>
          </div>
        )}
      </div>
    </div>
  );
}