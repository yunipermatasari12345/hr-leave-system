package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"hr-leave-system/config"
	db "hr-leave-system/internal/db"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// Helper for JSON Error
func sendError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// 1. Dashboard Stats
func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	queries := db.New(config.DB)
	stats, err := queries.GetDashboardStats(r.Context())
	if err != nil {
		sendError(w, 500, "Gagal mengambil statistik dashboard")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func GetMonthlyStats(w http.ResponseWriter, r *http.Request) {
	queries := db.New(config.DB)
	stats, err := queries.GetMonthlyLeaveStats(r.Context())
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

	queries := db.New(config.DB)
	leaves, err := queries.GetAdvancedLeaves(r.Context(), db.GetAdvancedLeavesParams{
		Column1: status,
		Column2: dept,
	})
	if err != nil {
		fmt.Println("GetAdvancedLeaves Error:", err)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	
	result := make([]LeaveResponse, len(leaves))
	for i, l := range leaves {
		hrdNote := ""
		if l.HrdNote.Valid { hrdNote = l.HrdNote.String }
		reviewedBy := int32(0)
		if l.ReviewedBy.Valid { reviewedBy = l.ReviewedBy.Int32 }
		createdAt := ""
		if l.CreatedAt.Valid { createdAt = l.CreatedAt.Time.Format("2006-01-02") }

		result[i] = LeaveResponse{
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
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// 2. Master Data (Departments & Positions)
func GetDepartments(w http.ResponseWriter, r *http.Request) {
	queries := db.New(config.DB)
	depts, err := queries.GetDepartments(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(depts)
}

func GetPositions(w http.ResponseWriter, r *http.Request) {
	queries := db.New(config.DB)
	pos, err := queries.GetPositions(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pos)
}

// 3. Employee Master Updates
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

	queries := db.New(config.DB)
	emp, err := queries.UpdateEmployee(r.Context(), db.UpdateEmployeeParams{
		ID: int32(id),
		FullName: req.FullName,
		Department: req.Department,
		Position: req.Position,
		Phone: sql.NullString{String: req.Phone, Valid: req.Phone != ""},
	})
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
	queries := db.New(config.DB)
	err := queries.DeleteEmployee(r.Context(), int32(id))
	if err != nil {
		sendError(w, 500, "Gagal menghapus karyawan")
		return
	}
	w.WriteHeader(http.StatusOK)
}

// 4. Reports
func GetLeaveRecapPerDepartment(w http.ResponseWriter, r *http.Request) {
	queries := db.New(config.DB)
	recap, err := queries.GetLeaveRecapPerDepartment(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recap)
}
