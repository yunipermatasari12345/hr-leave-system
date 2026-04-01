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
    <div className="flex min-h-screen bg-slate-50 font-['Inter',sans-serif]">
      {/* KIRI - Panel Branding Akses Eksekutif */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600 flex-col justify-center px-20">
         {/* Dekorasi Bentuk Abstrak */}
         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[60px]" />
         <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-black/15 rounded-full blur-[80px]" />
         
         <div className="relative z-10 max-w-[500px]">
            <div className="inline-flex items-center bg-white/20 px-5 py-3 rounded-full mb-8 backdrop-blur-md">
               <span className="text-2xl mr-3">🏢</span>
               <span className="text-white font-bold tracking-widest text-xs">APPSKEP ENTERPRISE HR</span>
            </div>
            <h1 className="text-white text-5xl font-extrabold leading-[1.2] mb-6 tracking-tight">
              Kelola SDM Lebih Cerdas & Cepat.
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed font-medium">
              Satu portal terpusat untuk memantau kehadiran, pengajuan cuti otomatis, dan data kepegawaian secara komprehensif.
            </p>
         </div>
      </div>

      {/* KANAN - Panel Form Autentikasi */}
      <div className="w-full lg:w-[600px] flex flex-col justify-center px-8 sm:px-16 lg:px-20 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] relative z-20">
         
         <div className="mb-10 lg:hidden">
            <div className="inline-flex items-center bg-blue-50 px-4 py-2 rounded-full mb-4">
               <span className="text-lg mr-2">🏢</span>
               <span className="text-blue-600 font-bold tracking-widest text-[10px]">APPSKEP HR</span>
            </div>
         </div>

         <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Selamat Datang!</h2>
            <p className="text-slate-500 font-medium">Silakan masuk menggunakan akun korporat Anda.</p>
         </div>

         {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold mb-6 flex items-start gap-3 animate-pulse">
               <span className="text-lg leading-none">⚠️</span>
               <span>{error}</span>
            </div>
         )}

         <div className="flex flex-col gap-6">
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-2 tracking-wide">EMAIL LOGIN</label>
               <Input
                 type="email" placeholder="contoh@appskep.com" value={email} onValueChange={setEmail}
                 variant="bordered" radius="md"
                 classNames={{
                   inputWrapper: "border-2 border-slate-200 hover:border-slate-300 focus-within:!border-blue-600 focus-within:!bg-white bg-slate-50 shadow-none transition-colors h-[54px]",
                   input: "font-semibold text-slate-800 text-[15px]"
                 }}
               />
            </div>
            
            <div>
               <label className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 tracking-wide">PASSWORD</span>
                  <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline transition-all">Lupa sandi?</span>
               </label>
               <Input
                 type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onValueChange={setPassword}
                 onKeyDown={(e) => e.key === "Enter" && handleLogin()} variant="bordered" radius="md"
                 classNames={{
                   inputWrapper: "border-2 border-slate-200 hover:border-slate-300 focus-within:!border-blue-600 focus-within:!bg-white bg-slate-50 shadow-none transition-colors h-[54px]",
                   input: "font-semibold text-slate-800 text-[15px] pr-10"
                 }}
                 endContent={
                    <button type="button" onClick={() => setShowPass(!showPass)} className="bg-transparent border-none cursor-pointer text-lg outline-none">
                       {showPass ? "🕵️" : "👁️"}
                    </button>
                 }
               />
            </div>

            <Button disableRipple isLoading={loading} onPress={handleLogin} className="w-full h-[54px] bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-bold rounded-xl mt-4 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all active:scale-[0.98]">
               {loading ? "MENGOTENTIKASI..." : "MASUK SEKARANG"}
            </Button>
         </div>

         <p className="mt-16 text-center text-xs text-slate-400 font-semibold tracking-wide">
            © 2026 Appskep Indonesia. Hak Cipta Dilindungi.
         </p>
      </div>
    </div>
  );
}