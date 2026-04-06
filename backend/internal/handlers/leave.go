package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"hr-leave-system/internal/application"
	dleave "hr-leave-system/internal/domain/leave"
	"hr-leave-system/internal/middleware"
	"io"
	"net/http"
	"os"
	"path/filepath"
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
	LeaveTypeName      string `json:"leave_type_name"`
	StartDate          string `json:"start_date"`
	EndDate            string `json:"end_date"`
	TotalDays          int32  `json:"total_days"`
	Reason             string `json:"reason"`
	AttachmentURL      string `json:"attachment_url"`
	Status             string `json:"status"`
	HrdNote            string `json:"hrd_note"`
	ReviewedBy         int32  `json:"reviewed_by"`
	CreatedAt          string `json:"created_at"`
}

func leaveResponseFromDomain(l dleave.LeaveRequest) LeaveResponse {
	createdAt := ""
	if l.HasCreatedAt {
		createdAt = l.CreatedAt.Format("2006-01-02")
	}
	return LeaveResponse{
		ID:            l.ID,
		EmployeeID:    l.EmployeeID,
		LeaveTypeID:   l.LeaveTypeID,
		StartDate:     l.StartDate.Format("2006-01-02"),
		EndDate:       l.EndDate.Format("2006-01-02"),
		TotalDays:     l.TotalDays,
		Reason:        l.Reason,
		AttachmentURL: l.AttachmentURL,
		Status:        string(l.Status),
		HrdNote:       l.HrdNote,
		ReviewedBy:    l.ReviewedBy,
		CreatedAt:     createdAt,
	}
}

func leaveResponseFromSummary(s dleave.RequestSummary) LeaveResponse {
	r := leaveResponseFromDomain(s.LeaveRequest)
	r.EmployeeName = s.EmployeeName
	r.EmployeeDepartment = s.EmployeeDepartment
	r.EmployeePosition = s.EmployeePosition
	r.LeaveTypeName = s.LeaveTypeName
	return r
}

func CreateLeaveRequest_(w http.ResponseWriter, r *http.Request) {
	userID := int32(r.Context().Value(middleware.UserIDKey).(float64))

	// Parse multipart form (max 10MB)
	r.ParseMultipartForm(10 << 20)

	leaveTypeIDStr := r.FormValue("leave_type_id")
	startDate := r.FormValue("start_date")
	endDate := r.FormValue("end_date")
	reason := r.FormValue("reason")

	leaveTypeID, _ := strconv.Atoi(leaveTypeIDStr)

	// Handle file upload (opsional)
	attachmentURL := ""
	file, header, fileErr := r.FormFile("attachment")
	if fileErr == nil && file != nil {
		defer file.Close()
		// Buat folder uploads jika belum ada
		os.MkdirAll("uploads", os.ModePerm)
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("uploads/%d_%d%s", userID, time.Now().UnixNano(), ext)
		dst, err := os.Create(filename)
		if err == nil {
			defer dst.Close()
			io.Copy(dst, file)
			attachmentURL = "/" + filename
		}
	}

	created, err := LeaveService.SubmitRequest(r.Context(), userID, int32(leaveTypeID), startDate, endDate, reason, attachmentURL)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if errors.Is(err, application.ErrEmployeeNotFound) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Data karyawan tidak ditemukan"})
			return
		}
		if errors.Is(err, application.ErrValidation) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Semua field wajib diisi"})
			return
		}
		if errors.Is(err, dleave.ErrInvalidDateRange) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Rentang tanggal tidak valid"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengajukan cuti"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(leaveResponseFromDomain(created))
}

func GetMyLeaves(w http.ResponseWriter, r *http.Request) {
	userID := int32(r.Context().Value(middleware.UserIDKey).(float64))
	leaves, err := LeaveService.MyRequests(r.Context(), userID)
	if err != nil {
		if errors.Is(err, application.ErrEmployeeNotFound) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Data karyawan tidak ditemukan"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengambil data"})
		return
	}

	result := make([]LeaveResponse, len(leaves))
	for i, l := range leaves {
		result[i] = leaveResponseFromDomain(l)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func GetMyBalances(w http.ResponseWriter, r *http.Request) {
	userID := int32(r.Context().Value(middleware.UserIDKey).(float64))
	
	// Gunakan tahun ini sebagai default
	balances, err := LeaveService.MyBalances(r.Context(), userID, 2024) 
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengambil data saldo"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(balances)
}

func GetAllLeaves(w http.ResponseWriter, r *http.Request) {
	list, _ := LeaveService.AllRequestsForHR(r.Context())
	result := make([]LeaveResponse, len(list))
	for i, item := range list {
		result[i] = leaveResponseFromSummary(item)
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

	userID := int32(r.Context().Value(middleware.UserIDKey).(float64))
	var req UpdateLeaveStatusRequest
	json.NewDecoder(r.Body).Decode(&req)

	leaveRow, err := LeaveService.SetStatus(r.Context(), userID, int32(id), req.Status, req.HrdNote)
	if err != nil {
		if errors.Is(err, dleave.ErrInvalidDecision) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Status harus approved atau rejected"})
			return
		}
		if errors.Is(err, application.ErrEmployeeNotFound) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Data reviewer tidak ditemukan"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal update status"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(leaveResponseFromDomain(leaveRow))
}

func GetLeaveTypes(w http.ResponseWriter, r *http.Request) {
	types, _ := LeaveService.LeaveTypes(r.Context())
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(types)
}

func DeleteLeaveRequest(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID tidak valid"})
		return
	}

	if err := LeaveService.DeleteRequest(r.Context(), int32(id)); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal menghapus pengajuan cuti"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Pengajuan cuti berhasil dihapus"})
}
