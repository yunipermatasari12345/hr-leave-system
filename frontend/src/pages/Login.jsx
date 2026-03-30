import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Card, CardBody } from "@heroui/react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) { setError("Email dan password wajib diisi!"); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post("http://localhost:8080/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);
      if (res.data.role === "hrd") navigate("/hrd/dashboard");
      else navigate("/dashboard");
    } catch { setError("Email atau password salah!"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Left */}
      <div style={{ flex: 1, background: "#0ea5e9", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px" }}>
        <div style={{ maxWidth: 380 }}>
          <div style={{ width: 40, height: 4, background: "white", marginBottom: 28, borderRadius: 2 }} />
          <h1 style={{ fontSize: 38, fontWeight: 800, color: "white", margin: "0 0 14px 0", lineHeight: 1.2 }}>
            Appskep<br />HR System
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.7 }}>
            Sistem manajemen cuti karyawan yang mudah dan efisien.
          </p>
        </div>
      </div>

      {/* Right */}
      <div style={{ width: 460, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", background: "white" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>Masuk</h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 32px 0" }}>Masukkan akun perusahaan kamu</p>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
          <Input type="email" placeholder="nama@appskep.com" value={email}
            onValueChange={setEmail} variant="bordered" size="lg"
            classNames={{ input: "text-sm", inputWrapper: "border-gray-200 hover:border-sky-400 focus-within:!border-sky-500" }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Password</label>
          <Input
            type={showPass ? "text" : "password"}
            placeholder="Masukkan password"
            value={password}
            onValueChange={setPassword}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            variant="bordered"
            size="lg"
            classNames={{ input: "text-sm", inputWrapper: "border-gray-200 hover:border-sky-400 focus-within:!border-sky-500" }}
            endContent={
              <button onClick={() => setShowPass(!showPass)}
                style={{ fontSize: 11, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                {showPass ? "Sembunyikan" : "Tampilkan"}
              </button>
            }
          />
        </div>

        <Button onPress={handleLogin} isLoading={loading} size="lg"
          style={{ background: "#0ea5e9", color: "white", fontWeight: 700, fontSize: 15, borderRadius: 8 }}>
          Masuk
        </Button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 20 }}>
          Hubungi HRD jika lupa password atau belum punya akun
        </p>
      </div>
    </div>
  );
}