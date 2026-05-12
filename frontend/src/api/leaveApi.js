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
  /** Tanpa file: JSON (lebih andal). Dengan file: multipart. */
  createRequest({ leave_type_id, start_date, end_date, reason, attachment }) {
    if (attachment) {
      const fd = new FormData();
      fd.append("leave_type_id", String(leave_type_id));
      fd.append("start_date", start_date);
      fd.append("end_date", end_date);
      fd.append("reason", reason);
      fd.append("attachment", attachment);
      return apiClient.post("/employee/leaves", fd).then((r) => r.data);
    }
    return apiClient
      .post(
        "/employee/leaves",
        {
          leave_type_id: Number(leave_type_id),
          start_date,
          end_date,
          reason,
        },
        { headers: { "Content-Type": "application/json" } },
      )
      .then((r) => r.data);
  },
  getMyNotifications() {
    return apiClient.get("/employee/notifications").then((r) => r.data);
  },
  readNotification(id) {
    return apiClient.put(`/employee/notifications/${id}/read`).then((r) => r.data);
  },
  createManualLeaveHR(payload) {
    const config = {};
    return apiClient.post("/hrd/leaves/manual", payload, config).then((r) => r.data);
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
