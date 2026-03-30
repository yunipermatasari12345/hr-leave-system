package persistence

import (
	"context"
	"database/sql"

	db "hr-leave-system/internal/db"
	"hr-leave-system/internal/domain/reporting"
)

type reportingRepository struct {
	q *db.Queries
}

func NewReportingRepository(raw *sql.DB) reporting.Repository {
	return &reportingRepository{q: db.New(raw)}
}

func (r *reportingRepository) DashboardStats(ctx context.Context) (reporting.DashboardStats, error) {
	row, err := r.q.GetDashboardStats(ctx)
	if err != nil {
		return reporting.DashboardStats{}, err
	}
	return reporting.DashboardStats{
		TotalEmployees: row.TotalEmployees,
		PendingToday:   row.PendingToday,
		TotalApproved:  row.TotalApproved,
		TotalPending:   row.TotalPending,
		TotalRejected:  row.TotalRejected,
	}, nil
}

func (r *reportingRepository) MonthlyLeaveStats(ctx context.Context) ([]reporting.MonthlyLeaveStat, error) {
	rows, err := r.q.GetMonthlyLeaveStats(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]reporting.MonthlyLeaveStat, len(rows))
	for i := range rows {
		out[i] = reporting.MonthlyLeaveStat{Month: rows[i].Month, Total: rows[i].Total}
	}
	return out, nil
}

func (r *reportingRepository) Departments(ctx context.Context) ([]reporting.Department, error) {
	rows, err := r.q.GetDepartments(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]reporting.Department, len(rows))
	for i := range rows {
		d := reporting.Department{
			ID:   rows[i].ID,
			Name: rows[i].Name,
		}
		if rows[i].Description.Valid {
			d.Description = rows[i].Description.String
		}
		out[i] = d
	}
	return out, nil
}

func (r *reportingRepository) Positions(ctx context.Context) ([]reporting.Position, error) {
	rows, err := r.q.GetPositions(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]reporting.Position, len(rows))
	for i := range rows {
		p := reporting.Position{
			ID:   rows[i].ID,
			Name: rows[i].Name,
		}
		if rows[i].Level.Valid {
			p.Level = rows[i].Level.Int32
		}
		out[i] = p
	}
	return out, nil
}

func (r *reportingRepository) LeaveRecapPerDepartment(ctx context.Context) ([]reporting.DepartmentLeaveRecap, error) {
	rows, err := r.q.GetLeaveRecapPerDepartment(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]reporting.DepartmentLeaveRecap, len(rows))
	for i := range rows {
		out[i] = reporting.DepartmentLeaveRecap{
			Department:  rows[i].Department,
			TotalLeaves: rows[i].TotalLeaves,
			TotalDays:   rows[i].TotalDays,
		}
	}
	return out, nil
}
