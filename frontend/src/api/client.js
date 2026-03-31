import axios from "axios";
import { API_BASE_URL, APPSKEP_API_URL } from "../constants/config";
import { STORAGE_KEYS } from "../constants/storage";

/** Client HTTP lokal: base URL localhost + token otomatis (kalau sudah login) */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Client HTTP untuk API eksternal (Appskep login) */
export const appskepClient = axios.create({
  baseURL: APPSKEP_API_URL,
});
