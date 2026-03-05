import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Input, Button, Select, SelectItem } from "@heroui/react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  return config;
});

export default function AddEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    email: "", password: "", full_name: "",
    department: "", position: "", phone: ""
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.full_name || !form.department || !form.position) {
      setError("Semua field wajib diisi kecuali nomor HP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/api/hrd/employees", form);
      setSuccess("Karyawan berhasil ditambahkan!");
      setForm({ email: "", password: "", full_name: "", department: "", position: "", phone: "" });
    } catch (e) {
      setError(e.response?.data?.error || "Gagal menambahkan karyawan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar mini */}
      <div className="w-64 bg-indigo-700 text-white flex flex-col">
        <div className="p-6 border-b border-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">HR Leave System</p>
              <p className="text-indigo-200 text-xs">HRD Panel</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <button onClick={() => navigate("/hrd/dashboard")}
            className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Dashboard
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tambah Karyawan</h1>
        <p className="text-gray-500 mb-6">Buat akun baru untuk karyawan</p>

        <Card className="max-w-2xl border border-gray-100">
          <CardBody className="p-6 flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input label="Nama Lengkap" placeholder="Budi Santoso" value={form.full_name}
                onValueChange={(v) => handleChange("full_name", v)} variant="bordered" />
              <Input label="Nomor HP" placeholder="08123456789" value={form.phone}
                onValueChange={(v) => handleChange("phone", v)} variant="bordered" />
              <Input label="Departemen" placeholder="IT, HR, Finance..." value={form.department}
                onValueChange={(v) => handleChange("department", v)} variant="bordered" />
              <Input label="Jabatan" placeholder="Engineer, Staff..." value={form.position}
                onValueChange={(v) => handleChange("position", v)} variant="bordered" />
              <Input label="Email Login" type="email" placeholder="budi@perusahaan.com" value={form.email}
                onValueChange={(v) => handleChange("email", v)} variant="bordered" />
              <Input label="Password" type="password" placeholder="Buat password" value={form.password}
                onValueChange={(v) => handleChange("password", v)} variant="bordered" />
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="flat" onPress={() => navigate("/hrd/dashboard")}>Batal</Button>
              <Button color="primary" className="bg-indigo-600" isLoading={loading} onPress={handleSubmit}>
                Simpan Karyawan
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}