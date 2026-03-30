package reporting

import "context"

type Repository interface {
	DashboardStats(ctx context.Context) (DashboardStats, error)
	MonthlyLeaveStats(ctx context.Context) ([]MonthlyLeaveStat, error)
	Departments(ctx context.Context) ([]Department, error)
	Positions(ctx context.Context) ([]Position, error)
	LeaveRecapPerDepartment(ctx context.Context) ([]DepartmentLeaveRecap, error)
}
