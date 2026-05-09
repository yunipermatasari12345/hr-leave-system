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

      if ((data.role || "").toLowerCase() === "hrd") navigate("/hrd/dashboard");
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
    <div className="flex min-h-screen bg-[#f1f5f9] items-center justify-center p-6 font-['Inter',sans-serif]">
      <div className="bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] w-full max-w-[360px] p-8 relative border border-slate-100">
        
        {/* Back Arrow - Made smaller and subtler */}
        <button className="absolute top-6 left-6 text-slate-400 hover:text-[#0284c7] transition-colors cursor-pointer">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Logo Placeholder - Smaller and more centered */}
        <div className="flex justify-center mb-6 mt-4">
          <img src="/logo.png" alt="Appskep Logo" className="h-[60px] w-auto object-contain" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          <div className="hidden h-[60px] w-[60px] items-center justify-center bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-2xl text-white font-bold text-xl shadow-sm">
             AS
          </div>
        </div>

        {/* Titles - Compacted */}
        <div className="text-center mb-8">
          <h2 className="text-[16px] font-bold text-slate-800 tracking-tight leading-tight">
            Sistem Informasi Pengajuan Cuti<br/>
            <span className="text-[#0284c7] text-[13px] font-semibold">PT APPSKEP</span>
          </h2>
        </div>

        {/* Error - More integrated */}
        {error && (
            <div className="bg-red-50 text-red-500 px-3 py-2 rounded-lg text-[12px] font-medium mb-4 text-center border border-red-100">
               {error}
            </div>
        )}

        {/* Form - Slimmer inputs */}
        <div className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onValueChange={setEmail}
            variant="bordered"
            radius="md"
            classNames={{
              inputWrapper: "border border-slate-200 hover:border-slate-300 focus-within:!border-[#0284c7] bg-slate-50/50 shadow-none h-[44px] px-3 transition-all",
              input: "text-[14px] font-medium text-slate-700 placeholder:text-slate-400 outline-none"
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
              inputWrapper: "border border-slate-200 hover:border-slate-300 focus-within:!border-[#0284c7] bg-slate-50/50 shadow-none h-[44px] px-3 transition-all",
              input: "text-[14px] font-medium text-slate-700 placeholder:text-slate-400 outline-none"
            }}
            endContent={
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-300 hover:text-slate-500 outline-none pr-1 cursor-pointer transition-colors">
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            }
          />

          <div className="flex justify-end mt-[-4px]">
            <button className="text-[#0ea5e9] text-[12px] font-semibold hover:text-[#0284c7] transition-colors cursor-pointer">
              Lupa password?
            </button>
          </div>

          <Button
            disableRipple
            isLoading={loading}
            onPress={handleLogin}
            className="w-full h-[44px] bg-[#0284c7] hover:bg-[#0369a1] text-white text-[14px] font-bold rounded-xl mt-2 shadow-[0_4px_12px_rgba(2,132,199,0.2)] transition-all active:scale-[0.98]"
          >
            {loading ? "Menyambungkan..." : "Masuk"}
          </Button>

          <div className="text-center mt-4">
            <p className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">Powered by PT Appskep</p>
          </div>

        </div>
      </div>
    </div>
  );
}