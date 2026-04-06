package application

import (
	"context"
	"time"

	"hr-leave-system/internal/domain/employee"
	"hr-leave-system/internal/domain/leave"
	"hr-leave-system/internal/domain/notification"
)

type LeaveService struct {
	leaves    leave.Repository
	employees employee.Repository
	notifs    notification.Repository
}

func NewLeaveService(
	leaves leave.Repository,
	employees employee.Repository,
	notifs notification.Repository,
) *LeaveService {
	return &LeaveService{
		leaves:    leaves,
		employees: employees,
		notifs:    notifs,
	}
}

func (s *LeaveService) SubmitRequest(ctx context.Context, userID int32, leaveTypeID int32, startStr, endStr, reason, attachmentURL string) (leave.LeaveRequest, error) {
	emp, err := s.employees.GetByUserID(ctx, userID)
	if err != nil {
		return leave.LeaveRequest{}, ErrEmployeeNotFound
	}
	if startStr == "" || endStr == "" || reason == "" {
		return leave.LeaveRequest{}, ErrValidation
	}
	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		return leave.LeaveRequest{}, ErrValidation
	}
	end, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		return leave.LeaveRequest{}, ErrValidation
	}
	days, err := leave.ComputeTotalDays(start, end)
	if err != nil {
		return leave.LeaveRequest{}, err
	}
	req, err := s.leaves.Create(ctx, emp.ID, leaveTypeID, start, end, days, reason, attachmentURL)
	if err == nil {
		_ = s.leaves.CreateHistory(ctx, req.ID, "SUBMITTED", reason, 0)
	}
	return req, err
}

func (s *LeaveService) MyRequests(ctx context.Context, userID int32) ([]leave.LeaveRequest, error) {
	emp, err := s.employees.GetByUserID(ctx, userID)
	if err != nil {
		return nil, ErrEmployeeNotFound
	}
	list, err := s.leaves.ListByEmployee(ctx, emp.ID)
	if err != nil {
		return []leave.LeaveRequest{}, nil
	}
	return list, nil
}

func (s *LeaveService) AllRequestsForHR(ctx context.Context) ([]leave.RequestSummary, error) {
	list, err := s.leaves.ListAllWithEmployee(ctx)
	if err != nil {
		return []leave.RequestSummary{}, nil
	}
	return list, nil
}

func (s *LeaveService) SetStatus(ctx context.Context, reviewerUserID int32, leaveID int32, statusStr, hrdNote string) (leave.LeaveRequest, error) {
	st, err := leave.ParseReviewDecision(statusStr)
	if err != nil {
		return leave.LeaveRequest{}, err
	}

	var reviewerID int32 = 0
	if reviewerUserID != 0 {
		reviewer, err := s.employees.GetByUserID(ctx, reviewerUserID)
		if err != nil {
			return leave.LeaveRequest{}, ErrEmployeeNotFound
		}
		reviewerID = reviewer.ID
	}

	// 1. Dapatkan detail lama untuk memastikan status belum approved
	oldDetail, err := s.leaves.GetByID(ctx, leaveID)
	if err != nil {
		return leave.LeaveRequest{}, err
	}

	updated, err := s.leaves.UpdateStatus(ctx, leaveID, st, hrdNote, reviewerID)
	if err != nil {
		return leave.LeaveRequest{}, err
	}

	// 2. Jika status berubah dari pending ke approved, kurangi kuota
	if oldDetail.Status == leave.StatusPending && st == leave.StatusApproved {
		// Sync saldo dulu agar record exist (mengurangi kemungkinan error)
		year := int32(oldDetail.StartDate.Year())
		_ = s.SyncBalances(ctx, oldDetail.EmployeeID, year)

		err = s.leaves.UpdateBalance(ctx, oldDetail.EmployeeID, oldDetail.LeaveTypeID, year, oldDetail.TotalDays)
		if err != nil {
			// Logika fallback error handling apabila kurang balance, tapi karena sudah di-approve kita biarkan dulu
		}
	}

	detail, err := s.leaves.GetByID(ctx, leaveID)
	if err != nil {
		detail = updated
	}
	emp, err := s.employees.GetByID(ctx, detail.EmployeeID)
	if err == nil {
		statusText := "disetujui"
		action := "APPROVED"
		if st == leave.StatusRejected {
			statusText = "ditolak"
			action = "REJECTED"
		}
		_ = s.notifs.Create(ctx, emp.UserID, "Pengajuan cuti kamu telah "+statusText)
		_ = s.leaves.CreateHistory(ctx, detail.ID, action, hrdNote, reviewerID)
	}
	return updated, nil
}

func (s *LeaveService) LeaveTypes(ctx context.Context) ([]leave.LeaveType, error) {
	return s.leaves.ListLeaveTypes(ctx)
}

func (s *LeaveService) MyBalances(ctx context.Context, userID int32, year int32) ([]leave.LeaveBalance, error) {
	emp, err := s.employees.GetByUserID(ctx, userID)
	if err != nil {
		return nil, ErrEmployeeNotFound
	}
	// Sync saldo setiap kali cek agar jika ada tipe cuti baru langsung muncul
	_ = s.SyncBalances(ctx, emp.ID, year)
	return s.leaves.GetBalance(ctx, emp.ID, year)
}

func (s *LeaveService) AdvancedFilter(ctx context.Context, statusFilter, departmentFilter string) ([]leave.RequestSummary, error) {
	list, err := s.leaves.ListAdvanced(ctx, statusFilter, departmentFilter)
	if err != nil {
		return []leave.RequestSummary{}, nil
	}
	return list, nil
}

func (s *LeaveService) DeleteRequest(ctx context.Context, id int32) error {
	// 1. Ambil data sebelum dihapus untuk cek status
	req, err := s.leaves.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// 2. Jika status approved, kembalikan saldo (Refund)
	if req.Status == leave.StatusApproved {
		year := int32(req.StartDate.Year())
		// Gunakan angka negatif untuk menambah saldo kembali di UpdateBalance
		_ = s.leaves.UpdateBalance(ctx, req.EmployeeID, req.LeaveTypeID, year, -req.TotalDays)
	}

	return s.leaves.Delete(ctx, id)
}

func (s *LeaveService) SyncBalances(ctx context.Context, employeeID int32, year int32) error {
	// 1. Dapatkan semua tipe cuti
	types, err := s.leaves.ListLeaveTypes(ctx)
	if err != nil {
		return err
	}

	// 2. Pastikan setiap tipe cuti punya record di leave_balances untuk tahun ini
	for _, t := range types {
		_ = s.leaves.EnsureBalance(ctx, employeeID, t.ID, year, t.MaxDays)
	}
	return nil
}
