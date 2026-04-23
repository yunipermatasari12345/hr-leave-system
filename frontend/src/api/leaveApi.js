import { apiClient } from "./client";

export const leaveApi = {
  getTypes() {
    return apiClient.get("/api/leave-types").then((r) => r.data);
  },
  getMyLeaves() {
    return apiClient.get("/api/employee/leaves").then((r) => r.data);
  },
  getMyBalances() {
    return apiClient.get("/api/employee/leave-balances").then((r) => r.data);
  },
  createRequest(payload) {
    // payload bisa berupa FormData (untuk upload) atau objek biasa
    const isFormData = payload instanceof FormData;
    return apiClient.post("/api/employee/leaves", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    }).then((r) => r.data);
  },
  getMyNotifications() {
    return apiClient.get("/api/employee/notifications").then((r) => r.data);
  },
  readNotification(id) {
    return apiClient.put(`/api/employee/notifications/${id}/read`).then((r) => r.data);
  },
  /** HRD: filter opsional status & department */
  createManualLeaveHR(payload) {
    const isFormData = payload instanceof FormData;
    return apiClient.post("/api/hrd/leaves/manual", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    }).then((r) => r.data);
  },
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
  deleteLeave(leaveId) {
    return apiClient.delete(`/api/hrd/leaves/${leaveId}`).then((r) => r.data);
  },
};
