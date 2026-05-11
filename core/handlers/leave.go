package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"hr-leave-system/core/application"
	dleave "hr-leave-system/core/domain/leave"
	"hr-leave-system/core/middleware"
	"io"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/go-chi/chi/v5"
)

const maxAttachmentBytes = 10 << 20

type UpdateLeaveStatusRequest struct {
	Status  string `json:"status"`
	HrdNote string `json:"hrd_note"`
}

type LeaveResponse struct {
	ID                    int32  `json:"id"`
	EmployeeID            int32  `json:"employee_id"`
	EmployeeName          string `json:"employee_name"`
	EmployeeDepartment    string `json:"employee_department"`
	EmployeePosition      string `json:"employee_position"`
	LeaveTypeID           int32  `json:"leave_type_id"`
	LeaveTypeName         string `json:"leave_type_name"`
	StartDate             string `json:"start_date"`
	EndDate               string `json:"end_date"`
	TotalDays             int32  `json:"total_days"`
	Reason                string `json:"reason"`
	AttachmentURL         string `json:"attachment_url"`
	HasAttachment         bool   `json:"has_attachment"`
	AttachmentFilename    string `json:"attachment_filename"`
	AttachmentContentType string `json:"attachment_content_type,omitempty"`
	Status                string `json:"status"`
	HrdNote               string `json:"hrd_note"`
	ReviewedBy            int32  `json:"reviewed_by"`
	CreatedAt             string `json:"created_at"`
}

func leaveResponseFromDomain(l dleave.LeaveRequest) LeaveResponse {
	createdAt := ""
	if l.HasCreatedAt {
		createdAt = l.CreatedAt.Format("2006-01-02")
	}
	hasAtt := l.HasBinaryAttachment || l.AttachmentURL != ""
	return LeaveResponse{
		ID:                    l.ID,
		EmployeeID:            l.EmployeeID,
		LeaveTypeID:           l.LeaveTypeID,
		LeaveTypeName:         l.LeaveTypeName,
		StartDate:             l.StartDate.Format("2006-01-02"),
		EndDate:               l.EndDate.Format("2006-01-02"),
		TotalDays:             l.TotalDays,
		Reason:                l.Reason,
		AttachmentURL:         l.AttachmentURL,
		HasAttachment:         hasAtt,
		AttachmentFilename:    l.AttachmentFilename,
		AttachmentContentType: l.AttachmentContentType,
		Status:                string(l.Status),
		HrdNote:               l.HrdNote,
		ReviewedBy:            l.ReviewedBy,
		CreatedAt:             createdAt,
	}
}

func leaveResponseFromSummary(s dleave.RequestSummary) LeaveResponse {
	r := leaveResponseFromDomain(s.LeaveRequest)
	r.EmployeeName = s.EmployeeName
	r.EmployeeDepartment = s.EmployeeDepartment
	r.EmployeePosition = s.EmployeePosition
	if s.LeaveTypeName != "" {
		r.LeaveTypeName = s.LeaveTypeName
	}
	return r
}

func parseMultipartAttachment(r *http.Request, field string) (*dleave.AttachmentInput, error) {
	file, header, ferr := r.FormFile(field)
	if ferr != nil || file == nil {
		return nil, nil
	}
	defer file.Close()
	raw, err := io.ReadAll(io.LimitReader(file, maxAttachmentBytes+1))
	if err != nil {
		return nil, err
	}
	if len(raw) > maxAttachmentBytes {
		return nil, errors.New("file terlalu besar")
	}
	if len(raw) == 0 {
		return nil, nil
	}
	ctype := header.Header.Get("Content-Type")
	if ctype == "" {
		n := 512
		if len(raw) < n {
			n = len(raw)
		}
		ctype = http.DetectContentType(raw[:n])
	}
	fname := header.Filename
	if fname == "" {
		fname = "lampiran"
	}
	return &dleave.AttachmentInput{Data: raw, ContentType: ctype, Filename: filepath.Base(fname)}, nil
}

