package leave

import (
	"time"
)

type Status string

const (
	StatusPending  Status = "pending"
	StatusApproved Status = "approved"
	StatusRejected Status = "rejected"
)

type LeaveRequest struct {
	ID            int32
	EmployeeID    int32
	LeaveTypeID   int32
	StartDate     time.Time
	EndDate       time.Time
	TotalDays     int32
	Reason        string
	AttachmentURL string
	Status        Status
	HrdNote       string
	ReviewedBy    int32
	CreatedAt     time.Time
	HasCreatedAt  bool
}

type RequestSummary struct {
	LeaveRequest
	EmployeeName       string
	EmployeeDepartment string
	EmployeePosition   string
}

type LeaveType struct {
	ID          int32  `json:"id"`
	Name        string `json:"name"`
	MaxDays     int32  `json:"max_days"`
	Description string `json:"description"`
}

type LeaveBalance struct {
	ID            int32 `json:"id"`
	EmployeeID    int32 `json:"employee_id"`
	LeaveTypeID   int32 `json:"leave_type_id"`
	LeaveTypeName string `json:"leave_type_name"`
	Year          int32 `json:"year"`
	TotalDays     int32 `json:"total_days"`
	UsedDays      int32 `json:"used_days"`
	RemainingDays int32 `json:"remaining_days"`
}

func ParseReviewDecision(status string) (Status, error) {
	switch status {
	case string(StatusApproved), string(StatusRejected):
		return Status(status), nil
	default:
		return "", ErrInvalidDecision
	}
}

func ComputeTotalDays(start, end time.Time) (int32, error) {
	if end.Before(start) {
		return 0, ErrInvalidDateRange
	}
	
	start = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, start.Location())
	end = time.Date(end.Year(), end.Month(), end.Day(), 0, 0, 0, 0, end.Location())

	var totalDays int32 = 0
	current := start
	for !current.After(end) {
		if current.Weekday() != time.Saturday && current.Weekday() != time.Sunday {
			totalDays++
		}
		current = current.AddDate(0, 0, 1)
	}

	if totalDays == 0 {
		return 0, ErrInvalidDateRange
	}

	return totalDays, nil
}
