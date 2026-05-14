import { apiClient } from "./client";

export const employeeApi = {
  listForHR() {
    return apiClient.get("/hrd/employees").then((r) => r.data);
  },
  createForHR(payload) {
    return apiClient.post("/hrd/employees", payload).then((r) => r.data);
  },
  updateForHR(id, payload) {
    return apiClient.put(`/hrd/employees/${id}`, payload).then((r) => r.data);
  },
  deleteForHR(id) {
    return apiClient.delete(`/hrd/employees/${id}`);
  },
  updateRole(userId, role) {
    return apiClient.put("/hrd/employees/role", { user_id: userId, role }).then((r) => r.data);
  },
};
