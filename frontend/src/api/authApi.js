import { apiClient } from "./client";

export async function login(credentials) {
  const { data } = await apiClient.post("/api/auth/login", credentials);
  return data;
}
