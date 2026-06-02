import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
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
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
      
      {/* --- Vector Organic Blobs Behind the Card (Matches User Reference Image) --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        
        {/* Mint/Teal Blob */}
        <div 
          className="absolute w-[360px] h-[360px] bg-[#67e8f9] rounded-[50%_50%_30%_70%_/_50%_60%_40%_60%] opacity-80"
          style={{
            transform: 'translate(90px, -70px) rotate(-15deg)',
          }}
        ></div>

        {/* Royal Blue Blob */}
        <div 
          className="absolute w-[380px] h-[380px] bg-[#2563eb] rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] opacity-95"
          style={{
            transform: 'translate(40px, 50px) rotate(25deg)',
          }}
        ></div>

        {/* Gold Outline Blob */}
        <div 
          className="absolute w-[370px] h-[370px] border-2 border-amber-300 rounded-[40%_60%_50%_50%_/_50%_30%_70%_50%]"
          style={{
            transform: 'translate(-40px, 80px) rotate(45deg)',
          }}
        ></div>
        
      </div>

      {/* --- Pure White Card (Matches User Reference Image) --- */}
      <div className="bg-white rounded-[24px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.06)] w-full max-w-[380px] p-10 relative z-10 border border-slate-100/50">
        
        {/* Cyan Circle Logo */}
        <div className="h-[52px] w-[52px] rounded-full border-[5px] border-[#67e8f9] flex items-center justify-center mb-5 mx-auto text-[#0284c7] font-black text-sm shadow-sm bg-white">
          AS
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-[26px] font-black text-slate-800 tracking-tight leading-tight">
            Login
          </h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1.5">
            Sistem Informasi Cuti PT APPSKEP
          </p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="bg-rose-50 text-rose-500 px-4 py-2.5 rounded-xl text-[12px] font-semibold mb-6 text-center border border-rose-100">
               ⚠️ {error}
            </div>
        )}

        {/* Minimal Underlined Inputs (Matches User Reference Image) */}
        <div className="flex flex-col gap-6">
          
          {/* Email Input */}
          <div className="flex flex-col gap-1 text-left relative">
            <div className="flex items-center gap-3 border-b border-slate-200 hover:border-slate-400 focus-within:!border-[#2563eb] py-2.5 transition-colors duration-300">
              <span className="text-slate-400">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                required
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-slate-800 placeholder:text-slate-300 font-semibold text-[14px] outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1 text-left relative">
            <div className="flex items-center gap-3 border-b border-slate-200 hover:border-slate-400 focus-within:!border-[#2563eb] py-2.5 transition-colors duration-300">
              <span className="text-slate-400">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-transparent text-slate-800 placeholder:text-slate-300 font-semibold text-[14px] outline-none pr-8"
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)} 
                className="absolute right-0 text-slate-300 hover:text-slate-500 outline-none cursor-pointer transition-colors"
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <Button
            disableRipple
            isLoading={loading}
            onPress={handleLogin}
            className="w-full h-[46px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-bold rounded-xl mt-4 shadow-[0_8px_20px_rgba(37,99,235,0.15)] transition-all duration-300 active:scale-[0.98]"
          >
            {loading ? "Menyambungkan..." : "Login"}
          </Button>

          {/* Underlink Options */}
          <div className="text-center mt-2 flex flex-col gap-2">
            <button className="text-[#2563eb] text-xs font-bold hover:underline transition-all cursor-pointer">
              Lupa password?
            </button>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">
              Powered by PT APPSKEP &copy; 2026
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}