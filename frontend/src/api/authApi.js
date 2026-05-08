import { appskepClient, apiClient } from "./client";

export async function login(credentials) {
  // Bypass external Appskep API (yang kena blokir Cloudflare)
  // Langsung tembak ke backend Go kita (yang sekarang ada di /api)
  const { data } = await apiClient.post("/auth/login", credentials);
  
  // Format ulang responnya supaya Login.jsx (React) tidak error
  return {
    data: {
      access_token: data.token,
      user: { email: credentials.email, name: data.name }
    }
  };
}

export async function verifyRegistration(email) {
  // Panggil backend lokal untuk cek apakah email sudah terdaftar
  const { data } = await apiClient.post("/auth/verify", { email });
  return data;
}
