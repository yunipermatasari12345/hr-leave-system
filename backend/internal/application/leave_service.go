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

func (s *LeaveService) SubmitRequest(ctx context.Context, userID int32, leaveTypeID int32, startStr, endStr, reason string) (leave.LeaveRequest, error) {
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
	return s.leaves.Create(ctx, emp.ID, leaveTypeID, start, end, days, reason)
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
	reviewer, err := s.employees.GetByUserID(ctx, reviewerUserID)
	if err != nil {
		return leave.LeaveRequest{}, ErrEmployeeNotFound
	}
	updated, err := s.leaves.UpdateStatus(ctx, leaveID, st, hrdNote, reviewer.ID)
	if err != nil {
		return leave.LeaveRequest{}, err
	}
	detail, err := s.leaves.GetByID(ctx, leaveID)
	if err != nil {
		detail = updated
	}
	emp, err := s.employees.GetByID(ctx, detail.EmployeeID)
	if err == nil {
		statusText := "disetujui"
		if st == leave.StatusRejected {
			statusText = "ditolak"
		}
		_ = s.notifs.Create(ctx, emp.UserID, "Pengajuan cuti kamu telah "+statusText)
	}
	return updated, nil
}

func (s *LeaveService) LeaveTypes(ctx context.Context) ([]leave.LeaveType, error) {
	return s.leaves.ListLeaveTypes(ctx)
}

func (s *LeaveService) AdvancedFilter(ctx context.Context, statusFilter, departmentFilter string) ([]leave.RequestSummary, error) {
	list, err := s.leaves.ListAdvanced(ctx, statusFilter, departmentFilter)
	if err != nil {
		return []leave.RequestSummary{}, nil
	}
	return list, nil
}
