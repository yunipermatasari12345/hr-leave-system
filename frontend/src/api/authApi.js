import { apiClient } from "./client";

export async function login(credentials) {
  const { data } = await apiClient.post("/api/login", credentials);
  return data;
}

export async function verifyRegistration(email) {
  // Panggil backend lokal untuk cek apakah email sudah terdaftar
  // Gunakan URL absolut atau biarkan axios menggunakan API_BASE_URL (hati-hati jika berbeda)
  // Karena API_BASE_URL sekarang appskep, kita butuh panggil localhost:8080 untuk verifikasi lokal
  const response = await fetch("http://localhost:8080/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return response.json();
}
