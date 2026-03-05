package handlers

import (
	"database/sql"
	"encoding/json"
	"hr-leave-system/config"
	db "hr-leave-system/internal/db"
	"hr-leave-system/internal/middleware"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type CreateLeaveRequest struct {
	LeaveTypeID int32  `json:"leave_type_id"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Reason      string `json:"reason"`
}

type UpdateLeaveStatusRequest struct {
	Status  string `json:"status"`
	HrdNote string `json:"hrd_note"`
}

type LeaveResponse struct {
	ID                 int32  `json:"id"`
	EmployeeID         int32  `json:"employee_id"`
	EmployeeName       string `json:"employee_name"`
	EmployeeDepartment string `json:"employee_department"`
	EmployeePosition   string `json:"employee_position"`
	LeaveTypeID        int32  `json:"leave_type_id"`
	StartDate          string `json:"start_date"`
	EndDate            string `json:"end_date"`
	TotalDays          int32  `json:"total_days"`
	Reason             string `json:"reason"`
	Status             string `json:"status"`
	HrdNote            string `json:"hrd_note"`
	ReviewedBy         int32  `json:"reviewed_by"`
	CreatedAt          string `json:"created_at"`
}

func toLeaveResponse(l db.LeaveRequest) LeaveResponse {
	hrdNote := ""
	if l.HrdNote.Valid {
		hrdNote = l.HrdNote.String
	}
	reviewedBy := int32(0)
	if l.ReviewedBy.Valid {
		reviewedBy = l.ReviewedBy.Int32
	}
	createdAt := ""
	if l.CreatedAt.Valid {
		createdAt = l.CreatedAt.Time.Format("2006-01-02")
	}
	return LeaveResponse{
		ID:          l.ID,
		EmployeeID:  l.EmployeeID,
		LeaveTypeID: l.LeaveTypeID,
		StartDate:   l.StartDate.Format("2006-01-02"),
		EndDate:     l.EndDate.Format("2006-01-02"),
		TotalDays:   l.TotalDays,
		Reason:      l.Reason,
		Status:      l.Status,
		HrdNote:     hrdNote,
		ReviewedBy:  reviewedBy,
		CreatedAt:   createdAt,
	}
}

func toLeaveRowResponse(l db.GetAllLeaveRequestsRow) LeaveResponse {
	hrdNote := ""
	if l.HrdNote.Valid {
		hrdNote = l.HrdNote.String
	}
	reviewedBy := int32(0)
	if l.ReviewedBy.Valid {
		reviewedBy = l.ReviewedBy.Int32
	}
	createdAt := ""
	if l.CreatedAt.Valid {
		createdAt = l.CreatedAt.Time.Format("2006-01-02")
	}
	return LeaveResponse{
		ID:                 l.ID,
		EmployeeID:         l.EmployeeID,
		EmployeeName:       l.EmployeeName,
		EmployeeDepartment: l.EmployeeDepartment,
		EmployeePosition:   l.EmployeePosition,
		LeaveTypeID:        l.LeaveTypeID,
		StartDate:          l.StartDate.Format("2006-01-02"),
		EndDate:            l.EndDate.Format("2006-01-02"),
		TotalDays:          l.TotalDays,
		Reason:             l.Reason,
		Status:             l.Status,
		HrdNote:            hrdNote,
		ReviewedBy:         reviewedBy,
		CreatedAt:          createdAt,
	}
}

func CreateLeaveRequest_(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey)
	queries := db.New(config.DB)

	employee, err := queries.GetEmployeeByUserID(r.Context(), int32(userID.(float64)))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Data karyawan tidak ditemukan"})
		return
	}

	var req CreateLeaveRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.StartDate == "" || req.EndDate == "" || req.Reason == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Semua field wajib diisi"})
		return
	}

	start, _ := time.Parse("2006-01-02", req.StartDate)
	end, _ := time.Parse("2006-01-02", req.EndDate)
	totalDays := int32(end.Sub(start).Hours()/24) + 1

	leave, err := queries.CreateLeaveRequest(r.Context(), db.CreateLeaveRequestParams{
		EmployeeID:  employee.ID,
		LeaveTypeID: req.LeaveTypeID,
		StartDate:   start,
		EndDate:     end,
		TotalDays:   totalDays,
		Reason:      req.Reason,
	})
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengajukan cuti"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(toLeaveResponse(leave))
}

func GetMyLeaves(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey)
	queries := db.New(config.DB)

	employee, err := queries.GetEmployeeByUserID(r.Context(), int32(userID.(float64)))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Data karyawan tidak ditemukan"})
		return
	}

	leaves, err := queries.GetLeaveRequestsByEmployee(r.Context(), employee.ID)
	if err != nil {
		leaves = []db.LeaveRequest{}
	}

	result := make([]LeaveResponse, len(leaves))
	for i, l := range leaves {
		result[i] = toLeaveResponse(l)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func GetAllLeaves(w http.ResponseWriter, r *http.Request) {
	queries := db.New(config.DB)

	leaves, err := queries.GetAllLeaveRequests(r.Context())
	if err != nil {
		leaves = []db.GetAllLeaveRequestsRow{}
	}

	result := make([]LeaveResponse, len(leaves))
	for i, l := range leaves {
		result[i] = toLeaveRowResponse(l)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func UpdateLeaveStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID tidak valid"})
		return
	}

	userID := r.Context().Value(middleware.UserIDKey)
	queries := db.New(config.DB)

	reviewer, err := queries.GetEmployeeByUserID(r.Context(), int32(userID.(float64)))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Data reviewer tidak ditemukan"})
		return
	}

	var req UpdateLeaveStatusRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.Status != "approved" && req.Status != "rejected" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Status harus approved atau rejected"})
		return
	}

	leave, err := queries.UpdateLeaveRequestStatus(r.Context(), db.UpdateLeaveRequestStatusParams{
		ID:     int32(id),
		Status: req.Status,
		HrdNote: sql.NullString{
			String: req.HrdNote,
			Valid:  req.HrdNote != "",
		},
		ReviewedBy: sql.NullInt32{
			Int32: reviewer.ID,
			Valid: true,
		},
	})
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal update status"})
		return
	}

	leaveDetail, _ := queries.GetLeaveRequestByID(r.Context(), int32(id))
	emp, _ := queries.GetEmployeeByID(r.Context(), leaveDetail.EmployeeID)
	user, _ := queries.GetUserByID(r.Context(), emp.UserID)
	statusText := "disetujui"
	if req.Status == "rejected" {
		statusText = "ditolak"
	}
	queries.CreateNotification(r.Context(), db.CreateNotificationParams{
		UserID:  user.ID,
		Message: "Pengajuan cuti kamu telah " + statusText,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(toLeaveResponse(leave))
}

func GetLeaveTypes(w http.ResponseWriter, r *http.Request) {
	queries := db.New(config.DB)
	types, _ := queries.GetAllLeaveTypes(r.Context())
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(types)
}