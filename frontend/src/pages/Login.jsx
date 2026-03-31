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
    <div className="login-bg min-h-screen">
      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-[440px] px-6">
        <div className="backdrop-blur-2xl bg-white/70 border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[40px] p-10 flex flex-col items-center">
          
          {/* User Icon Circle */}
          <div className="w-20 h-20 bg-[#004a82] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6.02-3.22.03-1.99 4.02-3.08 6.02-3.08 1.99 0 5.99 1.09 6.02 3.08-1.31 1.94-3.52 3.22-6.02 3.22z"/>
            </svg>
          </div>

          <h2 className="text-3xl font-medium text-[#003366] mb-10 tracking-tight">Portal Login</h2>

          {error && (
            <div className="w-full mb-6 py-3 px-4 bg-red-400/80 backdrop-blur-sm text-white text-sm font-semibold rounded-2xl text-center animate-shake">
              {error}
            </div>
          )}

          <div className="w-full space-y-6">
            {/* Email Input */}
            <div className="group transition-all duration-300">
              <Input
                type="email"
                placeholder="Email Karyawan"
                value={email}
                onValueChange={setEmail}
                variant="flat"
                radius="none"
                classNames={{
                  input: "text-lg text-[#003366] placeholder:text-[#507ea4] font-medium px-6 py-4 h-[60px]",
                  inputWrapper: "bg-white rounded-full border-none shadow-md group-focus-within:ring-2 group-focus-within:ring-sky-200 transition-all duration-300 h-[60px]"
                }}
              />
            </div>

            {/* Password Input */}
            <div className="group transition-all duration-300 relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onValueChange={setPassword}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                variant="flat"
                radius="none"
                classNames={{
                  input: "text-lg text-[#003366] placeholder:text-[#507ea4] font-medium px-6 py-4 h-[60px]",
                  inputWrapper: "bg-white rounded-full border-none shadow-md group-focus-within:ring-2 group-focus-within:ring-sky-200 transition-all duration-300 h-[60px] pr-12"
                }}
                endContent={
                  <button
                    className="focus:outline-none h-full flex items-center pr-2"
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#507ea4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#507ea4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                }
              />
            </div>

            <div className="text-center mt-2">
              <button className="text-[#004a82] font-semibold text-[15px] hover:underline transition-all">
                Lupa Password?
              </button>
            </div>

            <Button
              onPress={handleLogin}
              isLoading={loading}
              className="w-full h-[60px] bg-[#004a82] hover:bg-[#003366] text-white font-bold text-xl rounded-full shadow-lg shadow-[#004a82]/20 active:scale-[0.98] transition-all duration-300 mt-6"
            >
              {loading ? "Menghubungkan..." : "Masuk"}
            </Button>
          </div>

        </div>
      </div>

      {/* Decorative Cloud-like blobs (extra depth) */}
      <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[15%] right-[10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
    </div>
  );
}