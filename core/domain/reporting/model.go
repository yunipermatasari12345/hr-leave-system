package reporting

type DashboardStats struct {
	TotalEmployees int64 `json:"total_employees"`
	PendingToday   int64 `json:"pending_today"`
	TotalApproved  int64 `json:"total_approved"`
	TotalPending   int64 `json:"total_pending"`
	TotalRejected  int64 `json:"total_rejected"`
}

type MonthlyLeaveStat struct {
	Month string `json:"month"`
	Total int64  `json:"total"`
}

type Department struct {
	ID          int32  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Position struct {
	ID    int32  `json:"id"`
	Name  string `json:"name"`
	Level int32  `json:"level"`
}

type DepartmentLeaveRecap struct {
	Department  string `json:"department"`
	TotalLeaves int64  `json:"total_leaves"`
	TotalDays   int32  `json:"total_days"`
}
