package application

import (
	"context"

	"hr-leave-system/internal/domain/reporting"
)

type ReportingService struct {
	reporting reporting.Repository
}

func NewReportingService(r reporting.Repository) *ReportingService {
	return &ReportingService{reporting: r}
}

func (s *ReportingService) DashboardStats(ctx context.Context) (reporting.DashboardStats, error) {
	return s.reporting.DashboardStats(ctx)
}

func (s *ReportingService) MonthlyLeaveStats(ctx context.Context) ([]reporting.MonthlyLeaveStat, error) {
	stats, err := s.reporting.MonthlyLeaveStats(ctx)
	if err != nil {
		return []reporting.MonthlyLeaveStat{}, nil
	}
	return stats, nil
}

func (s *ReportingService) Departments(ctx context.Context) ([]reporting.Department, error) {
	list, err := s.reporting.Departments(ctx)
	if err != nil {
		return []reporting.Department{}, nil
	}
	return list, nil
}

func (s *ReportingService) Positions(ctx context.Context) ([]reporting.Position, error) {
	list, err := s.reporting.Positions(ctx)
	if err != nil {
		return []reporting.Position{}, nil
	}
	return list, nil
}

func (s *ReportingService) LeaveRecapPerDepartment(ctx context.Context) ([]reporting.DepartmentLeaveRecap, error) {
	list, err := s.reporting.LeaveRecapPerDepartment(ctx)
	if err != nil {
		return []reporting.DepartmentLeaveRecap{}, nil
	}
	return list, nil
}
