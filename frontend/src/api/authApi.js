import { apiClient } from "./client";

export async function login(credentials) {
  const { data } = await apiClient.post("/auth/login", credentials);
  return data;
}

export async function verifyRegistration(email) {
  const { data } = await apiClient.post("/auth/verify", { email });
  return data;
}
