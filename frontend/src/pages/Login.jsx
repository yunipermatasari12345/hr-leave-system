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
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <div style={{
        width: 480,
        background: "white",
        borderRadius: 16,
        padding: "48px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
        position: "relative"
      }}>
        {/* Back Button */}
        <button onClick={() => navigate(-1)} style={{
          position: "absolute", top: 28, left: 28, background: "none", border: "none",
          cursor: "pointer", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>



        {/* Text */}
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", textAlign: "center", margin: "16px 0 12px 0" }}>
          Masuk ke Portal Cuti
        </h2>
        <p style={{ fontSize: 15, color: "#475569", textAlign: "center", margin: "0 0 36px 0", lineHeight: 1.5, padding: "0 10px" }}>
          Gunakan akun perusahaan yang terdaftar untuk mengakses sistem manajemen cuti.
        </p>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 8, fontSize: 14, marginBottom: 24, textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 16 }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onValueChange={setEmail}
            variant="bordered"
            radius="md"
            classNames={{
              input: "text-[16px] font-medium py-2",
              inputWrapper: "flex items-center w-full h-14 border border-gray-200 hover:border-gray-300 focus-within:!border-sky-500 bg-white"
            }}
          />

          <Input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onValueChange={setPassword}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            variant="bordered"
            radius="md"
            classNames={{
              input: "text-[16px] font-medium py-2",
              inputWrapper: "flex items-center w-full h-14 border border-gray-200 hover:border-gray-300 focus-within:!border-sky-500 bg-white"
            }}
            endContent={
              <button onClick={() => setShowPass(!showPass)} type="button"
                style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 8 }}>
                {showPass ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            }
          />
        </div>

        {/* Forgot Password */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
          <button style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: 0 }}>
            Lupa password ?
          </button>
        </div>

        {/* Login Button */}
        <Button onPress={handleLogin} isLoading={loading} size="lg" disableRipple
          style={{ width: "100%", background: "#0ea5e9", color: "white", fontWeight: 600, fontSize: 16, borderRadius: 8, height: 52, marginBottom: 28 }}>
          {loading ? "Memproses..." : "Masuk"}
        </Button>

        {/* Register Link */}
        <div style={{ textAlign: "center", fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>
          Tidak punya akun? <button style={{ background: "none", border: "none", color: "#0ea5e9", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 14 }}>Daftar</button>
        </div>
      </div>
    </div>
  );
}