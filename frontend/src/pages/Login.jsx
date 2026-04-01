import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { login, verifyRegistration } from "../api/authApi";
import { STORAGE_KEYS } from "../constants/storage";

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
       const result = await login({ email, password });
       
       if (result && result.data && result.data.access_token) {
         const token = result.data.access_token;
         const user = result.data.user;
         try {
           const localCheck = await verifyRegistration(user.email);
           if (!localCheck.is_registered) {
             setError("Akun Anda belum terdaftar di sistem HR kami. Silakan hubungi HRD.");
             setLoading(false);
             return;
           }
           
           // Gunakan token dan role dari database lokal kita
           const role = localCheck.role;
           const localToken = localCheck.token;
           
           localStorage.setItem(STORAGE_KEYS.token, localToken);
           localStorage.setItem(STORAGE_KEYS.role, role);
           localStorage.setItem(STORAGE_KEYS.name, user.name);
           localStorage.setItem(STORAGE_KEYS.department, localCheck.department || "");
           localStorage.setItem(STORAGE_KEYS.position, localCheck.position || "");

           if (role === "hrd") navigate("/hrd/dashboard");
           else navigate("/dashboard");
         } catch (err) {
           setError("Gagal verifikasi data lokal. Pastikan server backend berjalan.");
           setLoading(false);
           return;
         }
       } else {
         setError(result.message || "Gagal login. Periksa kembali email dan password.");
       }
     } catch (e) {
       setError("Terjadi kesalahan sistem atau akun tidak ditemukan!");
     }
     finally { setLoading(false); }
   };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] items-center justify-center p-4 font-['Inter',sans-serif]">
      <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-full max-w-[460px] p-10 relative">
        
        {/* Back Arrow */}
        <button className="absolute top-8 left-8 text-[#0284c7] hover:bg-sky-50 p-2 rounded-full transition-colors cursor-pointer">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Logo Placeholder */}
        <div className="flex justify-center mb-8 mt-10">
          <img src="/logo.png" alt="Appskep Logo" className="h-[110px] w-auto object-contain" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          {/* Fallback abstrak kalau belum ada logo */}
          <div className="hidden h-[100px] w-[100px] items-center justify-center bg-[#0284c7] rounded-full text-white font-bold text-3xl shadow-md">
             Logo
          </div>
        </div>

        {/* Titles */}
        <div className="text-center mb-10">
          <h2 className="text-[20px] font-bold text-slate-800 tracking-tight leading-snug">Sistem Informasi Pengajuan Cuti<br/>PT APPSKEP</h2>
        </div>

        {/* Error */}
        {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-semibold mb-6 text-center">
               {error}
            </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-5">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onValueChange={setEmail}
            variant="bordered"
            radius="sm"
            classNames={{
              inputWrapper: "border border-slate-300 hover:border-slate-400 focus-within:!border-[#0284c7] bg-white shadow-none h-[50px]",
              input: "text-[15px] font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
            }}
          />

          <Input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onValueChange={setPassword}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            variant="bordered"
            radius="sm"
            classNames={{
              inputWrapper: "border border-slate-300 hover:border-slate-400 focus-within:!border-[#0284c7] bg-white shadow-none h-[50px]",
              input: "text-[15px] font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-medium pr-10"
            }}
            endContent={
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-slate-600 outline-none pr-1 cursor-pointer">
                {showPass ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            }
          />

          <div className="flex justify-end mt-[-4px]">
            <button className="text-[#0ea5e9] text-[15px] font-medium hover:underline cursor-pointer">
              Lupa password ?
            </button>
          </div>

          <Button
            disableRipple
            isLoading={loading}
            onPress={handleLogin}
            className="w-full h-[52px] bg-[#0284c7] hover:bg-[#0369a1] text-white text-[16px] font-semibold rounded-[8px] mt-2 transition-all active:scale-[0.98]"
          >
            {loading ? "Menghubungkan..." : "Masuk"}
          </Button>

          <div className="text-center mt-6">
            <span className="text-slate-400 font-medium text-[15px]">Tidak punya akun? </span>
            <button className="text-[#0ea5e9] font-medium text-[15px] hover:underline cursor-pointer">
              Daftar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}