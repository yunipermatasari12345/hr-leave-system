import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { login } from "../api/authApi";
import { STORAGE_KEYS } from "../constants/storage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email dan password wajib diisi!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await login({ email, password });
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      localStorage.setItem(STORAGE_KEYS.role, (data.role || "").toLowerCase());
      localStorage.setItem(STORAGE_KEYS.name, data.name || "");
      localStorage.setItem(STORAGE_KEYS.department, data.department || "");
      localStorage.setItem(STORAGE_KEYS.position, data.position || "");

      const userRole = (data.role || "").toLowerCase();
      if (userRole === "hrd" || userRole === "admin") navigate("/hrd/dashboard");
      else navigate("/dashboard");
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          "Terjadi kesalahan sistem atau akun tidak ditemukan!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Animated Blobs */}
      <div className="auth-blur-circle-1"></div>
      <div className="auth-blur-circle-2"></div>

      <div className="relative z-10 w-full max-w-[420px] p-4">
        <div className="glass-card rounded-[28px] p-10 border border-white/20 shadow-2xl relative overflow-hidden">
          {/* Subtle light reflect */}
          <div className="absolute -top-[50%] -left-[50%] w-[200%] height-[200%] rotate-[35deg] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0"></div>

          <div className="relative z-10">
            {/* Appskep Premium Brand Logo */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="h-[68px] w-[68px] flex items-center justify-center bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] rounded-2xl text-white font-extrabold text-2xl shadow-[0_8px_20px_rgba(59,130,246,0.35)] mb-4 animate-bounce-subtle">
                AS
              </div>
              <h2 className="text-center font-extrabold text-white text-xl tracking-tight leading-tight">
                HR Leave Portal
              </h2>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1.5">
                PT APPSKEP
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 text-rose-300 px-4 py-3 rounded-2xl text-[12px] font-semibold mb-6 text-center border border-rose-500/20 backdrop-blur-sm animate-shake">
                ⚠️ {error}
              </div>
            )}

            {/* Form Fields */}
            <div className="flex flex-col gap-5">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  label="Email Kantor"
                  labelPlacement="outside"
                  value={email}
                  onValueChange={setEmail}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    label: "text-slate-300 font-bold text-xs mb-2",
                    inputWrapper: "border border-slate-700/60 hover:border-slate-500 focus-within:!border-blue-500 bg-slate-900/60 shadow-none h-[48px] px-4 transition-all duration-300",
                    input: "text-[14px] font-medium text-white placeholder:text-slate-500 outline-none"
                  }}
                />
              </div>

              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="Masukkan Password"
                  label="Password"
                  labelPlacement="outside"
                  value={password}
                  onValueChange={setPassword}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    label: "text-slate-300 font-bold text-xs mb-2",
                    inputWrapper: "border border-slate-700/60 hover:border-slate-500 focus-within:!border-blue-500 bg-slate-900/60 shadow-none h-[48px] px-4 transition-all duration-300",
                    input: "text-[14px] font-medium text-white placeholder:text-slate-500 outline-none"
                  }}
                  endContent={
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-500 hover:text-slate-300 outline-none pr-1 cursor-pointer transition-colors">
                      {showPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  }
                />
              </div>

              <div className="flex justify-end -mt-1.5">
                <button className="text-blue-400 text-[12px] font-bold hover:text-blue-300 transition-colors cursor-pointer">
                  Lupa password?
                </button>
              </div>

              <Button
                disableRipple
                isLoading={loading}
                onPress={handleLogin}
                className="glow-btn w-full h-[50px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[14px] font-bold rounded-2xl mt-3 shadow-[0_8px_25px_rgba(37,99,235,0.3)] transition-all duration-300 active:scale-[0.98]"
              >
                {loading ? "Menyambungkan..." : "Masuk ke Dashboard"}
              </Button>

              <div className="text-center mt-6">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Powered by PT APPSKEP &copy; 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}