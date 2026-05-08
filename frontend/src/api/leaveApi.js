import { apiClient } from "./client";

export const leaveApi = {
  getTypes() {
    return apiClient.get("/leave-types").then((r) => r.data);
  },
  getMyLeaves() {
    return apiClient.get("/employee/leaves").then((r) => r.data);
  },
  getMyBalances() {
    return apiClient.get("/employee/leave-balances").then((r) => r.data);
  },
  createRequest(payload) {
    const isFormData = payload instanceof FormData;
    return apiClient.post("/employee/leaves", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    }).then((r) => r.data);
  },
  getMyNotifications() {
    return apiClient.get("/employee/notifications").then((r) => r.data);
  },
  readNotification(id) {
    return apiClient.put(`/employee/notifications/${id}/read`).then((r) => r.data);
  },
  createManualLeaveHR(payload) {
    const isFormData = payload instanceof FormData;
    return apiClient.post("/hrd/leaves/manual", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    }).then((r) => r.data);
  },
  getAdvancedForHR({ status = "", department = "" } = {}) {
    return apiClient
      .get("/hrd/leaves/advanced", {
        params: { status, department },
      })
      .then((r) => r.data);
  },
  updateStatusHR(leaveId, payload) {
    return apiClient
      .put(`/hrd/leaves/${leaveId}/status`, payload)
      .then((r) => r.data);
  },
  deleteLeave(leaveId) {
    return apiClient.delete(`/hrd/leaves/${leaveId}`).then((r) => r.data);
  },
};
