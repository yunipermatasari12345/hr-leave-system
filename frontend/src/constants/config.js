// Untuk Vercel satu project (frontend + api/index.go), default paling aman adalah "/api".
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const APPSKEP_API_URL = "https://dev-base.appskep.id";