func CreateLeaveRequest_(w http.ResponseWriter, r *http.Request) {
	userID := int32(r.Context().Value(middleware.UserIDKey).(float64))

	// Parse multipart form (max 10MB)
	r.ParseMultipartForm(maxAttachmentBytes)

	leaveTypeIDStr := r.FormValue("leave_type_id")
	startDate := r.FormValue("start_date")
	endDate := r.FormValue("end_date")
	reason := r.FormValue("reason")

	leaveTypeID, _ := strconv.Atoi(leaveTypeIDStr)

	var att *dleave.AttachmentInput
	a, formErr := parseMultipartAttachment(r, "attachment")
	if formErr != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "File lampiran tidak valid atau terlalu besar"})
		return
	}
	att = a

	attachmentURL := ""
	if att == nil || len(att.Data) == 0 {
		att = nil
	}

	created, err := LeaveService.SubmitRequest(r.Context(), userID, int32(leaveTypeID), startDate, endDate, reason, attachmentURL, att)
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

func GetLeaveAttachmentEmployee(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, convErr := strconv.Atoi(idStr)
	if convErr != nil || id <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID tidak valid"})
		return
	}
	userID := int32(r.Context().Value(middleware.UserIDKey).(float64))
	data, ctype, fname, err := LeaveService.GetAttachment(r.Context(), userID, int32(id), false)
	writeAttachment(w, err, ctype, fname, data)
}

func GetLeaveAttachmentHR(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, convErr := strconv.Atoi(idStr)
	if convErr != nil || id <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID tidak valid"})
		return
	}
	userID := int32(r.Context().Value(middleware.UserIDKey).(float64))
	data, ctype, fname, err := LeaveService.GetAttachment(r.Context(), userID, int32(id), true)
	writeAttachment(w, err, ctype, fname, data)
}

func writeAttachment(w http.ResponseWriter, err error, ctype, fname string, data []byte) {
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case errors.Is(err, dleave.ErrAttachmentNotFound):
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Lampiran tidak ada atau kedaluwarsa"})
		case errors.Is(err, application.ErrUnauthorized):
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "Tidak diizinkan melihat lampiran ini"})
		case errors.Is(err, application.ErrEmployeeNotFound):
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Data karyawan tidak ditemukan"})
		default:
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengambil lampiran"})
		}
		return
	}

	w.Header().Del("Content-Type")
	w.Header().Set("Content-Type", ctype)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`inline; filename=%q`, filepath.Base(fname)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
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

func CreateManualLeaveHR(w http.ResponseWriter, r *http.Request) {
	hrUserID := int32(r.Context().Value(middleware.UserIDKey).(float64))

	r.ParseMultipartForm(maxAttachmentBytes)

	targetEmployeeIDStr := r.FormValue("employee_id")
	leaveTypeIDStr := r.FormValue("leave_type_id")
	startDate := r.FormValue("start_date")
	endDate := r.FormValue("end_date")
	reason := r.FormValue("reason")

	targetEmployeeID, _ := strconv.Atoi(targetEmployeeIDStr)
	leaveTypeID, _ := strconv.Atoi(leaveTypeIDStr)

	a, formErr := parseMultipartAttachment(r, "attachment")
	if formErr != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "File lampiran tidak valid atau terlalu besar"})
		return
	}
	att := a
	if att == nil || len(att.Data) == 0 {
		att = nil
	}

	attachmentURL := ""
	created, err := LeaveService.SubmitManualRequest(r.Context(), hrUserID, int32(targetEmployeeID), int32(leaveTypeID), startDate, endDate, reason, attachmentURL, att)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if errors.Is(err, application.ErrValidation) || errors.Is(err, dleave.ErrInvalidDateRange) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Data cuti tidak valid"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal menyimpan cuti manual"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(leaveResponseFromDomain(created))
}
