import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Chip, Button } from "@heroui/react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  return config;
});

const statusColor = { pending: "warning", approved: "success", rejected: "danger" };
const statusLabel = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

export default function EmployeeDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "Karyawan";

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/api/employee/leaves");
      setLeaves(res.data || []);
    } catch { setLeaves([]); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const pending = leaves.filter(l => l.status === "pending").length;
  const approved = leaves.filter(l => l.status === "approved").length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-700 text-white flex flex-col">
        <div className="p-6 border-b border-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">HR Leave System</p>
              <p className="text-indigo-200 text-xs">Portal Karyawan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" },
            { id: "leaves", label: "Riwayat Cuti", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          ].map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activePage === item.id ? "bg-white/20 text-white" : "text-indigo-200 hover:bg-white/10"
              }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-indigo-200 text-xs">Karyawan</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-indigo-200 hover:bg-white/10 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-8 overflow-auto">
        {activePage === "dashboard" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-500 mb-6">Selamat datang, {name}!</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="rounded-2xl border bg-yellow-50 border-yellow-200 p-5">
                <p className="text-2xl mb-1">⏳</p>
                <p className="text-3xl font-bold text-yellow-700">{pending}</p>
                <p className="text-gray-600 text-sm mt-1">Menunggu Approval</p>
              </div>
              <div className="rounded-2xl border bg-green-50 border-green-200 p-5">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-3xl font-bold text-green-700">{approved}</p>
                <p className="text-gray-600 text-sm mt-1">Cuti Disetujui</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Pengajuan Terakhir</h2>
              <Button color="primary" size="sm" className="bg-indigo-600" onPress={() => navigate("/leaves/new")}>
                + Ajukan Cuti
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {leaves.slice(0, 5).map(leave => (
                <Card key={leave.id} className="border border-gray-100">
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Chip size="sm" color={statusColor[leave.status]} variant="flat">
                            {statusLabel[leave.status]}
                          </Chip>
                        </div>
                        <p className="text-sm text-gray-700">📅 {leave.start_date?.slice(0,10)} → {leave.end_date?.slice(0,10)} ({leave.total_days} hari)</p>
                        <p className="text-sm text-gray-500 mt-1">📝 {leave.reason}</p>
                        {leave.hrd_note && <p className="text-sm text-indigo-600 mt-1">💬 {leave.hrd_note}</p>}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
              {leaves.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">Belum ada pengajuan cuti</p>
                  <Button color="primary" className="bg-indigo-600" onPress={() => navigate("/leaves/new")}>
                    Ajukan Cuti Sekarang
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activePage === "leaves" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Riwayat Cuti</h1>
              <Button color="primary" size="sm" className="bg-indigo-600" onPress={() => navigate("/leaves/new")}>
                + Ajukan Cuti
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {leaves.map(leave => (
                <Card key={leave.id} className="border border-gray-100">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Chip size="sm" color={statusColor[leave.status]} variant="flat">
                        {statusLabel[leave.status]}
                      </Chip>
                    </div>
                    <p className="text-sm text-gray-700">📅 {leave.start_date?.slice(0,10)} → {leave.end_date?.slice(0,10)} ({leave.total_days} hari)</p>
                    <p className="text-sm text-gray-500 mt-1">📝 {leave.reason}</p>
                    {leave.hrd_note && <p className="text-sm text-indigo-600 mt-1">💬 Catatan HRD: {leave.hrd_note}</p>}
                  </CardBody>
                </Card>
              ))}
              {leaves.length === 0 && <p className="text-gray-400 text-center py-8">Belum ada riwayat cuti</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}