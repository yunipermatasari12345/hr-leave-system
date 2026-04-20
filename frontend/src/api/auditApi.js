import { apiClient } from "./client";

export const auditApi = {
  getAuditLogs: async () => {
    const { data } = await apiClient.get("/api/hrd/audit-logs");
    return data;
  },
};
