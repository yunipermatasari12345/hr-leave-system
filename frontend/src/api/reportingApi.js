import { apiClient } from "./client";

/** Statistik & master data yang dipakai dashboard HRD */
export const reportingApi = {
  dashboardStats() {
    return apiClient.get("/hrd/dashboard/stats").then((r) => r.data);
  },
  monthlyLeaveStats() {
    return apiClient.get("/hrd/dashboard/monthly").then((r) => r.data);
  },
  departments() {
    return apiClient.get("/hrd/departments").then((r) => r.data);
  },
  positions() {
    return apiClient.get("/hrd/positions").then((r) => r.data);
  },
  leaveRecapPerDepartment() {
    return apiClient.get("/hrd/reports/departments").then((r) => r.data);
  },
};
