import { appskepClient, apiClient } from "./client";

export async function login(credentials) {
  const { data } = await appskepClient.post("/api/login", credentials);
  return data;
}

export async function verifyRegistration(email) {
  // Panggil backend lokal untuk cek apakah email sudah terdaftar
  const { data } = await apiClient.post("/api/auth/verify", { email });
  return data;
}
