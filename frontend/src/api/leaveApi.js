import { apiClient } from "./client";

export const leaveApi = {
  getTypes() {
    return apiClient.get("/api/leave-types").then((r) => r.data);
  },
  getMyLeaves() {
    return apiClient.get("/api/employee/leaves").then((r) => r.data);
  },
  createRequest(payload) {
    return apiClient.post("/api/employee/leaves", payload).then((r) => r.data);
  },
  /** HRD: filter opsional status & department */
  getAdvancedForHR({ status = "", department = "" } = {}) {
    return apiClient
      .get("/api/hrd/leaves/advanced", {
        params: { status, department },
      })
      .then((r) => r.data);
  },
  updateStatusHR(leaveId, payload) {
    return apiClient
      .put(`/api/hrd/leaves/${leaveId}/status`, payload)
      .then((r) => r.data);
  },
};
