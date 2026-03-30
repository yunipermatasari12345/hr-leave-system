import { apiClient } from "./client";

export const employeeApi = {
  listForHR() {
    return apiClient.get("/api/hrd/employees").then((r) => r.data);
  },
  createForHR(payload) {
    return apiClient.post("/api/hrd/employees", payload).then((r) => r.data);
  },
  updateForHR(id, payload) {
    return apiClient.put(`/api/hrd/employees/${id}`, payload).then((r) => r.data);
  },
  deleteForHR(id) {
    return apiClient.delete(`/api/hrd/employees/${id}`);
  },
};
