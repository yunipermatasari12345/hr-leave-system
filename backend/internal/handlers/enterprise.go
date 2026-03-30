package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

func sendError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	stats, err := ReportingService.DashboardStats(r.Context())
	if err != nil {
		sendError(w, 500, "Gagal mengambil statistik dashboard")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func GetMonthlyStats(w http.ResponseWriter, r *http.Request) {
	stats, err := ReportingService.MonthlyLeaveStats(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func GetAdvancedLeaves(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	dept := r.URL.Query().Get("department")

	list, _ := LeaveService.AdvancedFilter(r.Context(), status, dept)
	result := make([]LeaveResponse, len(list))
	for i, l := range list {
		result[i] = leaveResponseFromSummary(l)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func GetDepartments(w http.ResponseWriter, r *http.Request) {
	depts, err := ReportingService.Departments(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(depts)
}

func GetPositions(w http.ResponseWriter, r *http.Request) {
	pos, err := ReportingService.Positions(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pos)
}

type EditEmployeeReq struct {
	FullName   string `json:"full_name"`
	Department string `json:"department"`
	Position   string `json:"position"`
	Phone      string `json:"phone"`
}

func UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var req EditEmployeeReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, 400, "Format data tidak valid")
		return
	}

	emp, err := EmployeeService.Update(r.Context(), int32(id), req.FullName, req.Department, req.Position, req.Phone)
	if err != nil {
		sendError(w, 500, "Gagal update karyawan")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(toEmployeeResponse(emp))
}

func DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	if err := EmployeeService.Delete(r.Context(), int32(id)); err != nil {
		sendError(w, 500, "Gagal menghapus karyawan")
		return
	}
	w.WriteHeader(http.StatusOK)
}

func GetLeaveRecapPerDepartment(w http.ResponseWriter, r *http.Request) {
	recap, err := ReportingService.LeaveRecapPerDepartment(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recap)
}
