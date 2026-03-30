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
	ID           int32
	EmployeeID   int32
	LeaveTypeID  int32
	StartDate    time.Time
	EndDate      time.Time
	TotalDays    int32
	Reason       string
	Status       Status
	HrdNote      string
	ReviewedBy   int32
	CreatedAt    time.Time
	HasCreatedAt bool
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
	return int32(end.Sub(start).Hours()/24) + 1, nil
}
