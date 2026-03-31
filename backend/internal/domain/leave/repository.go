package leave

import (
	"context"
	"time"
)

type Repository interface {
	Create(ctx context.Context, employeeID, leaveTypeID int32, start, end time.Time, totalDays int32, reason string) (LeaveRequest, error)
	ListByEmployee(ctx context.Context, employeeID int32) ([]LeaveRequest, error)
	ListAllWithEmployee(ctx context.Context) ([]RequestSummary, error)
	GetByID(ctx context.Context, id int32) (LeaveRequest, error)
	UpdateStatus(ctx context.Context, id int32, status Status, hrdNote string, reviewedByEmployeeID int32) (LeaveRequest, error)
	ListLeaveTypes(ctx context.Context) ([]LeaveType, error)
	ListAdvanced(ctx context.Context, statusFilter, departmentFilter string) ([]RequestSummary, error)
	GetBalance(ctx context.Context, employeeID int32, year int32) ([]LeaveBalance, error)
	UpdateBalance(ctx context.Context, employeeID int32, leaveTypeID int32, year int32, daysUsed int32) error
}
