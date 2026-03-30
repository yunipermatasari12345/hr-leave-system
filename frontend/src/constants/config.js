/** URL backend — override dengan VITE_API_URL di file .env */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";
